document.addEventListener("DOMContentLoaded", () => {

    const sidebar = document.getElementById("studentSidebar");
    const menuBtn = document.getElementById("studentMenuBtn");
    const logoutBtn = document.getElementById("studentLogout");
    const container = document.getElementById("resultsContainer");
    const emptyState = document.getElementById("emptyResultsState");
    const searchInput = document.getElementById("searchResultsInput");
    const refreshBtn = document.getElementById("refreshResultsBtn");
    const totalCountEl = document.getElementById("totalResultsCount");

    let allResults = [];

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

    loadResults();

    searchInput?.addEventListener("input", filterAndRender);
    refreshBtn?.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";
        loadResults(true);
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

    async function loadResults(isManual = false) {
        const icon = refreshBtn?.querySelector("i");
        if (refreshBtn) refreshBtn.disabled = true;
        if (icon) icon.classList.add("spin");

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

            if (isManual && window.AppToast) {
                window.AppToast.success("Results refreshed successfully!");
            }
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
        } finally {
            if (refreshBtn) refreshBtn.disabled = false;
            if (icon) icon.classList.remove("spin");
        }
    }

    function filterAndRender() {
        if (!container) return;

        const query = (searchInput?.value || "").trim().toLowerCase();
        const filtered = allResults.filter(r => {
            const career = (r.recommendedCareer || r.careerName || "").toLowerCase();
            const testName = (r.testName || "").toLowerCase();
            const cat = (r.category || "").toLowerCase();
            return !query || career.includes(query) || testName.includes(query) || cat.includes(query);
        });

        if (totalCountEl) totalCountEl.textContent = filtered.length;
        container.innerHTML = "";

        if (filtered.length === 0) {
            if (emptyState) emptyState.hidden = false;
            return;
        }

        if (emptyState) emptyState.hidden = true;

        filtered.forEach(res => {
            const card = document.createElement("div");
            card.className = "student-card";

            const resultId = res.resultId || res.id;
            const careerName = res.recommendedCareer || res.careerName || "Career Match Found";
            const category = formatCategory(res.category || "GENERAL");
            const testName = res.testName || "Career Aptitude Assessment";
            const totalScore = res.totalScore ?? res.score ?? 0;
            const interestScore = res.interestScore ?? 0;
            const knowledgeScore = res.knowledgeScore ?? 0;

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

                    <!-- SCORE BREAKDOWN BADGES -->
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 16px; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid var(--student-border);">
                        <div style="text-align: center;">
                            <small style="display: block; font-size: 10.5px; color: var(--student-text-muted); text-transform: uppercase;">Match Score</small>
                            <strong style="color: var(--student-primary); font-size: 15px;">${totalScore}</strong>
                        </div>
                        <div style="text-align: center; border-left: 1px solid var(--student-border); border-right: 1px solid var(--student-border);">
                            <small style="display: block; font-size: 10.5px; color: var(--student-text-muted); text-transform: uppercase;">Interest</small>
                            <strong style="color: #059669; font-size: 15px;">${interestScore}</strong>
                        </div>
                        <div style="text-align: center;">
                            <small style="display: block; font-size: 10.5px; color: var(--student-text-muted); text-transform: uppercase;">Knowledge</small>
                            <strong style="color: #d97706; font-size: 15px;">${knowledgeScore}</strong>
                        </div>
                    </div>
                </div>

                <div>
                    <div class="student-card-meta" style="margin-bottom: 12px; font-size: 12px;">
                        <span><i class="bi bi-calendar-check"></i> Evaluated ${dateStr}</span>
                        <span><i class="bi bi-check-circle-fill" style="color: #16a34a;"></i> Verified</span>
                    </div>

                    <a href="result.html?resultId=${resultId}" class="btn btn-primary" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <i class="bi bi-file-earmark-text"></i> View Full Report
                    </a>
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
