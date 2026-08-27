document.addEventListener("DOMContentLoaded", function () {

    const sidebar = document.getElementById("studentSidebar");
    const menuBtn = document.getElementById("studentMenuBtn");
    const logoutBtn = document.getElementById("studentLogout");
    const container = document.getElementById("testsContainer");
    const emptyState = document.getElementById("emptyState");
    const searchInput = document.getElementById("searchTestsInput");
    const statusFilter = document.getElementById("statusFilterSelect");
    const refreshBtn = document.getElementById("refreshTestsBtn");
    const totalCountEl = document.getElementById("totalTestsCount");

    let allTests = [];
    let completedTestIds = new Set();

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

    loadAvailableTests();

    searchInput?.addEventListener("input", filterAndRender);
    statusFilter?.addEventListener("change", filterAndRender);
    refreshBtn?.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";
        if (statusFilter) statusFilter.value = "ALL";
        loadAvailableTests(true);
    });

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

    async function loadAvailableTests(isManual = false) {
        const icon = refreshBtn?.querySelector("i");
        if (refreshBtn) refreshBtn.disabled = true;
        if (icon) icon.classList.add("spin");

        const token = localStorage.getItem("studentToken") || localStorage.getItem("token");
        if (!token) {
            window.location.href = "/student-login.html";
            return;
        }

        const studentId = getStudentId();

        try {
            // Fetch available tests and student's completed tests in parallel
            const [testsRes, attemptsRes, resultsRes] = await Promise.all([
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

            if (!testsRes.ok) throw new Error("Failed to load assessments from server.");

            allTests = await testsRes.json();
            completedTestIds.clear();

            if (attemptsRes.ok) {
                const ids = await attemptsRes.json();
                if (Array.isArray(ids)) ids.forEach(id => completedTestIds.add(Number(id)));
            }

            if (resultsRes.ok) {
                const results = await resultsRes.json();
                if (Array.isArray(results)) {
                    results.forEach(r => {
                        if (r.testId) completedTestIds.add(Number(r.testId));
                    });
                }
            }

            filterAndRender();

            if (isManual && window.AppToast) {
                window.AppToast.success("Available assessments refreshed!");
            }
        } catch (error) {
            console.error("Load tests error:", error);
            if (container) {
                container.innerHTML = `
                    <div class="empty-state" style="grid-column: 1 / -1;">
                        <i class="bi bi-exclamation-triangle" style="color: var(--student-danger);"></i>
                        <h3>Unable to load assessments</h3>
                        <p>${escapeHtml(error.message)}</p>
                        <button type="button" onclick="location.reload()" class="btn btn-secondary">
                            <i class="bi bi-arrow-clockwise"></i> Try Again
                        </button>
                    </div>
                `;
            }
        } finally {
            if (refreshBtn) refreshBtn.disabled = false;
            if (icon) icon.classList.remove("spin");
        }
    }

    function filterAndRender() {
        if (!container) return;

        const query = (searchInput?.value || "").trim().toLowerCase();
        const statusVal = (statusFilter?.value || "ALL").toUpperCase();

        const filtered = allTests.filter(t => {
            const matchesQuery = !query ||
                (t.testName || "").toLowerCase().includes(query) ||
                (t.description || "").toLowerCase().includes(query);

            const isCompleted = completedTestIds.has(Number(t.id));

            let matchesStatus = true;
            if (statusVal === "ACTIVE") matchesStatus = Boolean(t.active) && !isCompleted;
            else if (statusVal === "INACTIVE") matchesStatus = !t.active;
            else if (statusVal === "COMPLETED") matchesStatus = isCompleted;

            return matchesQuery && matchesStatus;
        });

        if (totalCountEl) totalCountEl.textContent = filtered.length;
        container.innerHTML = "";

        if (filtered.length === 0) {
            if (emptyState) emptyState.hidden = false;
            return;
        }

        if (emptyState) emptyState.hidden = true;

        filtered.forEach(test => {
            const isActive = Boolean(test.active);
            const isCompleted = completedTestIds.has(Number(test.id));
            const card = document.createElement("div");
            card.className = "student-card";

            let headerIconClass = "bi-file-earmark-text";
            let headerIconStyle = "";
            let badgeHtml = "";
            let actionBtnHtml = "";

            if (isCompleted) {
                headerIconClass = "bi-file-earmark-check";
                headerIconStyle = "background: #ecfdf5; color: #059669;";
                badgeHtml = `
                    <span class="badge" style="background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0;">
                        <i class="bi bi-check2-circle"></i> Completed
                    </span>
                `;
                actionBtnHtml = `
                    <a href="student-results.html" class="btn btn-secondary" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <i class="bi bi-eye"></i> View Result & Report
                    </a>
                `;
            } else if (!isActive) {
                headerIconClass = "bi-file-earmark-lock";
                headerIconStyle = "background: #f1f5f9; color: #94a3b8;";
                badgeHtml = `
                    <span class="badge badge-danger">
                        <i class="bi bi-slash-circle"></i> Inactive
                    </span>
                `;
                actionBtnHtml = `
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
                actionBtnHtml = `
                    <button type="button" class="btn btn-primary start-test-btn" data-id="${test.id}" style="width: 100%;">
                        <i class="bi bi-play-circle-fill"></i> Start Assessment
                    </button>
                `;
            }

            card.innerHTML = `
                <div>
                    <div class="student-card-header">
                        <div class="student-card-icon" style="${headerIconStyle}">
                            <i class="bi ${headerIconClass}"></i>
                        </div>
                        ${badgeHtml}
                    </div>

                    <h3 class="student-card-title">${escapeHtml(test.testName || "Career Aptitude Assessment")}</h3>
                    <p class="student-card-desc">${escapeHtml(test.description || "Comprehensive career evaluation and aptitude assessment.")}</p>
                </div>

                <div>
                    <div class="student-card-meta">
                        <span><i class="bi bi-question-circle"></i> ${test.questionCount ?? 0} Questions</span>
                        <span><i class="bi bi-clock"></i> ${test.timeLimitMinutes ?? 15} Mins</span>
                    </div>

                    ${actionBtnHtml}
                </div>
            `;

            container.appendChild(card);
        });

        // Attach event listener only to active, non-completed test start buttons
        container.querySelectorAll(".start-test-btn").forEach(btn => {
            btn.addEventListener("click", function () {
                const id = this.getAttribute("data-id");
                startTest(id);
            });
        });
    }

    async function startTest(testId) {
        const token = localStorage.getItem("studentToken") || localStorage.getItem("token");
        const studentId = getStudentId();

        if (!token) {
            window.location.href = "/student-login.html";
            return;
        }

        try {
            if (studentId) {
                const canRes = await fetch(`/api/student/tests/${testId}/can-attempt?studentId=${studentId}`, {
                    headers: { "Accept": "application/json", "Authorization": "Bearer " + token }
                });

                if (canRes.ok) {
                    const canAttempt = await canRes.json();
                    if (!canAttempt) {
                        if (window.AppToast) {
                            window.AppToast.warning("You have already completed this test or it is inactive.");
                        }
                        return;
                    }
                }
            }

            window.location.href = `student-test.html?testId=${testId}`;

        } catch (e) {
            window.location.href = `student-test.html?testId=${testId}`;
        }
    }

    function escapeHtml(str) {
        const div = document.createElement("div");
        div.textContent = str ?? "";
        return div.innerHTML;
    }
});
