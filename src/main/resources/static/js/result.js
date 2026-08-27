document.addEventListener("DOMContentLoaded", () => {

    const params = new URLSearchParams(window.location.search);
    const resultId = params.get("resultId") || params.get("id");

    const sidebar = document.getElementById("studentSidebar");
    const menuBtn = document.getElementById("studentMenuBtn");
    const logoutBtn = document.getElementById("studentLogout");

    if (menuBtn && sidebar) {
        menuBtn.addEventListener("click", () => sidebar.classList.toggle("open"));
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.removeItem("studentToken");
            localStorage.removeItem("token");
            window.location.href = "/student-login.html";
        });
    }

    loadResult();

    function getStudentId() {
        const studentUser = localStorage.getItem("studentUser") || localStorage.getItem("user");
        if (studentUser) {
            try {
                const parsed = JSON.parse(studentUser);
                if (parsed.id || parsed.userId) return parsed.id || parsed.userId;
            } catch (e) {}
        }
        return localStorage.getItem("studentId") || localStorage.getItem("userId") || null;
    }

    async function loadResult() {
        const token = localStorage.getItem("studentToken") || localStorage.getItem("token") || localStorage.getItem("adminToken");

        if (!token) {
            window.location.href = "/student-login.html";
            return;
        }

        try {
            let data = null;

            if (resultId) {
                const response = await fetch(`/api/student/results/${resultId}`, {
                    headers: {
                        "Accept": "application/json",
                        ...(token ? { "Authorization": "Bearer " + token } : {})
                    }
                });

                if (!response.ok) throw new Error("Assessment report not found on server.");
                data = await response.json();
            } else {
                // Fetch student's latest result if no explicit ID in URL
                let response = await fetch("/api/student/results/my-results", {
                    headers: {
                        "Accept": "application/json",
                        ...(token ? { "Authorization": "Bearer " + token } : {})
                    }
                });

                if (!response.ok) {
                    const studentId = getStudentId();
                    if (studentId) {
                        response = await fetch(`/api/student/results/student/${studentId}`, {
                            headers: {
                                "Accept": "application/json",
                                ...(token ? { "Authorization": "Bearer " + token } : {})
                            }
                        });
                    }
                }

                if (!response.ok) throw new Error("Unable to fetch assessment results.");
                const list = await response.json();
                const array = Array.isArray(list) ? list : (list.content || []);
                if (array.length === 0) throw new Error("You have not completed any assessments yet.");
                data = array[0];
            }

            displayResult(data);

        } catch (error) {
            console.error("Load result error:", error);
            showError(error.message);
        }
    }

    function displayResult(result) {
        hide("loadingResult");
        show("resultContent");

        const career = result.recommendedCareer || result.careerName || "Software Engineer";
        const cat = result.category || "SOFTWARE_ENGINEERING";
        const score = result.totalScore ?? result.score ?? 0;
        const interest = result.interestScore ?? 0;
        const knowledge = result.knowledgeScore ?? 0;
        const testName = result.testName || "Career Aptitude Assessment";
        const completedDate = result.completedAt ? new Date(result.completedAt).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' }) : "Completed Recently";

        setText("testNameSmall", `ASSESSMENT: ${testName.toUpperCase()}`);
        setText("careerName", career);
        setText("category", formatCategory(cat));
        setText("completedAt", `Evaluation completed on ${completedDate}`);

        const testBadge = document.getElementById("testBadge");
        if (testBadge) {
            testBadge.style.display = "inline-flex";
            testBadge.innerHTML = `<i class="bi bi-journal-check"></i> ${escapeHtml(testName)}`;
        }

        setText("interestScore", interest);
        setText("knowledgeScore", knowledge);
        setText("score", `${score} / 100`);

        setText("careerDescription", result.description || "Exciting career opportunity matching your skill profile and interests.");
        setText("skills", result.skills || "System Architecture, Problem Solving, Core Domain Tools, Version Control, Collaborative Engineering.");
        setText("education", result.education || "Bachelor's Degree in Computer Science, Engineering, or relevant technical domain.");
        setText("salaryRange", result.salaryRange || "₹6,00,000 - ₹25,00,000 / annum ($75,000 - $160,000 / yr)");
    }

    function showError(msg) {
        hide("loadingResult");
        hide("resultContent");
        show("resultError");
        setText("resultErrorMessage", msg || "We could not load the assessment result report.");
    }

    function formatCategory(cat) {
        if (!cat) return "";
        return cat.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    }

    function setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    function show(id) {
        const el = document.getElementById(id);
        if (el) el.hidden = false;
    }

    function hide(id) {
        const el = document.getElementById(id);
        if (el) el.hidden = true;
    }

    function escapeHtml(str) {
        const div = document.createElement("div");
        div.textContent = str ?? "";
        return div.innerHTML;
    }
});