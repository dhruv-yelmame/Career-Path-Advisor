document.addEventListener("DOMContentLoaded", () => {

    const sidebar = document.getElementById("studentSidebar");
    const menuBtn = document.getElementById("studentMenuBtn");
    const logoutBtn = document.getElementById("studentLogout");
    const container = document.getElementById("resultsContainer");
    const emptyState = document.getElementById("emptyResultsState");
    const searchInput = document.getElementById("searchResultsInput");
    const clearSearchBtn = document.getElementById("clearSearchBtn");
    const scoreTierFilter = document.getElementById("scoreTierFilter");
    const sortFilter = document.getElementById("sortFilter");
    const totalCountEl = document.getElementById("totalResultsCount");

    let allResults = [];

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

    loadResults();

    searchInput?.addEventListener("input", () => {
        if (clearSearchBtn) {
            clearSearchBtn.style.display = searchInput.value ? "inline-block" : "none";
        }
        filterAndRender();
    });

    clearSearchBtn?.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";
        if (clearSearchBtn) clearSearchBtn.style.display = "none";
        filterAndRender();
    });

    scoreTierFilter?.addEventListener("change", filterAndRender);
    sortFilter?.addEventListener("change", filterAndRender);

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

    async function loadResults() {

        const token = localStorage.getItem("studentToken") || localStorage.getItem("token");
        const studentId = getStudentId();

        if (!token) {
            window.location.href = "/student-login.html";
            return;
        }

        try {
            // Try /my-results endpoint first, with fallback to student ID
            let response = await fetch("/api/student/results/my-results", {
                headers: { "Accept": "application/json", "Authorization": "Bearer " + token }
            });

            if (!response.ok && studentId) {
                response = await fetch(`/api/student/results/student/${studentId}`, {
                    headers: { "Accept": "application/json", "Authorization": "Bearer " + token }
                });
            }

            if (!response.ok) throw new Error("Failed to load assessment results from server.");

            const data = await response.json();
            allResults = Array.isArray(data) ? data : (data.content || []);

            filterAndRender();
        } catch (error) {
            console.error("Load results error:", error);
            if (container) {
                container.innerHTML = `
                    <div class="empty-state" style="grid-column: 1 / -1;">
                        <i class="bi bi-exclamation-triangle" style="color: var(--student-danger);"></i>
                        <h3>Unable to load results</h3>
                        <p>${escapeHtml(error.message)}</p>
                        <button type="button" onclick="location.reload()" class="btn btn-secondary">
                            <i class="bi bi-arrow-clockwise"></i> Try Again
                        </button>
                    </div>
                `;
            }
        }
    }

    function filterAndRender() {
        if (!container) return;

        const query = (searchInput?.value || "").trim().toLowerCase();
        const scoreTier = (scoreTierFilter?.value || "all").toLowerCase();
        const sortBy = (sortFilter?.value || "newest").toLowerCase();

        // 1. Filter
        const filtered = allResults.filter(r => {
            const recName = typeof r.recommendedCareer === 'object' && r.recommendedCareer !== null
                ? (r.recommendedCareer.careerName || "")
                : (r.recommendedCareer || r.careerName || "");
            const career = recName.toLowerCase();
            const testName = (r.testName || "").toLowerCase();
            const cat = (r.highestCategory || r.category || "").toLowerCase();
            const matchesQuery = !query || career.includes(query) || testName.includes(query) || cat.includes(query);
            if (!matchesQuery) return false;

            const score = Number(r.percentage != null ? Math.round(r.percentage) : (r.totalScore ?? r.score ?? 0));
            if (scoreTier === "distinction" && score < 80) return false;
            if (scoreTier === "first_class" && (score < 60 || score >= 80)) return false;
            if (scoreTier === "average" && (score < 40 || score >= 60)) return false;
            if (scoreTier === "low" && score >= 40) return false;

            return true;
        });

        // 2. Sort
        filtered.sort((a, b) => {
            const scoreA = Number(a.percentage != null ? Math.round(a.percentage) : (a.totalScore ?? a.score ?? 0));
            const scoreB = Number(b.percentage != null ? Math.round(b.percentage) : (b.totalScore ?? b.score ?? 0));
            const timeA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
            const timeB = b.completedAt ? new Date(b.completedAt).getTime() : 0;

            if (sortBy === "score_desc") return scoreB - scoreA;
            if (sortBy === "score_asc") return scoreA - scoreB;
            if (sortBy === "oldest") return timeA - timeB;
            // Default: newest first
            return timeB - timeA;
        });

        if (totalCountEl) totalCountEl.textContent = filtered.length;
        container.innerHTML = "";

        const filterPanel = document.getElementById("resultsFilterPanel");
        if (allResults.length === 0) {
            if (filterPanel) filterPanel.style.display = "none";
        } else {
            if (filterPanel) filterPanel.style.display = "block";
        }

        if (filtered.length === 0) {
            if (emptyState) {
                emptyState.hidden = false;
                emptyState.style.display = "block";
                if (allResults.length === 0) {
                    emptyState.innerHTML = `
                        <div style="width: 64px; height: 64px; border-radius: 50%; background: #eff6ff; color: #2563eb; display: inline-flex; align-items: center; justify-content: center; font-size: 28px; margin-bottom: 16px;">
                            <i class="bi bi-journal-x"></i>
                        </div>
                        <h3 style="font-size: 19px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">No Completed Assessments Yet</h3>
                        <p style="font-size: 13.5px; color: #64748b; max-width: 460px; margin: 0 auto; line-height: 1.55;">
                            You haven't completed any assessments yet. Take your first aptitude test to unlock verified performance scores and career recommendations.
                        </p>
                    `;
                } else {
                    emptyState.innerHTML = `
                        <div style="width: 56px; height: 56px; border-radius: 50%; background: #f1f5f9; color: #64748b; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 14px;">
                            <i class="bi bi-search"></i>
                        </div>
                        <h3 style="font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 6px;">No Matching Results</h3>
                        <p style="font-size: 13px; color: #64748b; max-width: 420px; margin: 0 auto 16px auto;">
                            No test reports match your selected filters. Try clearing your search query or choosing another score range.
                        </p>
                        <button type="button" id="resetFiltersBtn" class="btn btn-secondary" style="font-size: 13px; padding: 8px 16px;">
                            <i class="bi bi-arrow-counterclockwise"></i> Reset Filters
                        </button>
                    `;
                    const resetBtn = emptyState.querySelector("#resetFiltersBtn");
                    if (resetBtn) {
                        resetBtn.addEventListener("click", () => {
                            if (searchInput) searchInput.value = "";
                            if (clearSearchBtn) clearSearchBtn.style.display = "none";
                            if (scoreTierFilter) scoreTierFilter.value = "all";
                            if (sortFilter) sortFilter.value = "newest";
                            filterAndRender();
                        });
                    }
                }
            }
            return;
        }

        if (emptyState) {
            emptyState.hidden = true;
            emptyState.style.display = "none";
        }

        filtered.forEach(res => {
            const card = document.createElement("div");
            card.className = "student-card";

            const resultId = res.resultId || res.id;
            const totalScore = res.totalScore ?? res.score ?? 0;
            const obtainedScore = res.obtainedScore ?? res.knowledgeScore ?? totalScore;
            let careerName = "";

            if (obtainedScore === 0 || totalScore === 0) {
                careerName = "Career Not Found";
            } else {
                if (typeof res.recommendedCareer === 'object' && res.recommendedCareer !== null) {
                    careerName = res.recommendedCareer.careerName || res.recommendedCareer.name || "";
                } else if (typeof res.recommendedCareer === 'string') {
                    careerName = res.recommendedCareer;
                }
                if (!careerName && res.careerName) {
                    careerName = res.careerName;
                }
                const catRaw = res.highestCategory || res.category || "";
                if (!careerName && catRaw) {
                    const catUpper = catRaw.trim().toUpperCase();
                    if (catUpper === "DATA_SCIENCE") careerName = "Data Scientist & ML Engineer";
                    else if (catUpper === "AI_MACHINE_LEARNING") careerName = "AI & Machine Learning Engineer";
                    else if (catUpper === "SOFTWARE_ENGINEERING") careerName = "Software Engineer";
                    else if (catUpper === "WEB_DEVELOPMENT") careerName = "Full Stack Web Developer";
                    else if (catUpper === "CYBER_SECURITY") careerName = "Cybersecurity Analyst & Ethical Hacker";
                    else if (catUpper === "CLOUD_COMPUTING") careerName = "Cloud Solutions Architect & DevOps";
                    else if (catUpper === "DEVOPS_ENGINEERING") careerName = "DevOps Engineer";
                    else if (catUpper === "MOBILE_DEVELOPMENT") careerName = "Mobile Application Developer";
                    else careerName = formatCategory(catUpper) + " Specialist";
                }
                if (!careerName) {
                    careerName = "Career Match Found";
                }
            }
            const catRaw = res.highestCategory || res.category || "";
            const category = formatCategory(res.category || catRaw || "GENERAL");
            const testName = res.testName || "Career Aptitude Assessment";
            const dateStr = res.completedAt
                ? new Date(res.completedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                : "Recent";

            card.innerHTML = `
                <div>
                    <div class="student-card-header">
                        <div class="student-card-icon" style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); color: var(--student-primary);">
                            <i class="bi bi-trophy"></i>
                        </div>
                        <span class="badge badge-active" style="font-size: 11px; text-transform: uppercase;">
                            ${escapeHtml(category)}
                        </span>
                    </div>

                    <div style="margin-bottom: 4px;">
                        <span style="font-size: 12px; font-weight: 600; color: var(--student-primary); display: flex; align-items: center; gap: 4px;">
                            <i class="bi bi-journal-check"></i> ${escapeHtml(testName)}
                        </span>
                    </div>

                    <h3 class="student-card-title" style="margin-top: 4px;">${escapeHtml(careerName)}</h3>
                    <p class="student-card-desc" style="font-size: 13px; margin-bottom: 16px;">
                        ${escapeHtml(res.description || "Personalized career recommendation profile calculated from your answers.")}
                    </p>

                    <!-- SCORE METRIC BADGE -->
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; background: ${careerName === 'Career Not Found' ? '#fffbeb' : '#f8fafc'}; padding: 12px 16px; border-radius: 10px; border: 1px solid ${careerName === 'Career Not Found' ? '#fde68a' : 'var(--student-border)'};">
                        <div>
                            <small style="display: block; font-size: 10.5px; color: ${careerName === 'Career Not Found' ? '#b45309' : 'var(--student-text-muted)'}; text-transform: uppercase; font-weight: 700;">Career Compatibility</small>
                            <strong style="color: ${careerName === 'Career Not Found' ? '#d97706' : 'var(--student-primary)'}; font-size: 17px; font-weight: 800;">${totalScore}% Match</strong>
                        </div>
                        <span class="badge" style="background: ${careerName === 'Career Not Found' ? '#fef3c7' : '#ecfdf5'}; color: ${careerName === 'Career Not Found' ? '#b45309' : '#059669'}; border: 1px solid ${careerName === 'Career Not Found' ? '#fde68a' : '#a7f3d0'}; font-weight: 700; font-size: 12px; padding: 5px 12px; border-radius: 9999px;">
                            <i class="bi ${careerName === 'Career Not Found' ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'}"></i> ${careerName === 'Career Not Found' ? 'Score 0' : 'Completed'}
                        </span>
                    </div>
                </div>

                <div>
                    <div class="student-card-meta" style="margin-bottom: 12px; font-size: 12px;">
                        <span><i class="bi bi-calendar-check"></i> Evaluated ${dateStr}</span>
                        <span><i class="bi ${careerName === 'Career Not Found' ? 'bi-exclamation-circle-fill text-warning' : 'bi-check-circle-fill text-success'}"></i> ${careerName === 'Career Not Found' ? 'No Match' : 'Verified'}</span>
                    </div>

                    ${careerName === "Career Not Found" ? `
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 8px 12px; font-size: 12px; color: #dc2626; display: flex; align-items: center; gap: 8px;">
                                <i class="bi bi-exclamation-triangle-fill" style="flex-shrink: 0; font-size: 14px;"></i>
                                <span>No career match was found for this 0% score. Report is unavailable.</span>
                            </div>
                            <a href="take-assessment.html" class="btn btn-secondary" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 13px;">
                                <i class="bi bi-arrow-repeat"></i> Retake Assessment
                            </a>
                        </div>
                    ` : `
                        <a href="result.html?resultId=${resultId}" class="btn btn-primary" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <i class="bi bi-file-earmark-text"></i> View Full Report
                        </a>
                    `}
                </div>
            `;

            container.appendChild(card);
        });
    }

    function formatCategory(cat) {
        if (!cat) return "General";
        return cat.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    }

    function escapeHtml(str) {
        const div = document.createElement("div");
        div.textContent = str ?? "";
        return div.innerHTML;
    }
});
