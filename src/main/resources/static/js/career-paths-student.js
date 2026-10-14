document.addEventListener("DOMContentLoaded", function () {

    const sidebar = document.getElementById("studentSidebar");
    const menuBtn = document.getElementById("studentMenuBtn");
    const logoutBtn = document.getElementById("studentLogout");
    const container = document.getElementById("careersContainer");
    const emptyState = document.getElementById("emptyCareersState");
    const searchInput = document.getElementById("searchCareerInput");
    const categoryFilter = document.getElementById("careerCategoryFilter");
    const totalCountEl = document.getElementById("totalCareersCount");

    let allCareers = [];

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

    loadStudentHeader();
    loadCareers();

    searchInput?.addEventListener("input", filterAndRender);
    categoryFilter?.addEventListener("change", filterAndRender);

    function loadStudentHeader() {
        const name = localStorage.getItem("studentName") || localStorage.getItem("name") || "Student";
        const email = localStorage.getItem("studentEmail") || localStorage.getItem("email") || "";
        const nameEl = document.getElementById("studentName");
        const emailEl = document.getElementById("studentEmail");
        if (nameEl) nameEl.textContent = name;
        if (emailEl) emailEl.textContent = email;
    }

    async function loadCareers() {
        const token = localStorage.getItem("studentToken") || localStorage.getItem("token") || localStorage.getItem("adminToken");

        try {
            const response = await fetch("/api/student/career-paths", {
                headers: {
                    "Accept": "application/json",
                    ...(token ? { "Authorization": "Bearer " + token } : {})
                }
            });

            if (!response.ok) throw new Error("Failed to load career pathways");

            const data = await response.json();
            allCareers = Array.isArray(data) ? data : (data.content || []);

            populateCategories();
            if (totalCountEl) totalCountEl.textContent = allCareers.length;
            filterAndRender();
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
            card.style.display = "flex";
            card.style.flexDirection = "column";
            card.style.justifyContent = "space-between";
            card.innerHTML = `
                <div>
                    <div class="student-card-header">
                        <div class="student-card-icon" style="background: #eff6ff; color: #2563eb;">
                            <i class="bi bi-briefcase"></i>
                        </div>
                        <span class="badge badge-info" style="font-weight: 600;">${escapeHtml(formatCategory(cp.category))}</span>
                    </div>

                    <h3 class="student-card-title" style="margin-bottom: 8px;">${escapeHtml(cp.careerName || "Career Path")}</h3>
                    <p class="student-card-desc" style="margin-bottom: 16px;">${escapeHtml(cp.description || "Exciting career opportunity in high-demand industry.")}</p>

                    ${cp.skills ? `
                        <div style="margin-bottom: 16px;">
                            <strong style="display: block; font-size: 11px; text-transform: uppercase; color: var(--student-text-muted); letter-spacing: 0.5px; margin-bottom: 6px; font-weight: 700;">Key Skills & Tools</strong>
                            <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                                ${cp.skills.split(',').map(s => `<span style="font-size: 11.5px; font-weight: 500; background: #f1f5f9; color: #334155; padding: 3px 9px; border-radius: 6px; border: 1px solid #e2e8f0;">${escapeHtml(s.trim())}</span>`).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>

                <div style="margin-top: auto; padding-top: 14px; border-top: 1px solid var(--student-border-subtle); display: flex; flex-direction: column; gap: 8px;">
                    ${cp.education ? `
                        <div style="display: flex; align-items: flex-start; gap: 8px; font-size: 12.5px; color: var(--student-text-muted); line-height: 1.4;">
                            <i class="bi bi-mortarboard-fill" style="color: #6366f1; font-size: 15px; flex-shrink: 0; margin-top: 1px;"></i>
                            <span><strong style="color: var(--student-text-main);">Education:</strong> ${escapeHtml(cp.education)}</span>
                        </div>
                    ` : ''}
                    ${cp.salaryRange ? `
                        <div style="display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: #047857; background: #ecfdf5; padding: 8px 12px; border-radius: 8px; border: 1px solid #a7f3d0; margin-top: 2px;">
                            <i class="bi bi-cash-stack" style="font-size: 16px; flex-shrink: 0;"></i>
                            <span><strong style="color: #065f46;">Avg Compensation:</strong> ${escapeHtml(formatCompensation(cp.salaryRange))}</span>
                        </div>
                    ` : ''}
                </div>
            `;

            container.appendChild(card);
        });
    }

    function formatCategory(cat) {
        if (!cat) return "";
        return cat.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    }

    function formatCompensation(salary) {
        if (!salary || typeof salary !== "string") return "₹6,00,000 - ₹25,00,000 / annum";
        let cleaned = salary
            .replace(/[\uFFFD\u0080-\u009F]/g, "")
            .replace(/\?{2,}/g, "₹")
            .replace(/\?(\s*\d)/g, "₹$1")
            .replace(/(\bLPA\b|\bannum\b|\byr\b)\s*\?/gi, "$1")
            .replace(/\?+/g, "₹")
            .trim();
        return cleaned || "₹6,00,000 - ₹25,00,000 / annum";
    }

    function escapeHtml(str) {
        const div = document.createElement("div");
        div.textContent = str ?? "";
        return div.innerHTML;
    }
});
