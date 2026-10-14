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

    let currentTest = null;

    async function loadTestData() {
        try {
            await Promise.all([
                loadTest(),
                loadQuestions()
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
            currentTest = test;
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

    function displayTest(test) {
        setText("testTitle", test.testName);
        setText("testDescription", test.description || "No description available.");
        setText("detailQuestionCount", test.questionCount ?? 0);
        setText("detailTimeLimit", `${test.timeLimitMinutes ?? 0} min`);
        setText("detailStudentCount", test.studentCount ?? 0);
        setText("detailCompletedCount", test.completedCount ?? 0);
        setText("createdAt", formatDate(test.createdAt));

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
                    <p>${escapeHtml(question.category || "General")} • ${question.marks || 10} pts</p>
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