document.addEventListener("DOMContentLoaded", async () => {

    let completedTestIds = new Set();

    await loadStudentProfile();
    await loadDashboard();

    async function loadStudentProfile() {
        const storedName = localStorage.getItem("studentName") || "Student";
        const storedEmail = localStorage.getItem("studentEmail") || "student@example.com";

        setText("studentName", storedName);
        setText("studentEmail", storedEmail);
        setText("topStudentName", storedName);
        setText("welcomeStudentName", storedName);

        const token = localStorage.getItem("studentToken") || localStorage.getItem("token");
        if (!token) return;

        try {
            const response = await fetch("/api/student/profile", {
                headers: {
                    "Accept": "application/json",
                    "Authorization": "Bearer " + token
                }
            });

            if (response.ok) {
                const profile = await response.json();
                const name = profile.name || storedName;
                const email = profile.email || storedEmail;

                if (profile.id) {
                    localStorage.setItem("studentId", String(profile.id));
                }

                setText("studentName", name);
                setText("studentEmail", email);
                setText("topStudentName", name);
                setText("welcomeStudentName", name);

                localStorage.setItem("studentName", name);
                localStorage.setItem("studentEmail", email);
            }
        } catch (error) {
            console.warn("Could not load student profile info:", error);
        }
    }

    async function loadDashboard() {
        const token = localStorage.getItem("studentToken") || localStorage.getItem("token");
        if (!token) return;

        const studentId = getStudentId();

        try {
            // Load stats, tests, attempts, and results in parallel
            const [statsRes, testsRes, attemptsRes, resultsRes] = await Promise.all([
                fetch("/api/student/stats" + (studentId ? `?studentId=${studentId}` : ""), {
                    headers: { "Accept": "application/json", "Authorization": "Bearer " + token }
                }),
                fetch("/api/student/tests", {
                    headers: { "Accept": "application/json", "Authorization": "Bearer " + token }
                }),
                fetch("/api/student/tests/my-attempts", {
                    headers: { "Accept": "application/json", "Authorization": "Bearer " + token }
                }),
                fetch("/api/student/results/my-results", {
                    headers: { "Accept": "application/json", "Authorization": "Bearer " + token }
                })
            ]);

            completedTestIds.clear();
            if (attemptsRes.ok) {
                const ids = await attemptsRes.json();
                if (Array.isArray(ids)) ids.forEach(id => completedTestIds.add(Number(id)));
            }

            // 1. Stats
            if (statsRes.ok) {
                const stats = await statsRes.json();
                setText("availableTests", stats.availableTests ?? 0);
                setText("testsAttempted", stats.attemptedTests ?? 0);
                setText("testsCompleted", stats.completedTests ?? 0);
                setText("careerResults", stats.completedTests ?? 0);
            }

            // 2. Latest Result
            let latestResult = null;
            if (resultsRes.ok) {
                const results = await resultsRes.json();
                const list = Array.isArray(results) ? results : (results.content || []);
                if (list.length > 0) {
                    latestResult = list[0];
                    list.forEach(r => {
                        if (r.testId) completedTestIds.add(Number(r.testId));
                    });
                }
            }
            renderLatestResult(latestResult);

            // 3. Available Tests
            if (testsRes.ok) {
                const tests = await testsRes.json();
                renderAvailableTests(Array.isArray(tests) ? tests.slice(0, 3) : []);
                if (!statsRes.ok) setText("availableTests", tests.length);
            } else {
                renderAvailableTests([]);
            }

        } catch (error) {
            console.error("Error loading student dashboard:", error);
        }
    }

    function renderAvailableTests(tests) {
        const container = document.getElementById("availableTestsContainer");
        if (!container) return;

        if (!tests || tests.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <i class="bi bi-file-earmark-x"></i>
                    <h3>No Tests Currently Available</h3>
                    <p>New assessments are being configured by the administrator. Check back soon!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = tests.map(test => {
            const isActive = Boolean(test.active);
            const isCompleted = completedTestIds.has(Number(test.id));

            let badgeHtml = "";
            let btnHtml = "";

            if (isCompleted) {
                badgeHtml = `
                    <span class="badge" style="background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0;">
                        <i class="bi bi-check2-circle"></i> Completed
                    </span>
                `;
                btnHtml = `
                    <a href="student-results.html" class="btn btn-secondary" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <i class="bi bi-eye"></i> View Result & Report
                    </a>
                `;
            } else if (!isActive) {
                badgeHtml = `
                    <span class="badge badge-danger">
                        <i class="bi bi-slash-circle"></i> Inactive
                    </span>
                `;
                btnHtml = `
                    <button type="button" class="btn btn-secondary" disabled title="This assessment is currently inactive" style="width: 100%; opacity: 0.65; cursor: not-allowed; border-color: #e2e8f0;">
                        <i class="bi bi-lock-fill"></i> Assessment Inactive
                    </button>
                `;
            } else {
                badgeHtml = `
                    <span class="badge badge-active">
                        <i class="bi bi-play-circle"></i> Active
                    </span>
                `;
                btnHtml = `
                    <button type="button" class="btn btn-primary start-test-btn" data-id="${test.id}" style="width: 100%;">
                        <i class="bi bi-play-circle-fill"></i> Start Assessment
                    </button>
                `;
            }

            return `
            <div class="student-card">
                <div>
                    <div class="student-card-header">
                        <div class="student-card-icon" style="${isCompleted ? 'background: #ecfdf5; color: #059669;' : (!isActive ? 'background: #f1f5f9; color: #94a3b8;' : '')}">
                            <i class="bi ${isCompleted ? 'bi-file-earmark-check' : (!isActive ? 'bi-file-earmark-lock' : 'bi-file-earmark-text')}"></i>
                        </div>
                        ${badgeHtml}
                    </div>

                    <h3 class="student-card-title">${escapeHtml(test.testName || "Career Assessment")}</h3>
                    <p class="student-card-desc">${escapeHtml(test.description || "Comprehensive career aptitude and domain assessment.")}</p>
                </div>

                <div>
                    <div class="student-card-meta">
                        <span><i class="bi bi-question-circle"></i> ${test.questionCount ?? 0} Questions</span>
                        <span><i class="bi bi-clock"></i> ${test.timeLimitMinutes ?? 15} Mins</span>
                    </div>

                    ${btnHtml}
                </div>
            </div>
            `;
        }).join("");

        container.querySelectorAll(".start-test-btn").forEach(btn => {
            btn.addEventListener("click", function () {
                const id = this.getAttribute("data-id");
                startTest(id);
            });
        });
    }

    function renderLatestResult(result) {
        const container = document.getElementById("latestResultContainer");
        if (!container) return;

        if (!result) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-trophy"></i>
                    <h3>No Assessment Results Yet</h3>
                    <p>Take an assessment above to uncover your customized career recommendation report.</p>
                    <a href="available-tests.html" class="btn btn-primary">
                        <i class="bi bi-play-circle"></i> Take Your First Test
                    </a>
                </div>
            `;
            return;
        }

        const careerName = result.recommendedCareer || result.careerName || "Software Engineer";
        const score = result.totalScore ?? result.score ?? 0;
        const interestScore = result.interestScore ?? 0;
        const knowledgeScore = result.knowledgeScore ?? 0;
        const resultId = result.resultId ?? result.id;
        const testName = result.testName || "Career Aptitude Assessment";

        container.innerHTML = `
            <div style="background: linear-gradient(135deg, #f8faff 0%, #edf4ff 100%); border: 1px solid var(--student-primary-border); border-radius: var(--student-radius); padding: 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 20px;">
                <div style="display: flex; align-items: center; gap: 18px;">
                    <div style="width: 60px; height: 60px; border-radius: 50%; background: var(--student-primary); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 26px; flex-shrink: 0; box-shadow: 0 4px 12px rgba(18, 104, 243, 0.25);">
                        <i class="bi bi-trophy"></i>
                    </div>
                    <div>
                        <span style="font-size: 11.5px; font-weight: 700; color: var(--student-primary); text-transform: uppercase; letter-spacing: 0.05em;">RECOMMENDED CAREER PATH • ${escapeHtml(testName)}</span>
                        <h3 style="font-size: 20px; font-weight: 800; color: var(--student-text-main); margin: 2px 0 6px;">${escapeHtml(careerName)}</h3>
                        <div style="display: flex; gap: 12px; font-size: 13px; color: var(--student-text-muted);">
                            <span>Overall Match: <strong style="color: var(--student-text-main);">${score} pts</strong></span>
                            <span>•</span>
                            <span>Interest: <strong style="color: var(--student-text-main);">${interestScore}</strong></span>
                            <span>•</span>
                            <span>Knowledge: <strong style="color: var(--student-text-main);">${knowledgeScore}</strong></span>
                        </div>
                    </div>
                </div>

                <div>
                    <a href="result.html?resultId=${resultId}" class="btn btn-primary">
                        <i class="bi bi-file-earmark-text"></i> View Full Report
                    </a>
                </div>
            </div>
        `;
    }

    function startTest(testId) {
        if (!testId) return;
        window.location.href = `student-test.html?testId=${testId}`;
    }

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