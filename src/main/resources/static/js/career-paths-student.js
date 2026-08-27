document.addEventListener("DOMContentLoaded", function () {

    const sidebar = document.getElementById("studentSidebar");
    const menuBtn = document.getElementById("studentMenuBtn");
    const logoutBtn = document.getElementById("studentLogout");
    const container = document.getElementById("careersContainer");
    const emptyState = document.getElementById("emptyCareersState");
    const searchInput = document.getElementById("searchCareerInput");
    const categoryFilter = document.getElementById("careerCategoryFilter");
    const refreshBtn = document.getElementById("refreshCareersBtn");
    const totalCountEl = document.getElementById("totalCareersCount");

    let allCareers = [];

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

    loadStudentHeader();
    loadCareers();

    searchInput?.addEventListener("input", filterAndRender);
    categoryFilter?.addEventListener("change", filterAndRender);
    refreshBtn?.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";
        if (categoryFilter) categoryFilter.value = "ALL";
        loadCareers(true);
    });

    function loadStudentHeader() {
        const name = localStorage.getItem("studentName") || localStorage.getItem("name") || "Student";
        const email = localStorage.getItem("studentEmail") || localStorage.getItem("email") || "";
        const nameEl = document.getElementById("studentName");
        const emailEl = document.getElementById("studentEmail");
        if (nameEl) nameEl.textContent = name;
        if (emailEl) emailEl.textContent = email;
    }

    async function loadCareers(isManual = false) {
        const icon = refreshBtn?.querySelector("i");
        if (refreshBtn) refreshBtn.disabled = true;
        if (icon) icon.classList.add("spin");

        const token = localStorage.getItem("studentToken") || localStorage.getItem("token") || localStorage.getItem("adminToken");

        try {
            const response = await fetch("/api/student/career-paths", {
                headers: {
                    "Accept": "application/json",
                    ...(token ? { "Authorization": "Bearer " + token } : {})
                }
            });

            if (!response.ok) throw new Error("Failed to load career paths");

            const data = await response.json();
            allCareers = Array.isArray(data) ? data : (data.content || []);

            populateCategories();
            if (totalCountEl) totalCountEl.textContent = allCareers.length;
            filterAndRender();

            if (isManual && window.AppToast) {
                window.AppToast.success("Career pathways refreshed successfully!");
            }
        } catch (error) {
            console.error("Load careers error:", error);
            if (container) {
                container.innerHTML = `
                    <div class="empty-state" style="grid-column: 1 / -1;">
                        <i class="bi bi-exclamation-triangle"></i>
                        <h3>Unable to load career pathways</h3>
                        <p>${escapeHtml(error.message)}</p>
                    </div>
                `;
            }
        } finally {
            if (refreshBtn) refreshBtn.disabled = false;
            if (icon) icon.classList.remove("spin");
        }
    }

    function populateCategories() {
        if (!categoryFilter) return;

        const currentVal = categoryFilter.value || "ALL";
        const categories = Array.from(new Set(allCareers.map(c => c.category).filter(Boolean))).sort();

        categoryFilter.innerHTML = `<option value="ALL">All Categories (${allCareers.length})</option>`;
        categories.forEach(cat => {
            const opt = document.createElement("option");
            opt.value = cat;
            opt.textContent = formatCategory(cat);
            if (cat === currentVal) opt.selected = true;
            categoryFilter.appendChild(opt);
        });
    }

    function filterAndRender() {
        if (!container) return;

        const query = (searchInput?.value || "").trim().toLowerCase();
        const selectedCat = categoryFilter?.value || "ALL";

        const filtered = allCareers.filter(c => {
            const name = (c.careerName || "").toLowerCase();
            const desc = (c.description || "").toLowerCase();
            const skills = (c.skills || "").toLowerCase();
            const edu = (c.education || "").toLowerCase();
            const cat = c.category || "";

            const matchesQuery = !query || name.includes(query) || desc.includes(query) || skills.includes(query) || edu.includes(query);
            const matchesCat = selectedCat === "ALL" || cat === selectedCat;

            return matchesQuery && matchesCat;
        });

        if (totalCountEl) totalCountEl.textContent = filtered.length;
        container.innerHTML = "";

        if (filtered.length === 0) {
            if (emptyState) emptyState.hidden = false;
            return;
        }

        if (emptyState) emptyState.hidden = true;

        filtered.forEach(cp => {
            const card = document.createElement("div");
            card.className = "student-card";
            card.innerHTML = `
                <div>
                    <div class="student-card-header">
                        <div class="student-card-icon" style="background: #fef3c7; color: #d97706;">
                            <i class="bi bi-signpost-split"></i>
                        </div>
                        <span class="badge badge-info">${escapeHtml(formatCategory(cp.category))}</span>
                    </div>

                    <h3 class="student-card-title">${escapeHtml(cp.careerName || "Career Path")}</h3>
                    <p class="student-card-desc">${escapeHtml(cp.description || "Exciting career opportunity in high-demand industry.")}</p>

                    ${cp.skills ? `
                        <div style="margin-bottom: 14px;">
                            <strong style="display: block; font-size: 11.5px; text-transform: uppercase; color: var(--student-text-muted); margin-bottom: 6px;">Key Skills & Tools</strong>
                            <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                                ${cp.skills.split(',').map(s => `<span style="font-size: 11px; background: #f1f5f9; color: #334155; padding: 2px 8px; border-radius: 4px;">${escapeHtml(s.trim())}</span>`).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>

                <div>
                    <div class="student-card-meta" style="flex-direction: column; align-items: flex-start; gap: 6px;">
                        ${cp.education ? `<span><i class="bi bi-mortarboard"></i> ${escapeHtml(cp.education)}</span>` : ''}
                        ${cp.salaryRange ? `<span><i class="bi bi-cash-stack"></i> <strong>${escapeHtml(cp.salaryRange)}</strong></span>` : ''}
                    </div>

                    <a href="available-tests.html" class="btn btn-primary" style="width: 100%;">
                        <i class="bi bi-play-circle"></i> Test For This Career
                    </a>
                </div>
            `;

            container.appendChild(card);
        });
    }

    function formatCategory(cat) {
        if (!cat) return "";
        return cat.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    }

    function escapeHtml(str) {
        const div = document.createElement("div");
        div.textContent = str ?? "";
        return div.innerHTML;
    }
});
