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

    // Security & Anti-Cheating State
    let violationsCount = 0;
    const MAX_VIOLATIONS = 3;
    let isExamTerminated = false;
    let isSubmitting = false;
    let lastViolationTime = 0;
    let isExamStarted = false;

    // DOM Elements
    const nextBtn = document.getElementById("nextBtn");
    const previousBtn = document.getElementById("previousBtn");
    const markReviewBtn = document.getElementById("markReviewBtn");
    const clearChoiceBtn = document.getElementById("clearChoiceBtn");
    const submitTestBtn = document.getElementById("submitTestBtn");
    const headerSubmitBtn = document.getElementById("headerSubmitBtn");
    const cancelSubmitBtn = document.getElementById("cancelSubmitBtn");
    const confirmSubmitBtn = document.getElementById("confirmSubmitBtn");
    const autoSubmitBtn = document.getElementById("autoSubmitBtn");
    const fullscreenBtn = document.getElementById("fullscreenBtn");
    const acknowledgeViolationBtn = document.getElementById("acknowledgeViolationBtn");

    // Start Exam Fullscreen Modal Elements
    const startExamModal = document.getElementById("startExamModal");
    const startExamBtn = document.getElementById("startExamBtn");
    const startExamBtnText = document.getElementById("startExamBtnText");
    const startModalTitle = document.getElementById("startModalTitle");
    const startModalTestName = document.getElementById("startModalTestName");
    const startModalQuestionsCount = document.getElementById("startModalQuestionsCount");
    const startModalDuration = document.getElementById("startModalDuration");

    nextBtn?.addEventListener("click", nextQuestion);
    previousBtn?.addEventListener("click", previousQuestion);
    markReviewBtn?.addEventListener("click", toggleMarkReview);
    clearChoiceBtn?.addEventListener("click", clearCurrentChoice);
    submitTestBtn?.addEventListener("click", openSubmitModal);
    headerSubmitBtn?.addEventListener("click", openSubmitModal);
    cancelSubmitBtn?.addEventListener("click", closeSubmitModal);
    confirmSubmitBtn?.addEventListener("click", submitTest);
    autoSubmitBtn?.addEventListener("click", autoSubmit);

    startExamBtn?.addEventListener("click", () => {
        isExamStarted = true;
        if (startExamModal) startExamModal.hidden = true;
        enterFullscreen();
        startTimerLoop();
    });

    acknowledgeViolationBtn?.addEventListener("click", () => {
        const modal = document.getElementById("violationModal");
        if (modal) modal.hidden = true;
        enterFullscreen();
    });

    // Setup helpers
    setupSecurityListeners();
    setupKeyboardShortcuts();
    setupFullscreen();
    setupMobilePalette();

    // Attempt direct fullscreen right away
    enterFullscreen();

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

            // Initialize timer with remainingSeconds, timeLimitMinutes or expiresAt
            if (data.remainingSeconds !== undefined && data.remainingSeconds !== null && !isNaN(Number(data.remainingSeconds)) && Number(data.remainingSeconds) > 0) {
                remainingSeconds = Number(data.remainingSeconds);
            } else if (data.timeLimitMinutes && !isNaN(Number(data.timeLimitMinutes)) && Number(data.timeLimitMinutes) > 0) {
                remainingSeconds = Number(data.timeLimitMinutes) * 60;
            } else if (data.expiresAt) {
                try {
                    let deadlineMs = NaN;
                    if (typeof data.expiresAt === "number") {
                        deadlineMs = data.expiresAt;
                    } else if (Array.isArray(data.expiresAt)) {
                        deadlineMs = new Date(data.expiresAt[0], data.expiresAt[1] - 1, data.expiresAt[2], data.expiresAt[3] || 0, data.expiresAt[4] || 0, data.expiresAt[5] || 0).getTime();
                    } else if (typeof data.expiresAt === "string") {
                        deadlineMs = new Date(data.expiresAt).getTime();
                    }
                    if (!isNaN(deadlineMs)) {
                        const nowMs = Date.now();
                        const diffSecs = Math.floor((deadlineMs - nowMs) / 1000);
                        if (diffSecs > 0) {
                            remainingSeconds = diffSecs;
                        } else {
                            await loadRemainingTime();
                        }
                    } else {
                        await loadRemainingTime();
                    }
                } catch (e) {
                    await loadRemainingTime();
                }
            } else {
                await loadRemainingTime();
            }

            updateTimerDisplay();
            initiateFullscreenExamStart(data);

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
        const cat = item.category || item.question?.category || "Assessment MCQ";
        const formattedType = cat.replace(/_/g, " ");

        const qMarks = item.marks || item.question?.marks || 10;
        setText("questionNumber", `Question ${currentIndex + 1}`);
        setText("questionText", qText);
        setText("questionType", formattedType);
        setText("questionProgress", `Question ${currentIndex + 1} of ${questions.length}`);
        setText("paletteCounter", `${currentIndex + 1} / ${questions.length}`);
        setText("questionMarksText", `${qMarks} Mark${qMarks !== 1 ? 's' : ''}`);

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
                <input type="radio" name="question_option_${qId}" value="${optId}" ${isSelected ? "checked" : ""} style="display: none;">
                <div class="test-option-label">${optionLabels[idx] || (idx + 1)}</div>
                <div class="test-option-text">${escapeHtml(opt.optionText || "")}</div>
                ${isSelected ? '<i class="bi bi-check-circle-fill text-primary" style="font-size: 18px; margin-left: auto;"></i>' : ''}
            `;

            const selectThisOption = () => {
                const radio = label.querySelector("input[type='radio']");
                if (radio) radio.checked = true;

                answers[qId] = optId;

                container.querySelectorAll(".test-option").forEach(el => {
                    el.classList.remove("selected");
                    const checkIcon = el.querySelector(".bi-check-circle-fill");
                    if (checkIcon) checkIcon.remove();
                });

                label.classList.add("selected");
                if (!label.querySelector(".bi-check-circle-fill")) {
                    const check = document.createElement("i");
                    check.className = "bi bi-check-circle-fill text-primary";
                    check.style.fontSize = "18px";
                    check.style.marginLeft = "auto";
                    label.appendChild(check);
                }

                updateNavigation();
                updateProgressBar();
            };

            label.addEventListener("click", selectThisOption);
            container.appendChild(label);
        });

        // Update action buttons & marked state
        if (markReviewBtn) {
            const isMarked = markedQuestions.has(qId);
            markReviewBtn.classList.toggle("active", isMarked);
            markReviewBtn.innerHTML = isMarked
                ? `<i class="bi bi-bookmark-fill" style="color: #d97706;"></i> <span>Marked for Review</span>`
                : `<i class="bi bi-bookmark"></i> <span>Mark for Review</span>`;
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

                // Close mobile palette drawer if open
                if (window.innerWidth <= 992) {
                    const sidebar = document.getElementById("questionNavigationSidebar");
                    const backdrop = document.getElementById("paletteBackdrop");
                    sidebar?.classList.remove("open");
                    backdrop?.classList.remove("active");
                }
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

            btn.classList.toggle("answered", isAnswered);
            btn.classList.toggle("marked", isMarked);
        });

        const answeredCount = getAnsweredCount();
        setText("paletteCounter", `${currentIndex + 1} / ${questions.length}`);
        setText("mobileAnsweredBadge", `${answeredCount}/${questions.length}`);
    }

    function updateButtons() {
        if (previousBtn) previousBtn.disabled = currentIndex === 0;

        const isLastQuestion = questions.length > 0 && currentIndex === questions.length - 1;

        if (nextBtn) {
            if (isLastQuestion) {
                // Hide next button on the last question to eliminate double submit button
                nextBtn.style.display = "none";
            } else {
                nextBtn.style.display = "inline-flex";
                nextBtn.innerHTML = `<span>Next Question</span> <i class="bi bi-arrow-right"></i>`;
            }
        }

        if (submitTestBtn) {
            // Show bottom Submit Assessment button strictly on the last question
            submitTestBtn.style.display = isLastQuestion ? "inline-flex" : "none";
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
        if (!attemptId) {
            remainingSeconds = 15 * 60;
            updateTimerDisplay();
            if (isExamStarted) startTimerLoop();
            return;
        }

        try {
            const response = await fetch(
                `/api/student/tests/attempt/${attemptId}/remaining-time?studentId=${studentId}`,
                { headers: getAuthHeaders() }
            );

            if (response.ok) {
                const text = await response.text();
                const parsed = Number(text);
                if (!isNaN(parsed) && parsed > 0) {
                    remainingSeconds = parsed;
                } else {
                    remainingSeconds = 15 * 60;
                }
            } else {
                remainingSeconds = 15 * 60;
            }

            updateTimerDisplay();
            if (isExamStarted) startTimerLoop();

        } catch (e) {
            console.warn("Could not fetch remaining time:", e);
            remainingSeconds = 15 * 60;
            updateTimerDisplay();
            if (isExamStarted) startTimerLoop();
        }
    }

    function updateTimerDisplay() {
        const currentSecs = Math.max(0, isNaN(remainingSeconds) ? 0 : remainingSeconds);
        const mins = Math.floor(currentSecs / 60);
        const secs = currentSecs % 60;

        setText("timer", `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`);

        const timerContainer = document.getElementById("timerContainer");
        if (timerContainer) {
            timerContainer.classList.toggle("danger", currentSecs <= 60);
            timerContainer.classList.toggle("warning", currentSecs > 60 && currentSecs <= 300);
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
        closeSubmitModal();
        const violModal = document.getElementById("violationModal");
        if (violModal) violModal.hidden = true;

        const modal = document.getElementById("autoSubmitModal");
        if (modal) modal.hidden = false;

        autoSubmit();
    }

    function buildAnswersPayload() {
        return questions.map(q => {
            const qId = q.questionId || q.id || q.question?.id;
            const optId = answers[qId];
            return {
                questionId: Number(qId),
                optionId: optId !== undefined ? Number(optId) : null
            };
        }).filter(a => a.optionId !== null);
    }

    async function submitTest() {
        if (isSubmitting) return;

        const answered = getAnsweredCount();
        if (answered === 0) {
            if (window.AppToast) window.AppToast.warning("Please answer at least one question before submitting.");
        }

        closeSubmitModal();
        if (!attemptId) {
            if (window.AppToast) window.AppToast.error("Test attempt ID not found.");
            return;
        }

        isSubmitting = true;
        if (confirmSubmitBtn) {
            confirmSubmitBtn.disabled = true;
            confirmSubmitBtn.innerHTML = `<i class="bi bi-arrow-repeat spin"></i> Submitting...`;
        }
        if (submitTestBtn) submitTestBtn.disabled = true;
        if (headerSubmitBtn) headerSubmitBtn.disabled = true;

        const payload = buildAnswersPayload();

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
            isExamTerminated = true;

            if (window.AppToast) {
                window.AppToast.success("Assessment submitted successfully! Generating career report...");
            }

            const resId = data.resultId || data.id || "";
            setTimeout(() => {
                exitFullscreen();
                if (resId) {
                    window.location.href = `result.html?resultId=${resId}`;
                } else {
                    window.location.href = "student-results.html";
                }
            }, 500);

        } catch (error) {
            isSubmitting = false;
            if (confirmSubmitBtn) {
                confirmSubmitBtn.disabled = false;
                confirmSubmitBtn.innerHTML = `<i class="bi bi-check-circle"></i> Yes, Submit Test`;
            }
            if (submitTestBtn) submitTestBtn.disabled = false;
            if (headerSubmitBtn) headerSubmitBtn.disabled = false;
            console.error("Submission error:", error);
            if (window.AppToast) window.AppToast.error(error.message);
        }
    }

    async function autoSubmit() {
        if (isSubmitting) return;
        isSubmitting = true;

        clearInterval(timerInterval);
        isExamTerminated = true;

        const autoModal = document.getElementById("autoSubmitModal");
        if (autoModal) {
            autoModal.hidden = false;
            const autoBtn = document.getElementById("autoSubmitBtn");
            if (autoBtn) {
                autoBtn.disabled = true;
                autoBtn.innerHTML = `<i class="bi bi-arrow-repeat spin"></i> Calculating Results &amp; Submitting...`;
            }
        }

        const payload = buildAnswersPayload();

        try {
            const response = await fetch(
                `/api/student/tests/attempt/${attemptId}/auto-submit?studentId=${studentId}`,
                {
                    method: "POST",
                    headers: getAuthHeaders(),
                    body: JSON.stringify(payload)
                }
            );

            const data = await readResponse(response);
            const resId = data?.resultId || data?.id || "";

            if (window.AppToast) {
                window.AppToast.info("Test submitted automatically on timer expiry. Redirecting to your report...");
            }

            setTimeout(() => {
                exitFullscreen();
                if (resId) {
                    window.location.href = `result.html?resultId=${resId}`;
                } else {
                    window.location.href = "student-results.html";
                }
            }, 800);

        } catch (e) {
            console.error("Auto-submission error:", e);
            setTimeout(() => {
                exitFullscreen();
                window.location.href = "student-results.html";
            }, 1000);
        }
    }

    // =========================================================
    // SECURITY & ANTI-CHEATING PROCTORING SYSTEM
    // =========================================================

    function setupSecurityListeners() {
        // 1. Right-click context menu prevention
        document.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            if (window.AppToast) window.AppToast.warning("Right-click is strictly disabled for exam security.");
        });

        // 2. Clipboard action prevention
        ["copy", "cut", "paste"].forEach(evt => {
            document.addEventListener(evt, (e) => {
                e.preventDefault();
                if (window.AppToast) window.AppToast.warning(`Clipboard action (${evt}) is disabled during the assessment.`);
            });
        });

        // 3. Prevent drag and text selection
        document.addEventListener("selectstart", (e) => {
            if (!e.target.closest("input, textarea")) {
                e.preventDefault();
            }
        });

        document.addEventListener("dragstart", (e) => {
            e.preventDefault();
        });

        // 4. Tab switch / window focus loss detection
        document.addEventListener("visibilitychange", handleFocusLoss);
        window.addEventListener("blur", handleFocusLoss);

        // 5. Fullscreen exit detection
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

        // 6. Beforeunload safety prompt
        window.addEventListener("beforeunload", (e) => {
            if (!isExamTerminated && attemptId) {
                e.preventDefault();
                e.returnValue = "Are you sure you want to leave? Your exam progress will be affected.";
                return e.returnValue;
            }
        });
    }

    function handleFocusLoss() {
        if (isExamTerminated || !attemptId || !isExamStarted) return;

        // Skip if user is interacting with an existing modal
        if (document.getElementById("submitModal")?.hidden === false) return;
        if (document.getElementById("autoSubmitModal")?.hidden === false) return;
        if (document.getElementById("terminatedModal")?.hidden === false) return;
        if (document.getElementById("startExamModal")?.hidden === false) return;

        const now = Date.now();
        // 2-second debounce to prevent multiple events on one tab switch
        if (now - lastViolationTime < 2000) return;
        lastViolationTime = now;

        recordViolation("Window Focus Loss or Tab Switch Detected");
    }

    function recordViolation(reason) {
        if (isExamTerminated || !attemptId) return;

        violationsCount++;

        // Update topbar violation badge
        const violationBadge = document.getElementById("violationBadge");
        const violationText = document.getElementById("violationText");
        if (violationText) {
            violationText.textContent = `${violationsCount}/${MAX_VIOLATIONS} Warnings`;
        }
        if (violationBadge) {
            violationBadge.classList.toggle("warning", violationsCount === 1);
            violationBadge.classList.toggle("danger", violationsCount >= 2);
        }

        if (violationsCount >= MAX_VIOLATIONS) {
            // Auto terminate and submit
            isExamTerminated = true;
            const termModal = document.getElementById("terminatedModal");
            if (termModal) termModal.hidden = false;
            clearInterval(timerInterval);

            setTimeout(autoSubmit, 2500);
        } else {
            // Show warning modal
            const violModal = document.getElementById("violationModal");
            const modalCount = document.getElementById("modalViolationCount");
            if (modalCount) modalCount.textContent = String(violationsCount);
            if (violModal) violModal.hidden = false;

            if (window.AppToast) {
                window.AppToast.error(`Security Warning #${violationsCount}: Please stay focused on the exam!`);
            }
        }
    }

    function setupKeyboardShortcuts() {
        document.addEventListener("keydown", (e) => {
            // Block developer tools and copy shortcuts
            const isDevTool = e.key === "F12" ||
                (e.ctrlKey && e.shiftKey && ["I", "J", "C", "i", "j", "c"].includes(e.key)) ||
                (e.metaKey && e.altKey && ["I", "J", "C", "i", "j", "c"].includes(e.key)) ||
                (e.ctrlKey && ["U", "u", "S", "s", "P", "p"].includes(e.key)) ||
                (e.metaKey && ["U", "u", "S", "s", "P", "p"].includes(e.key)) ||
                (e.ctrlKey && ["C", "c", "V", "v", "X", "x"].includes(e.key)) ||
                (e.metaKey && ["C", "c", "V", "v", "X", "x"].includes(e.key));

            if (isDevTool) {
                e.preventDefault();
                e.stopPropagation();
                if (window.AppToast) window.AppToast.warning("Developer tools and shortcuts are strictly disabled.");
                return;
            }

            if (document.getElementById("submitModal")?.hidden === false) return;
            if (document.getElementById("violationModal")?.hidden === false) return;

            if (e.key === "ArrowRight") {
                nextQuestion();
            } else if (e.key === "ArrowLeft") {
                previousQuestion();
            } else if (["1", "2", "3", "4", "a", "b", "c", "d", "A", "B", "C", "D"].includes(e.key)) {
                let index = -1;
                if (["1", "2", "3", "4"].includes(e.key)) index = Number(e.key) - 1;
                else {
                    const charCode = e.key.toUpperCase().charCodeAt(0);
                    index = charCode - 65;
                }

                const options = document.querySelectorAll(".test-option");
                if (options[index]) {
                    options[index].click();
                }
            }
        });
    }

    // =========================================================
    // FULLSCREEN PROCTORING CONTROLS
    // =========================================================

    function setupFullscreen() {
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener("click", () => {
                toggleFullscreen();
            });
        }

        // Global interaction listener: if exam is started and user clicks anywhere while not in fullscreen,
        // automatically request fullscreen directly
        document.addEventListener("click", () => {
            if (isExamStarted && attemptId && !isExamTerminated && isFullscreenSupported()) {
                if (!document.fullscreenElement && !document.webkitFullscreenElement) {
                    if (document.getElementById("submitModal")?.hidden === false) return;
                    if (document.getElementById("autoSubmitModal")?.hidden === false) return;
                    if (document.getElementById("terminatedModal")?.hidden === false) return;
                    if (document.getElementById("startExamModal")?.hidden === false) return;
                    enterFullscreen();
                }
            }
        });
    }

    function isFullscreenSupported() {
        const docEl = document.documentElement;
        return Boolean(
            docEl.requestFullscreen ||
            docEl.webkitRequestFullscreen ||
            docEl.msRequestFullscreen
        );
    }

    function toggleFullscreen() {
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
            enterFullscreen();
        } else {
            exitFullscreen();
        }
    }

    function enterFullscreen() {
        const docEl = document.documentElement;
        try {
            if (docEl.requestFullscreen) {
                return docEl.requestFullscreen().catch((err) => {
                    console.log("Fullscreen request:", err?.message);
                });
            } else if (docEl.webkitRequestFullscreen) {
                return docEl.webkitRequestFullscreen().catch(() => {});
            } else if (docEl.msRequestFullscreen) {
                return docEl.msRequestFullscreen().catch(() => {});
            }
        } catch (e) {
            console.warn("Fullscreen error:", e);
        }
    }

    function exitFullscreen() {
        try {
            if (document.exitFullscreen) {
                return document.exitFullscreen().catch(() => {});
            } else if (document.webkitExitFullscreen) {
                return document.webkitExitFullscreen().catch(() => {});
            } else if (document.msExitFullscreen) {
                return document.msExitFullscreen().catch(() => {});
            }
        } catch (e) {}
    }

    function handleFullscreenChange() {
        const isFull = Boolean(document.fullscreenElement || document.webkitFullscreenElement);

        if (fullscreenBtn) {
            fullscreenBtn.innerHTML = isFull
                ? `<i class="bi bi-fullscreen-exit"></i> <span class="hide-mobile">Exit Fullscreen</span>`
                : `<i class="bi bi-arrows-fullscreen"></i> <span class="hide-mobile">Fullscreen</span>`;
            fullscreenBtn.classList.toggle("active-fullscreen", isFull);
        }

        if (isFull) {
            if (startExamModal && !startExamModal.hidden) {
                startExamModal.hidden = true;
            }
            if (!isExamStarted) {
                isExamStarted = true;
                startTimerLoop();
            }
        }

        // Exiting fullscreen during active exam counts as focus loss/warning
        if (!isFull && attemptId && isExamStarted && !isExamTerminated && isFullscreenSupported()) {
            recordViolation("Fullscreen exited during active assessment");
        }
    }

    function initiateFullscreenExamStart(data) {
        if (!startExamModal) {
            isExamStarted = true;
            enterFullscreen();
            startTimerLoop();
            return;
        }

        const testDisplayName = data?.testName || data?.test?.testName || "Career Aptitude Assessment";
        if (startModalTestName) startModalTestName.textContent = testDisplayName;
        if (startModalQuestionsCount) startModalQuestionsCount.textContent = `${questions.length} Questions`;
        const mins = Math.max(1, Math.ceil(remainingSeconds / 60));
        if (startModalDuration) startModalDuration.textContent = `${mins} Minutes`;

        const totalAllowedSecs = (data?.timeLimitMinutes || 15) * 60;
        if (remainingSeconds < totalAllowedSecs - 10) {
            if (startModalTitle) startModalTitle.textContent = "Resume Assessment";
            if (startExamBtnText) startExamBtnText.textContent = "Resume Assessment in Fullscreen";
        }

        const isSupported = isFullscreenSupported();
        const isAlreadyFull = Boolean(document.fullscreenElement || document.webkitFullscreenElement);

        if (!isSupported) {
            // Devices without fullscreen API support (e.g. mobile iOS Safari)
            isExamStarted = true;
            startExamModal.hidden = true;
            startTimerLoop();
            return;
        }

        if (isAlreadyFull) {
            // Already in fullscreen
            isExamStarted = true;
            startExamModal.hidden = true;
            startTimerLoop();
            return;
        }

        // Attempt immediate programmatic fullscreen entry
        enterFullscreen();

        // Check if browser granted fullscreen without requiring user click
        setTimeout(() => {
            const isNowFull = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
            if (isNowFull) {
                isExamStarted = true;
                startExamModal.hidden = true;
                startTimerLoop();
            } else {
                // Browser requires user gesture -> reveal Start Exam in Fullscreen modal
                startExamModal.hidden = false;
            }
        }, 120);
    }

    // =========================================================
    // MOBILE RESPONSIVE PALETTE DRAWER
    // =========================================================

    function setupMobilePalette() {
        const toggleBtn = document.getElementById("mobilePaletteToggle");
        const closeBtn = document.getElementById("closePaletteBtn");
        const sidebar = document.getElementById("questionNavigationSidebar");
        const backdrop = document.getElementById("paletteBackdrop");

        const openDrawer = () => {
            sidebar?.classList.add("open");
            backdrop?.classList.add("active");
        };

        const closeDrawer = () => {
            sidebar?.classList.remove("open");
            backdrop?.classList.remove("active");
        };

        toggleBtn?.addEventListener("click", openDrawer);
        closeBtn?.addEventListener("click", closeDrawer);
        backdrop?.addEventListener("click", closeDrawer);
    }

    // =========================================================
    // COMMON UTILITY FUNCTIONS
    // =========================================================

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