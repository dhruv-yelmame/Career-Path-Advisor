document.addEventListener("DOMContentLoaded", () => {

    const params = new URLSearchParams(window.location.search);
    const studentId = params.get("id");

    if (!studentId) {
        if (window.AppToast) {
            window.AppToast.error("Student ID is missing.");
        }
        setTimeout(() => {
            window.location.href = "students.html";
        }, 1500);
        return;
    }

    loadStudentData();

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

    async function loadStudentData() {
        try {
            await Promise.all([
                loadStudentProfile(),
                loadStudentResults()
            ]);
        } catch (error) {
            console.error("Error loading student details:", error);
        }
    }

    async function loadStudentProfile() {
        const profileContainer = document.getElementById("studentProfile");

        try {
            const response = await fetch(`/api/admin/students/${encodeURIComponent(studentId)}`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error("Unable to load student profile.");
            }

            const student = await response.json();
            renderProfile(student);

            setText("testsAttempted", student.testsAttempted ?? 0);
            setText("testsCompleted", student.testsCompleted ?? 0);

        } catch (error) {
            console.error(error);
            if (profileContainer) {
                profileContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="bi bi-exclamation-triangle"></i>
                        <h3>Unable to load student profile</h3>
                        <p>${escapeHtml(error.message)}</p>
                    </div>
                `;
            }
        }
    }

    function renderProfile(student) {
        const profileContainer = document.getElementById("studentProfile");
        if (!profileContainer) return;

        const name = student.name || "Student";
        const email = student.email || student.maskedEmail || "-";
        const mobile = student.mobile || "Not provided";
        const course = student.education || student.course || "BE";
        let latestRec = student.latestRecommendation || "Not yet assessed";

        let isRecNotMatched = false;
        if (latestRec === "Career Not Found" || latestRec === "Career Not Match" || latestRec.toLowerCase().includes("not match") || latestRec.toLowerCase().includes("not found")) {
            latestRec = "Career Not Match";
            isRecNotMatched = true;
        }

        const recCardHtml = isRecNotMatched
            ? `<div style="background: #fef2f2; padding: 8px 12px; border-radius: 8px; border: 1px solid #fecaca;">
                   <small style="color: #dc2626; display: block; font-size: 11px; font-weight: 700;">RECOMMENDED CAREER</small>
                   <strong style="color: #b91c1c; font-size: 13.5px;"><i class="bi bi-x-circle-fill"></i> ${escapeHtml(latestRec)}</strong>
               </div>`
            : `<div style="background: #eff6ff; padding: 8px 12px; border-radius: 8px; border: 1px solid #bfdbfe;">
                   <small style="color: #2563eb; display: block; font-size: 11px; font-weight: 700;">RECOMMENDED CAREER</small>
                   <strong style="color: #1e40af; font-size: 13.5px;"><i class="bi bi-stars"></i> ${escapeHtml(latestRec)}</strong>
               </div>`;

        profileContainer.innerHTML = `
            <div style="display: flex; gap: 20px; align-items: center; flex-wrap: wrap;">
                <div class="profile-circle" style="width: 64px; height: 64px; font-size: 1.8rem; background: linear-gradient(135deg, #2563eb, #7c3aed); color: #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700;">
                    ${escapeHtml(name.charAt(0).toUpperCase())}
                </div>
                <div style="flex: 1; min-width: 240px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <h2 style="font-size: 1.5rem; margin: 0;">${escapeHtml(name)}</h2>
                        <span class="badge-pill assessed" style="font-size: 11px;"><i class="bi bi-check-circle-fill"></i> ASSESSED</span>
                    </div>
                    <p style="color: #64748b; font-size: 0.95rem; margin: 4px 0 12px 0;">
                        <i class="bi bi-envelope"></i> ${escapeHtml(email)} &bull; <i class="bi bi-telephone"></i> ${escapeHtml(mobile)}
                    </p>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-top: 10px;">
                        <div style="background: #f8fafc; padding: 8px 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
                            <small style="color: #64748b; display: block; font-size: 11px; font-weight: 700;">EDUCATION</small>
                            <strong style="color: #0f172a; font-size: 13.5px;">${escapeHtml(course)}</strong>
                        </div>
                        ${recCardHtml}
                    </div>
                </div>
            </div>
        `;
    }

    let allTestResults = [];
    let testHistoryPage = 0;
    const testHistoryPageSize = 5;

    async function loadStudentResults() {
        const historyLoading = document.getElementById("studentTestHistoryLoading");
        const emptyHistory = document.getElementById("emptyTestHistory");

        try {
            const response = await fetch(`/api/student/results/student/${encodeURIComponent(studentId)}`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error("Unable to load student assessment results.");
            }

            const data = await response.json();
            allTestResults = Array.isArray(data) ? data : (data?.content || []);

            setText("careerResultCount", allTestResults.length);

            // Calculate best score
            if (allTestResults.length > 0) {
                const best = Math.max(...allTestResults.map(r => Number(r.percentage ?? r.totalScore ?? r.score ?? 0)));
                setText("bestScore", Number.isFinite(best) ? `${best}%` : "0%");
            } else {
                setText("bestScore", "0%");
            }

            // Hide loading states
            if (historyLoading) historyLoading.style.display = "none";

            // Render Test History with pagination
            testHistoryPage = 0;
            renderTestHistory();

        } catch (error) {
            console.error("Error loading student results:", error);
            if (historyLoading) historyLoading.style.display = "none";

            if (emptyHistory) {
                emptyHistory.hidden = false;
                emptyHistory.style.display = "block";
                emptyHistory.innerHTML = `
                    <i class="bi bi-exclamation-triangle" style="color: #ef4444;"></i>
                    <h3>Unable to load test history</h3>
                    <p>${escapeHtml(error.message)}</p>
                `;
            }
        }
    }

    // =========================================================
    // TEST HISTORY RENDERING & PAGINATION
    // =========================================================
    function renderTestHistory() {
        const tableWrapper = document.getElementById("testHistoryTableWrapper");
        const tbody = document.getElementById("studentTestHistoryBody");
        const emptyHistory = document.getElementById("emptyTestHistory");
        const countBadge = document.getElementById("testHistoryCountBadge");

        const totalItems = allTestResults.length;

        if (countBadge) {
            countBadge.textContent = `${totalItems} ${totalItems === 1 ? 'Attempt' : 'Attempts'}`;
            countBadge.style.display = "inline-flex";
        }

        if (totalItems === 0) {
            if (tableWrapper) tableWrapper.style.display = "none";
            if (emptyHistory) {
                emptyHistory.hidden = false;
                emptyHistory.style.display = "block";
            }
            renderTestHistoryPagination(0, 0, 0);
            return;
        }

        if (emptyHistory) {
            emptyHistory.hidden = true;
            emptyHistory.style.display = "none";
        }
        if (tableWrapper) tableWrapper.style.display = "block";

        const totalPages = Math.ceil(totalItems / testHistoryPageSize);
        if (testHistoryPage >= totalPages) testHistoryPage = Math.max(0, totalPages - 1);
        if (testHistoryPage < 0) testHistoryPage = 0;

        const start = testHistoryPage * testHistoryPageSize;
        const end = Math.min(start + testHistoryPageSize, totalItems);
        const pageItems = allTestResults.slice(start, end);

        if (tbody) {
            tbody.innerHTML = pageItems.map((res, idx) => {
                const testName = res.testName || (res.testId ? `Test #${res.testId}` : "Career Assessment Test");
                let careerName = "";
                if (typeof res.recommendedCareer === 'object' && res.recommendedCareer !== null) {
                    careerName = res.recommendedCareer.careerName || "";
                } else if (typeof res.recommendedCareer === 'string') {
                    careerName = res.recommendedCareer;
                }
                if (!careerName && res.careerName) {
                    careerName = res.careerName;
                }

                const scoreVal = Number(res.percentage != null ? Math.round(res.percentage) : (res.totalScore ?? res.score ?? 0));
                const scoreClass = scoreVal >= 70 ? "high" : (scoreVal >= 40 ? "med" : "low");
                const completed = formatDate(res.completedAt);

                // Attempt display
                const attemptNum = res.attemptNumber || (totalItems - (start + idx));
                const attemptDisplay = `#${attemptNum}`;

                // If score is 0% or no career match found, show "Career Not Match"
                const isNotMatched = scoreVal <= 0 || !careerName || careerName === "Career Match" || careerName === "None" || careerName === "null" || careerName.toLowerCase().includes("not match") || careerName.toLowerCase().includes("not found");

                const careerPillHtml = isNotMatched
                    ? `<span class="career-pill" style="background: #fef2f2; color: #dc2626; border: 1px solid #fecaca;">
                           <i class="bi bi-x-circle-fill"></i> Career Not Match
                       </span>`
                    : `<span class="career-pill">
                           <i class="bi bi-award-fill"></i> ${escapeHtml(careerName)}
                       </span>`;

                return `
                    <tr>
                        <td>
                            <div class="test-name-cell">
                                <div class="test-icon-box">
                                    <i class="bi bi-file-earmark-check-fill"></i>
                                </div>
                                <div class="test-info-box">
                                    <strong>${escapeHtml(testName)}</strong>
                                    <small>Attempt ${attemptDisplay}</small>
                                </div>
                            </div>
                        </td>
                        <td>
                            <span class="score-badge ${scoreClass}">
                                ${scoreVal}%
                            </span>
                        </td>
                        <td>
                            ${careerPillHtml}
                        </td>
                        <td style="color: #64748b; font-size: 12.5px; white-space: nowrap;">
                            <i class="bi bi-calendar3" style="margin-right: 4px; color: #94a3b8;"></i> ${completed}
                        </td>
                        <td style="text-align: center;">
                            <span class="badge-pill assessed">
                                <i class="bi bi-check-circle-fill"></i> Completed
                            </span>
                        </td>
                    </tr>
                `;
            }).join("");
        }

        renderTestHistoryPagination(testHistoryPage, totalPages, totalItems);
    }

    function renderTestHistoryPagination(page, totalPages, totalElements) {
        const rowEl = document.getElementById("testHistoryPaginationRow");
        const infoEl = document.getElementById("testHistoryPaginationInfo");
        const controlsEl = document.getElementById("testHistoryPaginationControls");

        if (!rowEl || !infoEl || !controlsEl) return;

        if (totalElements === 0) {
            rowEl.style.display = "none";
            return;
        }

        rowEl.style.display = "flex";

        const start = page * testHistoryPageSize + 1;
        const end = Math.min((page + 1) * testHistoryPageSize, totalElements);
        infoEl.textContent = `Showing ${start} to ${end} of ${totalElements} entries`;

        if (totalPages <= 1) {
            controlsEl.innerHTML = "";
            return;
        }

        let html = `
            <button type="button" class="pagination-btn" ${page === 0 ? "disabled" : ""} onclick="window.loadStudentTestHistoryPage(${page - 1})">
                <i class="bi bi-chevron-left"></i>
            </button>
        `;

        for (let i = 0; i < totalPages; i++) {
            if (i === 0 || i === totalPages - 1 || (i >= page - 1 && i <= page + 1)) {
                html += `
                    <button type="button" class="pagination-btn ${i === page ? "active" : ""}" onclick="window.loadStudentTestHistoryPage(${i})">
                        ${i + 1}
                    </button>
                `;
            } else if (i === page - 2 || i === page + 2) {
                html += `<span style="padding: 0 4px; color: #94a3b8;">...</span>`;
            }
        }

        html += `
            <button type="button" class="pagination-btn" ${page >= totalPages - 1 ? "disabled" : ""} onclick="window.loadStudentTestHistoryPage(${page + 1})">
                <i class="bi bi-chevron-right"></i>
            </button>
        `;

        controlsEl.innerHTML = html;
    }

    window.loadStudentTestHistoryPage = function (page) {
        testHistoryPage = page;
        renderTestHistory();
        const el = document.getElementById("testHistoryTableWrapper");
        el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    };

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
            element.textContent = value ?? 0;
        }
    }

    function escapeHtml(value) {
        const div = document.createElement("div");
        div.textContent = value ?? "";
        return div.innerHTML;
    }
});