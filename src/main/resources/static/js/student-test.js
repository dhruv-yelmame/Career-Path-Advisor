document.addEventListener("DOMContentLoaded", async () => {

    const params = new URLSearchParams(window.location.search);
    const testId = params.get("testId") || params.get("id");

    const token = localStorage.getItem("studentToken") || localStorage.getItem("token");
    if (!token) {
        window.location.href = "/student-login.html";
        return;
    }

    function getStudentId() {
        const studentUser = localStorage.getItem("studentUser") || localStorage.getItem("user");
        if (studentUser) {
            try {
                const parsed = JSON.parse(studentUser);
                if (parsed.id || parsed.userId) return parsed.id || parsed.userId;
            } catch (e) {}
        }
        return localStorage.getItem("studentId") || localStorage.getItem("userId") || 1;
    }

    let studentId = getStudentId();

    if (!testId) {
        showError("Invalid Request", "No assessment ID was provided in the URL. Please browse available tests.");
        return;
    }

    let attemptId = null;
    let questions = [];
    let currentIndex = 0;
    const answers = {};
    const markedQuestions = new Set();
    let remainingSeconds = 0;
    let timerInterval = null;
    let tabSwitchCount = 0;

    // DOM Elements
    const nextBtn = document.getElementById("nextBtn");
    const previousBtn = document.getElementById("previousBtn");
    const markReviewBtn = document.getElementById("markReviewBtn");
    const clearChoiceBtn = document.getElementById("clearChoiceBtn");
    const submitTestBtn = document.getElementById("submitTestBtn");
    const cancelSubmitBtn = document.getElementById("cancelSubmitBtn");
    const confirmSubmitBtn = document.getElementById("confirmSubmitBtn");
    const autoSubmitBtn = document.getElementById("autoSubmitBtn");

    nextBtn?.addEventListener("click", nextQuestion);
    previousBtn?.addEventListener("click", previousQuestion);
    markReviewBtn?.addEventListener("click", toggleMarkReview);
    clearChoiceBtn?.addEventListener("click", clearCurrentChoice);
    submitTestBtn?.addEventListener("click", openSubmitModal);
    cancelSubmitBtn?.addEventListener("click", closeSubmitModal);
    confirmSubmitBtn?.addEventListener("click", submitTest);
    autoSubmitBtn?.addEventListener("click", autoSubmit);

    // Setup helpers
    setupSecurityListeners();
    setupKeyboardShortcuts();
    setupFullscreen();

    // Start loading test
    await loadTest();

    function getAuthHeaders() {
        const t = localStorage.getItem("studentToken") || localStorage.getItem("token") || localStorage.getItem("adminToken");
        return {
            "Accept": "application/json",
            "Content-Type": "application/json",
            ...(t ? { "Authorization": "Bearer " + t } : {})
        };
    }

    async function loadTest() {
        try {
            showLoading(true);

            const response = await fetch(
                `/api/student/tests/${testId}/start?studentId=${studentId}`,
                {
                    method: "POST",
                    headers: getAuthHeaders()
                }
            );

            const data = await readResponse(response);

            if (!response.ok) {
                const errMsg = getError(data) || "Unable to start assessment.";
                let title = "Unable to Start Assessment";
                if (errMsg.toLowerCase().includes("inactive")) {
                    title = "Assessment Inactive";
                } else if (errMsg.toLowerCase().includes("24 hours") || errMsg.toLowerCase().includes("already completed")) {
                    title = "Assessment Already Completed";
                }
                showError(title, errMsg);
                return;
            }

            attemptId = data.attemptId || data.id;

            setText("testName", data.testName || data.test?.testName || "Career Aptitude Assessment");

            if (Array.isArray(data.questions) && data.questions.length > 0) {
                questions = data.questions;
                currentIndex = 0;
                createQuestionNavigation();
                renderQuestion();
            } else {
                await loadQuestions();
            }

            if (data.expiresAt) {
                const deadline = new Date(data.expiresAt).getTime();
                const now = new Date().getTime();
                remainingSeconds = Math.max(10, Math.floor((deadline - now) / 1000));
                startTimerLoop();
            } else {
                await loadRemainingTime();
            }

        } catch (error) {
            console.error("Test start error:", error);
            showError("Unable to Load Assessment", error.message);
        }
    }

    async function loadQuestions() {
        try {
            const response = await fetch(
                `/api/student/tests/attempt/${attemptId}/questions?studentId=${studentId}`,
                { headers: getAuthHeaders() }
            );

            if (!response.ok) {
                const data = await readResponse(response);
                throw new Error(getError(data) || "Failed to load test questions.");
            }

            questions = await response.json();

            if (!Array.isArray(questions) || questions.length === 0) {
                throw new Error("This assessment contains no questions. Please contact the administrator.");
            }

            currentIndex = 0;
            createQuestionNavigation();
            renderQuestion();

        } catch (error) {
            console.error("Questions load error:", error);
            showError("Assessment Setup Incomplete", error.message);
        }
    }

    async function loadOptionsForCurrentQuestion() {
        const item = questions[currentIndex];
        if (!item) return;

        if (Array.isArray(item.options) && item.options.length > 0) {
            return;
        }

        const questionId = item.questionId || item.id || item.question?.id;
        if (!questionId) return;

        try {
            const response = await fetch(
                `/api/student/tests/question/${questionId}/options`,
                { headers: getAuthHeaders() }
            );

            if (response.ok) {
                item.options = await response.json();
            }
        } catch (e) {
            console.warn("Could not fetch options separately:", e);
        }
    }

    function renderQuestion() {
        const item = questions[currentIndex];
        if (!item) return;

        const loading = document.getElementById("loadingContainer");
        const questionArea = document.getElementById("questionContainer");
        const errorArea = document.getElementById("errorContainer");

        if (loading) loading.hidden = true;
        if (errorArea) errorArea.hidden = true;
        if (questionArea) questionArea.hidden = false;

        const qId = item.questionId || item.id || item.question?.id;
        const qText = item.questionText || item.question?.questionText || "Question";
        let qType = item.questionType || item.question?.questionType || "ASSESSMENT";
        if (typeof qType === "object" && qType.name) qType = qType.name;

        const formattedType = qType === "INTEREST" ? "Career Interest Evaluation" : (qType === "CORRECT_ANSWER" ? "Knowledge & Aptitude MCQ" : qType);

        setText("questionNumber", `Question ${currentIndex + 1}`);
        setText("questionText", qText);
        setText("questionType", formattedType);
        setText("questionProgress", `Question ${currentIndex + 1} of ${questions.length}`);
        setText("navigationCount", `${getAnsweredCount()} / ${questions.length} Answered`);

        updateProgressBar();

        const container = document.getElementById("optionsContainer");
        if (!container) return;

        container.innerHTML = "";
        const options = item.options || [];
        const optionLabels = ["A", "B", "C", "D", "E", "F"];

        if (options.length === 0) {
            container.innerHTML = `<p style="color: var(--student-text-muted); padding: 12px 0;">No options configured for this question.</p>`;
        }

        options.forEach((opt, idx) => {
            const label = document.createElement("div");
            label.className = "test-option";
            const optId = Number(opt.id);
            const isSelected = answers[qId] !== undefined && Number(answers[qId]) === optId;

            if (isSelected) label.classList.add("selected");

            label.innerHTML = `
                <input type="radio" name="question_option_${qId}" value="${optId}" ${isSelected ? "checked" : ""}>
                <div class="test-option-label">${optionLabels[idx] || (idx + 1)}</div>
                <div class="test-option-text">${escapeHtml(opt.optionText || "")}</div>
            `;

            // Bulletproof option selection handler
            const selectThisOption = () => {
                const radio = label.querySelector("input[type='radio']");
                if (radio) radio.checked = true;

                answers[qId] = optId;

                container.querySelectorAll(".test-option").forEach(el => el.classList.remove("selected"));
                label.classList.add("selected");

                updateNavigation();
                updateProgressBar();
            };

            label.addEventListener("click", selectThisOption);

            const radio = label.querySelector("input[type='radio']");
            if (radio) {
                radio.addEventListener("change", selectThisOption);
            }

            container.appendChild(label);
        });

        // Update action buttons & marked state
        if (markReviewBtn) {
            const isMarked = markedQuestions.has(qId);
            markReviewBtn.classList.toggle("active", isMarked);
            markReviewBtn.innerHTML = isMarked
                ? `<i class="bi bi-bookmark-fill"></i> Marked for Review`
                : `<i class="bi bi-bookmark"></i> Mark for Review`;
        }

        updateButtons();
        updateNavigation();
    }

    async function nextQuestion() {
        if (currentIndex >= questions.length - 1) {
            openSubmitModal();
            return;
        }

        currentIndex++;
        await loadOptionsForCurrentQuestion();
        renderQuestion();
    }

    async function previousQuestion() {
        if (currentIndex <= 0) return;

        currentIndex--;
        await loadOptionsForCurrentQuestion();
        renderQuestion();
    }

    function toggleMarkReview() {
        const item = questions[currentIndex];
        if (!item) return;

        const qId = item.questionId || item.id || item.question?.id;
        if (markedQuestions.has(qId)) {
            markedQuestions.delete(qId);
            if (window.AppToast) window.AppToast.info("Removed bookmark for Question " + (currentIndex + 1));
        } else {
            markedQuestions.add(qId);
            if (window.AppToast) window.AppToast.info("Marked Question " + (currentIndex + 1) + " for review");
        }

        renderQuestion();
    }

    function clearCurrentChoice() {
        const item = questions[currentIndex];
        if (!item) return;

        const qId = item.questionId || item.id || item.question?.id;
        delete answers[qId];

        renderQuestion();
        if (window.AppToast) window.AppToast.info("Selection cleared for Question " + (currentIndex + 1));
    }

    function createQuestionNavigation() {
        const container = document.getElementById("questionNumbers");
        if (!container) return;

        container.innerHTML = "";

        questions.forEach((q, index) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "question-number-btn";
            btn.textContent = index + 1;
            btn.title = `Jump to Question ${index + 1}`;

            btn.addEventListener("click", async () => {
                currentIndex = index;
                await loadOptionsForCurrentQuestion();
                renderQuestion();
            });

            container.appendChild(btn);
        });

        updateNavigation();
    }

    function updateNavigation() {
        const buttons = document.querySelectorAll(".question-number-btn");
        buttons.forEach((btn, idx) => {
            btn.classList.toggle("current", idx === currentIndex);

            const item = questions[idx];
            const qId = item?.questionId || item?.id || item?.question?.id;

            const isAnswered = answers[qId] !== undefined;
            const isMarked = markedQuestions.has(qId);

            btn.classList.toggle("answered", isAnswered && !isMarked);
            btn.classList.toggle("marked", isMarked);
        });

        setText("navigationCount", `${getAnsweredCount()} / ${questions.length} Answered`);
    }

    function updateButtons() {
        if (previousBtn) previousBtn.disabled = currentIndex === 0;

        if (nextBtn) {
            nextBtn.innerHTML = currentIndex === questions.length - 1
                ? `<i class="bi bi-send-check"></i> Review & Submit`
                : `Next <i class="bi bi-arrow-right"></i>`;
        }
    }

    function updateProgressBar() {
        const bar = document.getElementById("testProgressBar");
        if (!bar || questions.length === 0) return;

        const answeredCount = getAnsweredCount();
        const percent = Math.round((answeredCount / questions.length) * 100);
        bar.style.width = `${percent}%`;
    }

    function getAnsweredCount() {
        return Object.keys(answers).length;
    }

    function startTimerLoop() {
        updateTimerDisplay();
        clearInterval(timerInterval);

        timerInterval = setInterval(() => {
            remainingSeconds--;
            updateTimerDisplay();

            if (remainingSeconds <= 0) {
                clearInterval(timerInterval);
                openAutoSubmitModal();
            }
        }, 1000);
    }

    async function loadRemainingTime() {
        if (!attemptId) return;

        try {
            const response = await fetch(
                `/api/student/tests/attempt/${attemptId}/remaining-time?studentId=${studentId}`,
                { headers: getAuthHeaders() }
            );

            if (response.ok) {
                remainingSeconds = Number(await response.json());
            } else {
                remainingSeconds = 15 * 60; // 15 min fallback
            }

            startTimerLoop();

        } catch (e) {
            console.warn("Could not fetch remaining time:", e);
            remainingSeconds = 15 * 60;
            startTimerLoop();
        }
    }

    function updateTimerDisplay() {
        const mins = Math.floor(Math.max(0, remainingSeconds) / 60);
        const secs = Math.max(0, remainingSeconds) % 60;

        setText("timer", `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`);

        const timerContainer = document.getElementById("timerContainer");
        if (timerContainer) {
            timerContainer.classList.toggle("danger", remainingSeconds <= 60);
            timerContainer.classList.toggle("warning", remainingSeconds > 60 && remainingSeconds <= 120);
        }
    }

    function openSubmitModal() {
        const answered = getAnsweredCount();
        const marked = markedQuestions.size;
        const unanswered = Math.max(0, questions.length - answered);

        setText("answeredCount", answered);
        setText("markedCount", marked);
        setText("unansweredCount", unanswered);

        const modal = document.getElementById("submitModal");
        if (modal) modal.hidden = false;
    }

    function closeSubmitModal() {
        const modal = document.getElementById("submitModal");
        if (modal) modal.hidden = true;
    }

    function openAutoSubmitModal() {
        const modal = document.getElementById("autoSubmitModal");
        if (modal) modal.hidden = false;

        // Auto submit after 2 seconds
        setTimeout(autoSubmit, 2000);
    }

    async function submitTest() {
        const answered = getAnsweredCount();
        if (answered === 0) {
            if (window.AppToast) window.AppToast.warning("Please answer at least one question before submitting.");
        }

        closeSubmitModal();
        if (!attemptId) {
            if (window.AppToast) window.AppToast.error("Test attempt ID not found.");
            return;
        }

        if (confirmSubmitBtn) confirmSubmitBtn.disabled = true;

        const payload = questions.map(q => {
            const qId = q.questionId || q.id || q.question?.id;
            const optId = answers[qId];
            return {
                questionId: Number(qId),
                optionId: optId !== undefined ? Number(optId) : null
            };
        }).filter(a => a.optionId !== null);

        try {
            const response = await fetch(
                `/api/student/tests/attempt/${attemptId}/submit?studentId=${studentId}`,
                {
                    method: "POST",
                    headers: getAuthHeaders(),
                    body: JSON.stringify(payload)
                }
            );

            const data = await readResponse(response);

            if (!response.ok) {
                throw new Error(getError(data) || "Failed to submit assessment.");
            }

            clearInterval(timerInterval);

            if (window.AppToast) {
                window.AppToast.success("Assessment submitted successfully! Generating career report...");
            }

            const resId = data.resultId || data.id || "";
            setTimeout(() => {
                if (resId) {
                    window.location.href = `result.html?resultId=${resId}`;
                } else {
                    window.location.href = "student-results.html";
                }
            }, 500);

        } catch (error) {
            console.error("Submission error:", error);
            if (window.AppToast) window.AppToast.error(error.message);
        } finally {
            if (confirmSubmitBtn) confirmSubmitBtn.disabled = false;
        }
    }

    async function autoSubmit() {
        const modal = document.getElementById("autoSubmitModal");
        if (modal) modal.hidden = true;

        try {
            const response = await fetch(
                `/api/student/tests/attempt/${attemptId}/auto-submit?studentId=${studentId}`,
                {
                    method: "POST",
                    headers: getAuthHeaders()
                }
            );

            const data = await readResponse(response);
            const resId = data?.resultId || data?.id || "";
            if (resId) {
                window.location.href = `result.html?resultId=${resId}`;
            } else {
                window.location.href = "student-results.html";
            }

        } catch (e) {
            window.location.href = "student-results.html";
        }
    }

    function setupSecurityListeners() {
        // Prevent right-click context menu during exam
        document.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            if (window.AppToast) window.AppToast.info("Right-click is disabled in secure assessment mode.");
        });

        // Tab switch / focus loss detection
        document.addEventListener("visibilitychange", () => {
            if (document.hidden) {
                tabSwitchCount++;
                if (window.AppToast) {
                    window.AppToast.error(`Security Alert: Window blur / tab switch detected (Warning #${tabSwitchCount})!`);
                }
            }
        });
    }

    function setupKeyboardShortcuts() {
        document.addEventListener("keydown", (e) => {
            if (document.getElementById("submitModal")?.hidden === false) return;

            if (e.key === "ArrowRight") {
                nextQuestion();
            } else if (e.key === "ArrowLeft") {
                previousQuestion();
            } else if (["1", "2", "3", "4", "a", "b", "c", "d", "A", "B", "C", "D"].includes(e.key)) {
                let index = -1;
                if (["1", "2", "3", "4"].includes(e.key)) index = Number(e.key) - 1;
                else {
                    const charCode = e.key.toUpperCase().charCodeAt(0);
                    index = charCode - 65; // A=0, B=1, etc.
                }

                const options = document.querySelectorAll(".test-option");
                if (options[index]) {
                    options[index].click();
                }
            }
        });
    }

    function setupFullscreen() {
        const btn = document.getElementById("fullscreenBtn");
        btn?.addEventListener("click", () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
                btn.innerHTML = `<i class="bi bi-fullscreen-exit"></i>`;
            } else {
                document.exitFullscreen().catch(() => {});
                btn.innerHTML = `<i class="bi bi-arrows-fullscreen"></i>`;
            }
        });
    }

    function showLoading(show) {
        const loading = document.getElementById("loadingContainer");
        const question = document.getElementById("questionContainer");
        const error = document.getElementById("errorContainer");

        if (loading) loading.hidden = !show;
        if (question) question.hidden = show;
        if (error) error.hidden = true;
    }

    function showError(title, message) {
        const loading = document.getElementById("loadingContainer");
        const question = document.getElementById("questionContainer");
        const error = document.getElementById("errorContainer");

        if (loading) loading.hidden = true;
        if (question) question.hidden = true;
        if (error) {
            error.hidden = false;
            setText("errorTitle", title || "Unable to Load Assessment");
            setText("errorMessage", message || "Something went wrong while loading the test.");
        }
    }

    async function readResponse(response) {
        const text = await response.text();
        if (!text) return {};
        try {
            return JSON.parse(text);
        } catch {
            return text;
        }
    }

    function getError(data) {
        if (typeof data === "string") return data;
        return data?.message || data?.error || "An error occurred.";
    }

    function setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    function escapeHtml(str) {
        const div = document.createElement("div");
        div.textContent = str ?? "";
        return div.innerHTML;
    }
});