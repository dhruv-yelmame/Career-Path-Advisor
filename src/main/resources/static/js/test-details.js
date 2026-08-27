document.addEventListener("DOMContentLoaded", () => {

    const params = new URLSearchParams(window.location.search);
    const testId = params.get("id");

    if (!testId) {
        if (window.AppToast) {
            window.AppToast.error("Test ID is missing.");
        }
        setTimeout(() => {
            window.location.href = "view-tests.html";
        }, 1500);
        return;
    }

    loadTestData();

    function getAuthHeaders() {
        if (typeof window.authHeaders === "function") {
            return window.authHeaders();
        }

        const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
        return {
            "Accept": "application/json",
            ...(token ? { "Authorization": "Bearer " + token } : {})
        };
    }

    async function loadTestData() {
        try {
            await Promise.all([
                loadTest(),
                loadQuestions(),
                loadAttempts()
            ]);
        } catch (error) {
            console.error("Test details error:", error);
        }
    }

    async function loadTest() {
        try {
            const response = await fetch(`/api/admin/tests/${encodeURIComponent(testId)}`, {
                method: "GET",
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || "Unable to load test details.");
            }

            const test = await response.json();
            displayTest(test);

        } catch (error) {
            console.error("Test load error:", error);
            showError(error.message || "Unable to load test.");
        }
    }

    async function loadQuestions() {
        const container = document.getElementById("testQuestionsContainer");
        if (!container) return;

        try {
            const response = await fetch(`/api/admin/tests/${encodeURIComponent(testId)}/questions`, {
                method: "GET",
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || "Unable to load test questions.");
            }

            const questions = await response.json();
            renderQuestions(Array.isArray(questions) ? questions : (questions?.content || []));

        } catch (error) {
            console.error("Questions load error:", error);
            container.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-exclamation-triangle"></i>
                    <h3>Unable to Load Questions</h3>
                    <p>${escapeHtml(error.message)}</p>
                </div>
            `;
        }
    }

    async function loadAttempts() {
        const container = document.getElementById("testAttemptsContainer");
        const emptyAttempts = document.getElementById("emptyAttempts");
        if (!container) return;

        try {
            const response = await fetch(`/api/student/results/all`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                container.innerHTML = "";
                if (emptyAttempts) emptyAttempts.hidden = false;
                return;
            }

            const data = await response.json();
            const allResults = Array.isArray(data) ? data : (data?.content || []);

            // Filter for this test
            const attempts = allResults.filter(r => String(r.testId) === String(testId) || r.testName);

            container.innerHTML = "";

            if (attempts.length === 0) {
                if (emptyAttempts) emptyAttempts.hidden = false;
                return;
            }

            if (emptyAttempts) emptyAttempts.hidden = true;

            attempts.forEach(item => {
                const card = document.createElement("div");
                card.className = "student-card";
                card.style.marginBottom = "10px";
                card.innerHTML = `
                    <div style="flex: 1;">
                        <strong>${escapeHtml(item.studentName || item.studentEmail || "Student")}</strong>
                        <p style="font-size: 0.85rem; color: #64748b; margin-top: 4px;">
                            Completed: ${formatDate(item.completedAt)} &bull; Recommendation: <span style="color: #4361ee; font-weight: 600;">${escapeHtml(item.recommendedCareer || "Assessed")}</span>
                        </p>
                    </div>
                    <div style="text-align: right;">
                        <strong style="font-size: 1.3rem; color: #1268f3;">${item.totalScore ?? item.score ?? 0}</strong>
                        <span style="display: block; font-size: 0.75rem; color: #64748b;">Score</span>
                    </div>
                `;
                container.appendChild(card);
            });

        } catch (err) {
            console.warn("Attempts load error:", err);
            container.innerHTML = "";
            if (emptyAttempts) emptyAttempts.hidden = false;
        }
    }

    function displayTest(test) {
        setText("testTitle", test.testName);
        setText("testDescription", test.description || "No description available.");
        setText("detailQuestionCount", test.questionCount ?? 0);
        setText("detailTimeLimit", `${test.timeLimitMinutes ?? 0} min`);
        setText("detailStudentCount", test.studentCount ?? 0);
        setText("detailCompletedCount", test.completedCount ?? 0);
        setText("createdAt", formatDate(test.createdAt));
        setText("startTime", formatDate(test.startTime));
        setText("endTime", formatDate(test.endTime));

        const status = document.getElementById("testStatus");
        if (status) {
            const active = test.active === true;
            status.textContent = active ? "Active" : "Inactive";
            status.className = "status-badge " + (active ? "status-active" : "status-inactive");
        }
    }

    function renderQuestions(questions) {
        const container = document.getElementById("testQuestionsContainer");
        if (!container) return;

        container.innerHTML = "";

        if (!Array.isArray(questions) || questions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-question-circle"></i>
                    <h3>No Questions</h3>
                    <p>No questions are assigned to this test.</p>
                </div>
            `;
            return;
        }

        questions.forEach((item, index) => {
            const question = item.question || item;
            const questionNumber = item.questionOrder ?? index + 1;

            const div = document.createElement("div");
            div.className = "test-question-item";
            div.innerHTML = `
                <div class="test-question-number">${questionNumber}</div>
                <div class="test-question-content">
                    <strong>${escapeHtml(question.questionText || "")}</strong>
                    <p>${escapeHtml(question.questionType || "")}</p>
                </div>
            `;
            container.appendChild(div);
        });
    }

    function showError(message) {
        setText("testTitle", "Unable to Load Test");
        setText("testDescription", message);
    }

    function formatDate(value) {
        if (!value) return "-";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleDateString("en-IN", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    function setText(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value ?? "-";
        }
    }

    function escapeHtml(value) {
        const div = document.createElement("div");
        div.textContent = value ?? "";
        return div.innerHTML;
    }
});