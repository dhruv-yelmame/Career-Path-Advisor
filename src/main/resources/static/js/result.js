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
            if (typeof window.handleStudentLogout === "function") {
                window.handleStudentLogout(e);
            }
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

        const score = result.percentage ?? result.totalScore ?? result.score ?? 0;
        const totalQ = result.totalQuestions ?? 40;
        const attemptedQ = result.attemptedQuestions != null ? result.attemptedQuestions : (result.correctAnswers ?? 0);
        const correctQ = result.correctAnswers != null ? result.correctAnswers : (result.interestScore ?? 0);
        const obtainedScore = result.obtainedScore != null ? result.obtainedScore : (result.knowledgeScore ?? result.totalScore ?? 0);

        let career = "";
        const cat = result.highestCategory || result.category || (typeof result.recommendedCareer === 'object' && result.recommendedCareer ? result.recommendedCareer.category : "");

        if (obtainedScore === 0 || score === 0 || correctQ === 0) {
            career = "Career Not Found";
        } else {
            if (typeof result.recommendedCareer === 'object' && result.recommendedCareer !== null) {
                career = result.recommendedCareer.careerName || result.recommendedCareer.name || "";
            } else if (typeof result.recommendedCareer === 'string') {
                career = result.recommendedCareer;
            }
            if (!career && result.careerName) {
                career = result.careerName;
            }
            if (!career && cat) {
                const catUpper = cat.trim().toUpperCase();
                if (catUpper === "DATA_SCIENCE") career = "Data Scientist & ML Engineer";
                else if (catUpper === "AI_MACHINE_LEARNING") career = "AI & Machine Learning Engineer";
                else if (catUpper === "SOFTWARE_ENGINEERING") career = "Software Engineer";
                else if (catUpper === "WEB_DEVELOPMENT") career = "Full Stack Web Developer";
                else if (catUpper === "CYBER_SECURITY") career = "Cybersecurity Analyst & Ethical Hacker";
                else if (catUpper === "CLOUD_COMPUTING") career = "Cloud Solutions Architect & DevOps";
                else if (catUpper === "DEVOPS_ENGINEERING") career = "DevOps Engineer";
                else if (catUpper === "MOBILE_DEVELOPMENT") career = "Mobile Application Developer";
                else career = formatCategory(catUpper) + " Specialist";
            }
            if (!career) {
                career = "Career Evaluation Complete";
            }
        }
        const maxScore = result.maximumScore || (totalQ * 10);
        const testName = result.testName || "Career Aptitude Assessment";
        const completedDate = result.completedAt ? new Date(result.completedAt).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' }) : "Completed Recently";

        // Student metadata for print/PDF export
        const studentName = result.studentName || localStorage.getItem("studentName") || localStorage.getItem("name") || "Student Candidate";
        const studentEmail = result.studentEmail || localStorage.getItem("studentEmail") || localStorage.getItem("email") || "student@example.com";
        const effectiveId = result.resultId || resultId || 1;
        const reportCode = `CPA-RES-${String(effectiveId).padStart(4, '0')}`;

        setText("printStudentName", studentName);
        setText("printStudentEmail", studentEmail);
        setText("printTestName", testName);
        setText("printCompletedDate", completedDate);
        setText("printReportId", `REF: ${reportCode}`);
        setText("printAttempted", `${attemptedQ} / ${totalQ}`);
        setText("printCorrect", `${correctQ} / ${totalQ}`);
        setText("printTotalScore", `${obtainedScore} / ${maxScore} pts`);
        setText("printMatchScore", score <= 100 ? `${score}%` : `${score} pts`);

        // Set clean document title for browser "Save as PDF" default file name
        document.title = `${career} - Career Assessment Report (${studentName})`;

        setText("testNameSmall", `ASSESSMENT: ${testName.toUpperCase()}`);
        setText("careerName", career);
        setText("category", formatCategory(cat || "GENERAL"));
        setText("completedAt", `Evaluation completed on ${completedDate}`);

        const testBadge = document.getElementById("testBadge");
        if (testBadge) {
            testBadge.style.display = "inline-flex";
            testBadge.innerHTML = `<i class="bi bi-journal-check"></i> ${escapeHtml(testName)}`;
        }

        setText("score", score <= 100 ? `${score}%` : `${score} pts`);
        setText("attemptedQuestionsCount", `${attemptedQ} / ${totalQ}`);
        setText("correctAnswersCount", `${correctQ} / ${totalQ}`);
        setText("totalScoreText", `${obtainedScore} / ${maxScore} pts`);

        const recObj = typeof result.recommendedCareer === 'object' && result.recommendedCareer !== null ? result.recommendedCareer : {};
        if (career === "Career Not Found") {
            setText("careerDescription", "No career recommendation generated because the score was 0. Please retake the test to identify suitable career paths.");
            setText("skills", "Take another assessment to discover recommended technical and soft skills.");
            setText("education", "Review preparatory study resources to improve aptitude scores.");
        } else {
            setText("careerDescription", result.description || recObj.description || "Exciting career opportunity matching your skill profile and interests.");
            setText("skills", result.skills || recObj.skills || "System Architecture, Problem Solving, Core Domain Tools, Version Control, Collaborative Engineering.");
            setText("education", result.education || recObj.education || "Bachelor's Degree in Computer Science, Engineering, or relevant technical domain.");
        }

        // Clean industry compensation display, stripping any broken question marks or replacement characters
        let rawSalary = result.salaryRange || recObj.salaryRange || "₹6,00,000 - ₹25,00,000 / annum ($75,000 - $160,000 / yr)";
        let cleanSalary = String(rawSalary)
            .replace(/[\uFFFD\u0080-\u009F]/g, "")
            .replace(/\?{2,}/g, "₹")
            .replace(/\?(\s*\d)/g, "₹$1")
            .replace(/(\bLPA\b|\bannum\b|\byr\b)\s*\?/gi, "$1")
            .replace(/\?+/g, "₹")
            .trim();
        setText("salaryRange", cleanSalary || "₹6,00,000 - ₹25,00,000 / annum");

        const roadmapBtn = document.getElementById("viewRoadmapBtn");
        if (roadmapBtn && career) {
            roadmapBtn.href = `learning-roadmap.html?track=${encodeURIComponent(career)}`;
        }

        const catPerfSection = document.getElementById("categoryPerformanceSection");
        const catPerfList = document.getElementById("categoryPerformanceList");
        if (catPerfSection && catPerfList) {
            if (Array.isArray(result.categoryPerformance) && result.categoryPerformance.length > 0) {
                catPerfSection.style.display = "block";
                catPerfList.innerHTML = result.categoryPerformance.map(cat => {
                    const formattedName = formatCategory(cat.category);
                    const pct = cat.percentage != null ? cat.percentage : 0;
                    const obt = cat.obtainedScore ?? 0;
                    const max = cat.maximumScore ?? 0;
                    const isTop = cat.category === result.highestCategory;
                    return `
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 13.5px;">
                                <span style="font-weight: 700; color: ${isTop ? 'var(--student-primary)' : 'var(--student-text-main)'};">
                                    ${escapeHtml(formattedName)} ${isTop ? '<span class="badge badge-active" style="font-size: 10px; padding: 2px 6px; margin-left: 6px;"><i class="bi bi-award"></i> Top Performed</span>' : ''}
                                </span>
                                <span style="color: var(--student-text-muted); font-size: 12.5px;">
                                    <strong>${obt}</strong> / ${max} pts (${pct}%)
                                </span>
                            </div>
                            <div style="width: 100%; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                                <div style="width: ${Math.min(100, Math.max(0, pct))}%; height: 100%; background: ${isTop ? 'var(--student-primary)' : '#94a3b8'}; border-radius: 4px;"></div>
                            </div>
                        </div>
                    `;
                }).join("");
            } else {
                catPerfSection.style.display = "none";
            }
        }
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
        if (el) {
            el.hidden = false;
            el.style.display = "";
        }
    }

    function hide(id) {
        const el = document.getElementById(id);
        if (el) {
            el.hidden = true;
            el.style.display = "none";
        }
    }

    function escapeHtml(str) {
        const div = document.createElement("div");
        div.textContent = str ?? "";
        return div.innerHTML;
    }
});