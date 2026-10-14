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
    const paginationRow = document.getElementById("careerPaginationRow");
    const paginationInfo = document.getElementById("careerPaginationInfo");
    const paginationControls = document.getElementById("careerPaginationControls");
    const careerCountBadge = document.getElementById("careerCountBadge");

    let careers = [];
    let currentPage = 0;
    const pageSize = 6;
    let currentEditingCareer = null;

    loadCareers();

    addCareerBtn?.addEventListener("click", openAddModal);
    closeCareerModal?.addEventListener("click", closeModal);
    cancelCareerBtn?.addEventListener("click", closeModal);
    form?.addEventListener("submit", saveCareer);

    searchInput?.addEventListener("input", () => {
        currentPage = 0;
        renderCareers();
    });

    categoryFilter?.addEventListener("change", () => {
        currentPage = 0;
        renderCareers();
    });

    // Close modal on backdrop click
    modal?.addEventListener("click", (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Close modal on Escape key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal && !modal.hidden) {
            closeModal();
        }
    });

    function getAuthHeaders() {
        const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
        return {
            "Accept": "application/json",
            "Content-Type": "application/json",
            ...(token ? { "Authorization": "Bearer " + token } : {})
        };
    }

    async function loadCareers() {
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
        }
    }

    function populateCategoriesFilter() {
        if (!categoryFilter) return;

        const categories = [...new Set(careers.map(c => c.category).filter(Boolean))].sort();
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
        const uniqueCategories = new Set(careers.map(c => c.category).filter(Boolean));
        setText("totalCategories", uniqueCategories.size);
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
        const terms = search.split(/\s+/).filter(Boolean);

        const filtered = careers.filter(career => {
            const combined = [
                career.careerName,
                career.category,
                career.skills,
                career.education,
                career.salaryRange
            ].map(val => String(val || "").toLowerCase()).join(" ");

            const matchesSearch = terms.length === 0 || terms.every(term => combined.includes(term));
            const matchesCategory = !selectedCat || (career.category === selectedCat);

            return matchesSearch && matchesCategory;
        });

        if (careerCountBadge) {
            careerCountBadge.textContent = `${filtered.length} Career${filtered.length === 1 ? '' : 's'}`;
        }

        container.innerHTML = "";

        if (filtered.length === 0) {
            if (emptyState) emptyState.hidden = false;
            if (paginationRow) paginationRow.style.display = "none";
            return;
        }

        if (emptyState) emptyState.hidden = true;

        const totalPages = Math.ceil(filtered.length / pageSize);
        if (currentPage >= totalPages) {
            currentPage = Math.max(0, totalPages - 1);
        }

        const start = currentPage * pageSize;
        const end = Math.min(start + pageSize, filtered.length);
        const pagedCareers = filtered.slice(start, end);

        pagedCareers.forEach(career => {
            const card = document.createElement("div");
            card.className = "career-card";

            // Parse skills into badges
            const rawSkills = (career.skills || "").split(/[,;]+/).map(s => s.trim()).filter(Boolean);
            const skillsHtml = rawSkills.length > 0
                ? rawSkills.slice(0, 4).map(s => `<span class="skill-tag">${escapeHtml(s)}</span>`).join("") +
                  (rawSkills.length > 4 ? `<span class="skill-tag" style="background:#e2e8f0; color:#475569; font-weight:600;">+${rawSkills.length - 4} more</span>` : "")
                : `<span style="font-size: 12px; color: #94a3b8;">Not specified</span>`;

            card.innerHTML = `
                <div class="career-card-top">
                    <div class="career-card-brand">
                        <div class="career-card-icon">
                            <i class="bi bi-briefcase-fill"></i>
                        </div>
                        <div class="career-card-heading">
                            <h3 class="career-card-title">${escapeHtml(career.careerName || "")}</h3>
                            <span class="badge-pill stage-beginner">${escapeHtml(career.category || "GENERAL")}</span>
                        </div>
                    </div>
                    <div class="career-card-actions">
                        <button type="button" class="icon-btn edit" data-id="${career.id}" title="Edit Career Path" aria-label="Edit Career">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button type="button" class="icon-btn delete" data-id="${career.id}" title="Delete Career Path" aria-label="Delete Career">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>

                <div class="career-meta-grid">
                    <div class="career-meta-block">
                        <span class="career-meta-label">
                            <i class="bi bi-tools"></i> Required Skills
                        </span>
                        <div class="career-skills-wrapper">
                            ${skillsHtml}
                        </div>
                    </div>

                    <div class="career-meta-row">
                        <div class="career-meta-col">
                            <span class="career-meta-label">
                                <i class="bi bi-mortarboard"></i> Education
                            </span>
                            <span class="career-meta-val">${escapeHtml(career.education || "-")}</span>
                        </div>
                        <div class="career-meta-col">
                            <span class="career-meta-label">
                                <i class="bi bi-cash-stack"></i> Salary Range
                            </span>
                            <span class="career-meta-val salary-highlight">${escapeHtml(formatCompensation(career.salaryRange || "-"))}</span>
                        </div>
                    </div>
                </div>
            `;

            card.querySelector(".edit")?.addEventListener("click", () => openEdit(career));
            card.querySelector(".delete")?.addEventListener("click", () => deleteCareer(career.id, career.careerName));

            container.appendChild(card);
        });

        renderPagination(currentPage, totalPages, filtered.length, start, end);
    }

    function renderPagination(page, totalPages, totalItems, start, end) {
        if (!paginationRow) return;

        if (totalItems === 0) {
            paginationRow.style.display = "none";
            return;
        }

        paginationRow.style.display = "flex";

        if (paginationInfo) {
            paginationInfo.textContent = `Showing ${start + 1} to ${end} of ${totalItems} career paths`;
        }

        if (!paginationControls) return;
        paginationControls.innerHTML = "";

        if (totalPages <= 1) {
            return;
        }

        // Previous button
        const prevBtn = document.createElement("button");
        prevBtn.type = "button";
        prevBtn.className = "pagination-btn";
        prevBtn.innerHTML = '<i class="bi bi-chevron-left"></i>';
        prevBtn.disabled = page === 0;
        prevBtn.title = "Previous Page";
        prevBtn.addEventListener("click", () => {
            if (currentPage > 0) {
                currentPage--;
                renderCareers();
                container?.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        });
        paginationControls.appendChild(prevBtn);

        // Page number buttons
        for (let i = 0; i < totalPages; i++) {
            if (i === 0 || i === totalPages - 1 || (i >= page - 1 && i <= page + 1)) {
                const pageBtn = document.createElement("button");
                pageBtn.type = "button";
                pageBtn.className = `pagination-btn ${i === page ? "active" : ""}`;
                pageBtn.textContent = i + 1;
                pageBtn.addEventListener("click", () => {
                    currentPage = i;
                    renderCareers();
                    container?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                });
                paginationControls.appendChild(pageBtn);
            } else if (i === page - 2 || i === page + 2) {
                const dots = document.createElement("span");
                dots.style.cssText = "padding: 0 4px; color: #94a3b8;";
                dots.textContent = "...";
                paginationControls.appendChild(dots);
            }
        }

        // Next button
        const nextBtn = document.createElement("button");
        nextBtn.type = "button";
        nextBtn.className = "pagination-btn";
        nextBtn.innerHTML = '<i class="bi bi-chevron-right"></i>';
        nextBtn.disabled = page >= totalPages - 1;
        nextBtn.title = "Next Page";
        nextBtn.addEventListener("click", () => {
            if (currentPage < totalPages - 1) {
                currentPage++;
                renderCareers();
                container?.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        });
        paginationControls.appendChild(nextBtn);
    }

    function openAddModal() {
        currentEditingCareer = null;
        form?.reset();
        setValue("careerId", "");
        if (modalTitle) modalTitle.textContent = "Add Career Path";
        clearMessage();
        openModal();
    }

    function openEdit(career) {
        currentEditingCareer = career;
        form?.reset();
        setValue("careerId", career.id);
        setValue("careerName", career.careerName);
        setValue("category", career.category);
        setValue("skills", career.skills);
        setValue("education", career.education);
        setValue("salaryRange", career.salaryRange);
        if (modalTitle) modalTitle.textContent = "Edit Career Path";
        clearMessage();
        openModal();
    }

    async function saveCareer(event) {
        event.preventDefault();

        const id = document.getElementById("careerId")?.value;
        const payload = {
            careerName: getValue("careerName"),
            category: getValue("category"),
            description: (currentEditingCareer ? currentEditingCareer.description : "") || "",
            skills: getValue("skills"),
            education: getValue("education"),
            salaryRange: getValue("salaryRange")
        };

        const saveBtn = document.getElementById("saveCareerBtn");
        const originalText = saveBtn ? saveBtn.innerHTML : "";
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Saving...';
        }

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
                let errorMsg = "Unable to save career path.";
                try {
                    const errData = await response.json();
                    errorMsg = errData.message || errData.error || errorMsg;
                } catch (_) {
                    const text = await response.text();
                    if (text) errorMsg = text;
                }
                throw new Error(errorMsg);
            }

            closeModal();
            if (window.AppToast) {
                window.AppToast.success(`Career Path "${payload.careerName}" saved successfully!`);
            }
            await loadCareers();

        } catch (error) {
            console.error("Save career path error:", error);
            showMessage(error.message, "error");
            if (window.AppToast) {
                window.AppToast.error(error.message);
            }
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = originalText;
            }
        }
    }

    async function deleteCareer(id, name) {
        let confirmed = false;
        if (window.AppModal && typeof window.AppModal.confirm === "function") {
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
                let errorMsg = "Unable to delete career path.";
                try {
                    const errData = await response.json();
                    errorMsg = errData.message || errData.error || errorMsg;
                } catch (_) {
                    const text = await response.text();
                    if (text) errorMsg = text;
                }
                throw new Error(errorMsg);
            }

            careers = careers.filter(c => Number(c.id) !== Number(id));
            updateStatistics();
            renderCareers();

            if (window.AppToast) {
                window.AppToast.success("Career path deleted successfully.");
            }

        } catch (error) {
            console.error("Delete career path error:", error);
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
                <span>Loading career paths...</span>
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
        currentEditingCareer = null;
        clearMessage();
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

    function showMessage(msg, type = "error") {
        const messageBox = document.getElementById("careerMessage");
        if (messageBox) {
            messageBox.textContent = msg;
            messageBox.className = `form-message ${type}`;
            messageBox.style.display = "block";
        }
    }

    function clearMessage() {
        const messageBox = document.getElementById("careerMessage");
        if (messageBox) {
            messageBox.textContent = "";
            messageBox.className = "form-message";
            messageBox.style.display = "none";
        }
    }

    function formatCompensation(salary) {
        if (!salary || salary === "-") return "-";
        let cleaned = String(salary)
            .replace(/[\uFFFD\u0080-\u009F]/g, "")
            .replace(/\?{2,}/g, "₹")
            .replace(/\?(\s*\d)/g, "₹$1")
            .replace(/(\bLPA\b|\bannum\b|\byr\b)\s*\?/gi, "$1")
            .replace(/\?+/g, "₹")
            .trim();
        return cleaned || "-";
    }

    function escapeHtml(value) {
        const div = document.createElement("div");
        div.textContent = value ?? "";
        return div.innerHTML;
    }
});