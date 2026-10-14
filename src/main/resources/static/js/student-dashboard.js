document.addEventListener("DOMContentLoaded", async () => {

    let completedTestIds = new Set();

    displayCurrentDate();

    // 1. Check for immediate data fetched at login time
    const hadPrefetch = tryApplyPrefetchedData();

    // 2. Fetch fresh data in parallel in background or immediately
    await refreshStudentDashboard(!hadPrefetch);

    function displayCurrentDate() {
        const dateEl = document.getElementById("studentCurrentDate");
        if (!dateEl) return;
        try {
            const today = new Date();
            const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
            dateEl.textContent = today.toLocaleDateString('en-US', options);
        } catch (e) {
            dateEl.textContent = "Today";
        }
    }

    function applyStudentProfileUI(name, email) {
        const studentName = name || localStorage.getItem("studentName") || "Student";
        const studentEmail = email || localStorage.getItem("studentEmail") || "student@example.com";

        setText("studentName", studentName);
        setText("studentEmail", studentEmail);
        setText("topStudentName", studentName);
        setText("welcomeStudentName", studentName);

        const topLetter = document.getElementById("topAvatarLetter");
        if (topLetter) topLetter.textContent = studentName ? studentName.charAt(0).toUpperCase() : "S";

        const hour = new Date().getHours();
        let greeting = "Good Morning";
        if (hour >= 12 && hour < 17) greeting = "Good Afternoon";
        else if (hour >= 17) greeting = "Good Evening";
        const bannerEl = document.getElementById("greetingBanner");
        if (bannerEl) bannerEl.innerHTML = `${greeting}, <span id="welcomeStudentName" style="color: #4f46e5;">${escapeHtml(studentName)}</span>`;
    }

    function tryApplyPrefetchedData() {
        try {
            const prefetchRaw = sessionStorage.getItem("studentDashboardPrefetch");
            if (!prefetchRaw) {
                applyStudentProfileUI();
                return false;
            }

            const data = JSON.parse(prefetchRaw);
            if (!data) {
                applyStudentProfileUI();
                return false;
            }

            // Apply profile
            if (data.profile) {
                applyStudentProfileUI(data.profile.name, data.profile.email);
            } else {
                applyStudentProfileUI();
            }

            // Apply dashboard components
            renderDashboardComponents(data.tests || [], data.attempts || [], data.results || [], data.stats || null);
            return true;
        } catch (err) {
            console.warn("Could not apply prefetch:", err);
            applyStudentProfileUI();
            return false;
        }
    }

    async function refreshStudentDashboard(showLoading = false) {
        const token = localStorage.getItem("studentToken") || localStorage.getItem("token");
        if (!token) return;

        const studentId = getStudentId();
        const headers = { "Accept": "application/json", "Authorization": "Bearer " + token };

        if (showLoading) {
            const availableEl = document.getElementById("availableTestsContainer");
            if (availableEl && !availableEl.children.length) {
                availableEl.innerHTML = `
                    <div class="loading" style="grid-column: 1 / -1;">
                        <i class="bi bi-arrow-repeat"></i>
                        <p>Loading available assessments...</p>
                    </div>
                `;
            }
        }

        try {
            // Parallel fetch all dashboard endpoints concurrently
            const [profileRes, testsRes, attemptsRes, resultsRes, statsRes] = await Promise.allSettled([
                fetch("/api/student/profile", { headers }),
                fetch("/api/student/tests", { headers }),
                fetch("/api/student/tests/my-attempts", { headers }),
                fetch("/api/student/results/my-results", { headers }),
                fetch(studentId ? `/api/student/stats?studentId=${encodeURIComponent(studentId)}` : "/api/student/stats", { headers })
            ]);

            // Handle Profile
            if (profileRes.status === "fulfilled" && profileRes.value.ok) {
                try {
                    const profile = await profileRes.value.json();
                    if (profile) {
                        if (profile.id) localStorage.setItem("studentId", String(profile.id));
                        if (profile.name) localStorage.setItem("studentName", profile.name);
                        if (profile.email) localStorage.setItem("studentEmail", profile.email);
                        applyStudentProfileUI(profile.name, profile.email);
                    }
                } catch(e) {}
            }

            // Handle Tests
            let allTests = [];
            if (testsRes.status === "fulfilled" && testsRes.value.ok) {
                try {
                    const tData = await testsRes.value.json();
                    allTests = Array.isArray(tData) ? tData : (tData ? [tData] : []);
                } catch(e) {}
            }

            // Handle Attempts
            let attemptsList = [];
            if (attemptsRes.status === "fulfilled" && attemptsRes.value.ok) {
                try {
                    const aData = await attemptsRes.value.json();
                    attemptsList = Array.isArray(aData) ? aData : [];
                } catch(e) {}
            }

            // Handle Results (with fallback if needed)
            let resultsList = [];
            if (resultsRes.status === "fulfilled" && resultsRes.value.ok) {
                try {
                    const rData = await resultsRes.value.json();
                    resultsList = Array.isArray(rData) ? rData : (rData.content || (rData ? [rData] : []));
                } catch(e) {}
            } else if (studentId) {
                try {
                    const fallbackRes = await fetch(`/api/student/results/student/${studentId}`, { headers });
                    if (fallbackRes.ok) {
                        const fbData = await fallbackRes.json();
                        resultsList = Array.isArray(fbData) ? fbData : (fbData.content || (fbData ? [fbData] : []));
                    }
                } catch(e) {}
            }

            // Handle Stats
            let statsData = null;
            if (statsRes && statsRes.status === "fulfilled" && statsRes.value.ok) {
                try {
                    statsData = await statsRes.value.json();
                } catch(e) {}
            }

            // Render all components with fresh data
            renderDashboardComponents(allTests, attemptsList, resultsList, statsData);

            // Update session cache
            try {
                sessionStorage.setItem("studentDashboardPrefetch", JSON.stringify({
                    tests: allTests,
                    attempts: attemptsList,
                    results: resultsList,
                    stats: statsData,
                    timestamp: Date.now()
                }));
            } catch(e) {}

        } catch (error) {
            console.warn("Could not refresh dashboard data:", error);
        }
    }

    function renderDashboardComponents(allTests, attemptsList, resultsList, statsData) {
        completedTestIds.clear();

        if (Array.isArray(attemptsList)) {
            attemptsList.forEach(id => completedTestIds.add(Number(id)));
        }

        let latestResult = null;
        if (Array.isArray(resultsList) && resultsList.length > 0) {
            latestResult = resultsList[0];
            resultsList.forEach(r => {
                if (r.testId) completedTestIds.add(Number(r.testId));
            });
        }

        // 1. Total Tests (Available Assessments)
        const totalTestsCount = statsData && statsData.availableTests != null
            ? Number(statsData.availableTests)
            : allTests.length;
        setText("statTotalTests", String(totalTestsCount));

        // 2. Tests Given & Total Attempts
        const testsGivenCount = statsData && (statsData.completedTests != null || statsData.testsGiven != null)
            ? Number(statsData.completedTests ?? statsData.testsGiven)
            : completedTestIds.size;

        const totalAttemptsCount = statsData && (statsData.totalAttempts != null || statsData.attemptedTests != null)
            ? Number(statsData.totalAttempts ?? statsData.attemptedTests)
            : Math.max(attemptsList.length, resultsList.length, testsGivenCount);

        setText("statTestsGiven", String(testsGivenCount));
        setText("statTotalAttempts", String(totalAttemptsCount));

        // 3. Career Match (Fallback to last valid career match if score is 0)
        const extractMatch = (res) => {
            if (!res) return null;
            const score = Number(res.score ?? res.totalScore ?? res.obtainedScore ?? 0);
            if (score <= 0) return null;
            let name = "";
            if (res.recommendedCareer) {
                name = typeof res.recommendedCareer === 'object'
                    ? (res.recommendedCareer.careerName || res.recommendedCareer.name || "")
                    : String(res.recommendedCareer);
            }
            if (!name && res.careerName) {
                name = res.careerName;
            }
            if (!name && (res.highestCategory || res.category)) {
                const cat = (res.highestCategory || res.category).trim().toUpperCase();
                if (cat === "DATA_SCIENCE") name = "Data Scientist & ML Engineer";
                else if (cat === "AI_MACHINE_LEARNING") name = "AI & Machine Learning Engineer";
                else if (cat === "SOFTWARE_ENGINEERING") name = "Software Engineer";
                else if (cat === "WEB_DEVELOPMENT") name = "Web Developer";
                else if (cat === "CYBER_SECURITY") name = "Cybersecurity Analyst";
                else if (cat === "CLOUD_COMPUTING") name = "Cloud Solutions Architect";
                else if (cat === "DEVOPS_ENGINEERING") name = "DevOps Engineer";
                else if (cat === "MOBILE_DEVELOPMENT") name = "Mobile Developer";
                else name = formatCategory(cat);
            }
            if (name && name !== "Career Not Found") {
                return name;
            }
            return null;
        };

        let careerMatchName = "Pending Assessment";
        if (latestResult) {
            let found = extractMatch(latestResult);
            if (!found && Array.isArray(resultsList)) {
                // If latest attempt scored 0, find last previous valid career match
                for (let i = 1; i < resultsList.length; i++) {
                    const prevMatch = extractMatch(resultsList[i]);
                    if (prevMatch) {
                        found = prevMatch;
                        break;
                    }
                }
            }
            careerMatchName = found || "Career Not Found";
        }
        setText("statCareerMatch", careerMatchName);

        // 4. Update Greeting Status Badge
        const statusBadge = document.getElementById("greetingStatusBadge");
        if (statusBadge) {
            if (testsGivenCount > 0 || latestResult) {
                statusBadge.style.background = "#ecfdf5";
                statusBadge.style.color = "#059669";
                statusBadge.style.borderColor = "#a7f3d0";
                statusBadge.innerHTML = '<i class="bi bi-check-circle-fill"></i><span>Career Recommendation Ready</span>';
            } else {
                statusBadge.style.background = "#fffbeb";
                statusBadge.style.color = "#d97706";
                statusBadge.style.borderColor = "#fde68a";
                statusBadge.innerHTML = '<i class="bi bi-clock-history"></i><span>Assessment Pending</span>';
            }
        }

        // 5. Render Latest Result & Available Tests
        try {
            renderLatestResult(latestResult);
        } catch (err) {
            console.error("Error rendering latest result:", err);
        }

        try {
            renderAvailableTests(allTests);
        } catch (err) {
            console.error("Error rendering available tests:", err);
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
                    <div style="display: flex; gap: 8px; width: 100%;">
                        <a href="student-results.html" class="btn btn-secondary" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 13px; padding: 8px 10px;">
                            <i class="bi bi-eye"></i> View Result
                        </a>
                        <button type="button" class="btn btn-primary start-test-btn" data-id="${test.id}" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 13px; padding: 8px 10px;">
                            <i class="bi bi-arrow-repeat"></i> Retake
                        </button>
                    </div>
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
            const topRoadmapBtn = document.getElementById("topRoadmapBtn");
            if (topRoadmapBtn) {
                topRoadmapBtn.href = "take-assessment.html";
                topRoadmapBtn.innerHTML = '<i class="bi bi-play-circle"></i> Take Assessment First';
                topRoadmapBtn.classList.remove("btn-outline-secondary");
                topRoadmapBtn.classList.add("btn-outline-primary");
            }

            container.innerHTML = `
                <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1.5px dashed #cbd5e1; border-radius: 14px; padding: 36px 24px; text-align: center;">
                    <div style="width: 56px; height: 56px; border-radius: 50%; background: #e0e7ff; color: #4f46e5; display: inline-flex; align-items: center; justify-content: center; font-size: 26px; margin-bottom: 14px;">
                        <i class="bi bi-compass"></i>
                    </div>
                    <h3 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 0 0 6px 0;">No Career Recommendation Yet</h3>
                    <p style="font-size: 13.5px; color: #64748b; max-width: 520px; margin: 0 auto; line-height: 1.55;">
                        Complete your first career aptitude assessment to generate a customized career match, verified score metrics, and your personalized learning roadmap.
                    </p>
                </div>
            `;
            return;
        }

        let careerName = "";
        if (result.recommendedCareer) {
            if (typeof result.recommendedCareer === 'object') {
                careerName = result.recommendedCareer.careerName || result.recommendedCareer.name || "";
            } else if (typeof result.recommendedCareer === 'string') {
                careerName = result.recommendedCareer;
            }
        }
        if (!careerName && result.careerName) {
            careerName = result.careerName;
        }
        const rawCategory = result.highestCategory || result.category || (result.recommendedCareer && typeof result.recommendedCareer === 'object' ? result.recommendedCareer.category : "");
        if (!careerName && rawCategory) {
            const cat = rawCategory.trim().toUpperCase();
            if (cat === "DATA_SCIENCE") careerName = "Data Scientist & ML Engineer";
            else if (cat === "AI_MACHINE_LEARNING") careerName = "AI & Machine Learning Engineer";
            else if (cat === "SOFTWARE_ENGINEERING") careerName = "Software Engineer";
            else if (cat === "WEB_DEVELOPMENT") careerName = "Full Stack Web Developer";
            else if (cat === "CYBER_SECURITY") careerName = "Cybersecurity Analyst & Ethical Hacker";
            else if (cat === "CLOUD_COMPUTING") careerName = "Cloud Solutions Architect & DevOps";
            else if (cat === "DEVOPS_ENGINEERING") careerName = "DevOps Engineer";
            else if (cat === "MOBILE_DEVELOPMENT") careerName = "Mobile Application Developer";
            else careerName = formatCategory(cat) + " Specialist";
        }
        if (!careerName) {
            careerName = "Career Match Found";
        }

        const score = Math.round(result.percentage ?? result.totalScore ?? result.score ?? 0);
        const resultId = result.resultId ?? result.id;
        const testName = result.testName || "Career Aptitude Assessment";
        const roadmapBtn = document.querySelector('a[href*="learning-roadmap.html"]');
        if (roadmapBtn && careerName) {
            roadmapBtn.href = `learning-roadmap.html?track=${encodeURIComponent(careerName)}`;
        }
        const categoryName = formatCategory(rawCategory || "GENERAL");

        container.innerHTML = `
            <div style="background: linear-gradient(135deg, #f8faff 0%, #edf4ff 100%); border: 1px solid var(--student-primary-border); border-radius: var(--student-radius); padding: 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 20px;">
                <div style="display: flex; align-items: center; gap: 18px;">
                    <div style="width: 60px; height: 60px; border-radius: 50%; background: var(--student-primary); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 26px; flex-shrink: 0; box-shadow: 0 4px 12px rgba(18, 104, 243, 0.25);">
                        <i class="bi bi-trophy"></i>
                    </div>
                    <div>
                        <span style="font-size: 11.5px; font-weight: 700; color: var(--student-primary); text-transform: uppercase; letter-spacing: 0.05em;">RECOMMENDED CAREER PATH • ${escapeHtml(testName)}</span>
                        <h3 style="font-size: 20px; font-weight: 800; color: var(--student-text-main); margin: 2px 0 6px;">${escapeHtml(careerName)}</h3>
                        <div style="display: flex; gap: 12px; font-size: 13px; color: var(--student-text-muted); align-items: center;">
                            <span>Overall Match: <strong style="color: #059669; font-weight: 700;">${score}%</strong></span>
                            <span>•</span>
                            <span>Domain: <strong style="color: var(--student-text-main); font-weight: 600;">${escapeHtml(categoryName)}</strong></span>
                        </div>
                    </div>
                </div>

                <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                    ${careerName === "Career Not Found" ? `
                        <a href="take-assessment.html" class="btn btn-warning" style="font-size: 13px; height: 38px; display: inline-flex; align-items: center; gap: 6px; background: #fef3c7; color: #b45309; border: 1px solid #fde68a; font-weight: 700;">
                            <i class="bi bi-arrow-repeat"></i> Retake Test (Score 0%)
                        </a>
                    ` : `
                        <a href="learning-roadmap.html?track=${encodeURIComponent(careerName)}" class="btn btn-outline-primary" style="font-size: 13px; height: 38px; display: inline-flex; align-items: center; gap: 6px;">
                            <i class="bi bi-signpost-split"></i> View Roadmap
                        </a>
                        <a href="result.html?resultId=${resultId}" class="btn btn-primary" style="font-size: 13px; height: 38px; display: inline-flex; align-items: center; gap: 6px;">
                            <i class="bi bi-file-earmark-text"></i> View Full Report
                        </a>
                    `}
                </div>
            </div>
        `;
    }

    function formatCategory(cat) {
        if (!cat) return "General";
        return String(cat).replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    }

    function startTest(testId) {
        if (!testId) return;
        try {
            const docEl = document.documentElement;
            if (docEl.requestFullscreen) {
                docEl.requestFullscreen().catch(() => {});
            } else if (docEl.webkitRequestFullscreen) {
                docEl.webkitRequestFullscreen().catch(() => {});
            }
        } catch (e) {}
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