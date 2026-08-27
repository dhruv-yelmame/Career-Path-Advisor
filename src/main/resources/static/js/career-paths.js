document.addEventListener("DOMContentLoaded", () => {

    const container = document.getElementById("careerContainer");
    const emptyState = document.getElementById("emptyCareers");
    const form = document.getElementById("careerForm");
    const modal = document.getElementById("careerModal");
    const modalTitle = document.getElementById("careerModalTitle");
    const addCareerBtn = document.getElementById("addCareerBtn");
    const closeCareerModal = document.getElementById("closeCareerModal");
    const cancelCareerBtn = document.getElementById("cancelCareerBtn");
    const searchInput = document.getElementById("careerSearch");
    const categoryFilter = document.getElementById("careerCategoryFilter");
    const refreshBtn = document.getElementById("refreshCareerBtn");

    let careers = [];

    loadCareers();

    addCareerBtn?.addEventListener("click", openAddModal);
    closeCareerModal?.addEventListener("click", closeModal);
    cancelCareerBtn?.addEventListener("click", closeModal);
    form?.addEventListener("submit", saveCareer);
    searchInput?.addEventListener("input", renderCareers);
    categoryFilter?.addEventListener("change", renderCareers);

    refreshBtn?.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";
        if (categoryFilter) categoryFilter.value = "";
        loadCareers(true);
    });

    function getAuthHeaders() {
        const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
        return {
            "Accept": "application/json",
            "Content-Type": "application/json",
            ...(token ? { "Authorization": "Bearer " + token } : {})
        };
    }

    async function loadCareers(isManualRefresh = false) {
        const icon = refreshBtn?.querySelector("i");
        if (refreshBtn) refreshBtn.disabled = true;
        if (icon) icon.classList.add("spin");

        showLoading();

        try {
            const response = await fetch("/api/admin/career-paths", {
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error("Unable to load career paths.");
            }

            const data = await response.json();
            careers = Array.isArray(data) ? data : (data?.content || []);

            populateCategoriesFilter();
            updateStatistics();
            renderCareers();

            if (isManualRefresh && window.AppToast) {
                window.AppToast.success("Career paths refreshed successfully!");
            }

        } catch (error) {
            console.error("Career loading error:", error);
            if (container) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="bi bi-exclamation-triangle"></i>
                        <h3>Unable to load career paths</h3>
                        <p>${escapeHtml(error.message)}</p>
                    </div>
                `;
            }
        } finally {
            if (refreshBtn) refreshBtn.disabled = false;
            if (icon) icon.classList.remove("spin");
        }
    }

    function populateCategoriesFilter() {
        if (!categoryFilter) return;

        const categories = [...new Set(careers.map(c => c.category).filter(Boolean))];
        const currentVal = categoryFilter.value;

        categoryFilter.innerHTML = `<option value="">All Categories</option>`;
        categories.forEach(cat => {
            const opt = document.createElement("option");
            opt.value = cat;
            opt.textContent = cat;
            if (cat === currentVal) opt.selected = true;
            categoryFilter.appendChild(opt);
        });
    }

    function updateStatistics() {
        setText("totalCareers", careers.length);
        fetchMatchedStudents();
    }

    async function fetchMatchedStudents() {
        try {
            const res = await fetch("/api/admin/students/dashboard-stats", {
                headers: getAuthHeaders()
            });
            if (res.ok) {
                const data = await res.json();
                setText("matchedStudents", data.completedAttempts ?? data.totalAttempts ?? 0);
            }
        } catch {
            setText("matchedStudents", 0);
        }
    }

    function renderCareers() {
        if (!container) return;

        const search = searchInput?.value?.toLowerCase()?.trim() || "";
        const selectedCat = categoryFilter?.value?.trim() || "";

        const filtered = careers.filter(career => {
            const name = String(career.careerName || "").toLowerCase();
            const category = String(career.category || "").toLowerCase();
            const description = String(career.description || "").toLowerCase();
            const skills = String(career.skills || "").toLowerCase();
            const education = String(career.education || "").toLowerCase();

            const matchesSearch = !search ||
                name.includes(search) ||
                category.includes(search) ||
                description.includes(search) ||
                skills.includes(search) ||
                education.includes(search);

            const matchesCategory = !selectedCat || (career.category === selectedCat);

            return matchesSearch && matchesCategory;
        });

        container.innerHTML = "";

        if (filtered.length === 0) {
            if (emptyState) emptyState.hidden = false;
            return;
        }

        if (emptyState) emptyState.hidden = true;

        filtered.forEach(career => {
            const card = document.createElement("div");
            card.className = "career-card";

            card.innerHTML = `
                <div class="career-card-header">
                    <div class="career-card-icon">
                        <i class="bi bi-briefcase"></i>
                    </div>
                    <div class="career-card-actions">
                        <button type="button" class="icon-btn edit" data-id="${career.id}" title="Edit Profile" style="background:#f1f5f9; color:#1268f3;">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button type="button" class="icon-btn delete" data-id="${career.id}" title="Delete Profile">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>

                <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 12px;">${escapeHtml(career.careerName || "")}</h3>
                <span class="career-category" style="display: inline-block; margin-top: 4px; color: var(--admin-primary); font-size: 12px; font-weight: 600;">${escapeHtml(career.category || "")}</span>
                <p style="margin-top: 10px; color: var(--admin-text-muted); font-size: 13px; line-height: 1.5;">${escapeHtml(career.description || "")}</p>

                <div class="career-details" style="margin-top: 14px; padding-top: 12px; border-top: 1px solid #f1f5f9;">
                    <div style="margin-bottom: 8px;">
                        <strong style="display: block; font-size: 12px; color: #334155;">Skills</strong>
                        <span style="font-size: 12px; color: var(--admin-text-muted);">${escapeHtml(career.skills || "-")}</span>
                    </div>
                    <div style="margin-bottom: 8px;">
                        <strong style="display: block; font-size: 12px; color: #334155;">Education</strong>
                        <span style="font-size: 12px; color: var(--admin-text-muted);">${escapeHtml(career.education || "-")}</span>
                    </div>
                    <div>
                        <strong style="display: block; font-size: 12px; color: #334155;">Salary Range</strong>
                        <span style="font-size: 12px; color: var(--admin-text-muted);">${escapeHtml(career.salaryRange || "-")}</span>
                    </div>
                </div>
            `;

            card.querySelector(".edit")?.addEventListener("click", () => openEdit(career));
            card.querySelector(".delete")?.addEventListener("click", () => deleteCareer(career.id, career.careerName));

            container.appendChild(card);
        });
    }

    function openAddModal() {
        form?.reset();
        setValue("careerId", "");
        if (modalTitle) modalTitle.textContent = "Add Career Path";
        openModal();
    }

    function openEdit(career) {
        openModal();
        if (modalTitle) modalTitle.textContent = "Edit Career Path";
        setValue("careerId", career.id);
        setValue("careerName", career.careerName);
        setValue("category", career.category);
        setValue("description", career.description);
        setValue("skills", career.skills);
        setValue("education", career.education);
        setValue("salaryRange", career.salaryRange);
    }

    async function saveCareer(event) {
        event.preventDefault();

        const id = document.getElementById("careerId")?.value;
        const payload = {
            careerName: getValue("careerName"),
            category: getValue("category"),
            description: getValue("description"),
            skills: getValue("skills"),
            education: getValue("education"),
            salaryRange: getValue("salaryRange")
        };

        try {
            const response = await fetch(
                id ? `/api/admin/career-paths/${id}` : "/api/admin/career-paths",
                {
                    method: id ? "PUT" : "POST",
                    headers: getAuthHeaders(),
                    body: JSON.stringify(payload)
                }
            );

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || "Unable to save career.");
            }

            closeModal();
            if (window.AppToast) {
                window.AppToast.success(`Career Path "${payload.careerName}" saved successfully!`);
            }
            await loadCareers();

        } catch (error) {
            if (window.AppToast) {
                window.AppToast.error(error.message);
            }
        }
    }

    async function deleteCareer(id, name) {
        let confirmed = false;
        if (window.AppModal) {
            confirmed = await window.AppModal.confirm({
                title: "Delete Career Path",
                message: `Are you sure you want to delete career path <strong>${escapeHtml(name || "this career path")}</strong>?`,
                confirmText: "Delete",
                cancelText: "Cancel",
                type: "danger"
            });
        } else {
            confirmed = confirm(`Delete career path "${name}"?`);
        }

        if (!confirmed) return;

        try {
            const response = await fetch(`/api/admin/career-paths/${id}`, {
                method: "DELETE",
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error("Unable to delete career path.");
            }

            careers = careers.filter(c => Number(c.id) !== Number(id));
            updateStatistics();
            renderCareers();

            if (window.AppToast) {
                window.AppToast.success("Career path deleted successfully.");
            }

        } catch (error) {
            if (window.AppToast) {
                window.AppToast.error(error.message);
            }
        }
    }

    function showLoading() {
        if (!container) return;
        if (emptyState) emptyState.hidden = true;
        container.innerHTML = `
            <div class="loading">
                <i class="bi bi-arrow-repeat"></i>
                Loading career paths...
            </div>
        `;
    }

    function openModal() {
        if (modal) {
            modal.hidden = false;
        }
    }

    function closeModal() {
        if (modal) {
            modal.hidden = true;
        }
        form?.reset();
        setValue("careerId", "");
    }

    function getValue(id) {
        return document.getElementById(id)?.value?.trim() || "";
    }

    function setValue(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.value = value ?? "";
        }
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