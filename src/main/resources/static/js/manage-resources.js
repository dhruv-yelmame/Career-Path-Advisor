/**
 * Career Path Adviser - Manage Learning Resources Script
 * Handles stats loading, CRUD operations, filtering, pagination, and modals.
 */

document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    let allResources = [];
    let currentPage = 0;
    const pageSize = 10;
    let currentDeleteId = null;
    let currentEditingResource = null;

    const searchInput = document.getElementById("searchInput");

    // ==========================================
    // INITIAL LOAD
    // ==========================================
    loadAdminProfile();
    loadResourceStats();
    loadResources();

    // ==========================================
    // EVENT LISTENERS (Instant Client-Side Search)
    // ==========================================
    searchInput?.addEventListener("input", function () {
        applyFiltersAndRender(true);
    });

    searchInput?.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
            if (searchInput.value) {
                e.stopPropagation();
                searchInput.value = "";
                applyFiltersAndRender(true);
            }
        }
    });

    // Close modals on backdrop click
    document.querySelectorAll(".modal-backdrop").forEach(backdrop => {
        backdrop.addEventListener("click", function (e) {
            if (e.target === backdrop) {
                backdrop.classList.remove("active");
                document.body.style.overflow = "";
            }
        });
    });

    // Close modals on ESC key
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
            closeResourceModal();
            closeDeleteModal();
        }
    });

    document.getElementById("confirmDeleteBtn")?.addEventListener("click", executeDelete);
    document.getElementById("resourceForm")?.addEventListener("submit", handleResourceSubmit);

    // ==========================================
    // ADMIN PROFILE HELPER
    // ==========================================
    function loadAdminProfile() {
        let user = null;
        const adminUser = localStorage.getItem("adminUser") || localStorage.getItem("user");
        if (adminUser) {
            try {
                user = JSON.parse(adminUser);
            } catch (e) {
                console.error(e);
            }
        }

        const name = localStorage.getItem("adminName") || user?.name || "Career Admin";
        const email = user?.email || localStorage.getItem("adminEmail") || "admin@careerpathadviser.com";

        const adminNameEl = document.getElementById("adminName");
        if (adminNameEl) adminNameEl.textContent = name;

        const topbarAdminNameEl = document.getElementById("topbarAdminName");
        if (topbarAdminNameEl) topbarAdminNameEl.textContent = name;

        const adminEmailEl = document.getElementById("adminEmail");
        if (adminEmailEl) adminEmailEl.textContent = email;

        const avatarEl = document.getElementById("sidebarAvatar");
        if (avatarEl && name) avatarEl.textContent = name.substring(0, 2).toUpperCase();
    }

    // ==========================================
    // LOAD STATS (SCREENSHOT 9)
    // ==========================================
    async function loadResourceStats() {
        try {
            const headers = getAuthHeaders();
            const res = await fetch("/api/admin/resources/stats", {
                method: "GET",
                headers: headers
            });

            if (res.ok) {
                const stats = await res.json();
                setText("statTotalResources", stats.totalResources ?? allResources.length);
                setText("statCategories", stats.totalCategories ?? stats.categories ?? 8);
                setText("statActiveTracks", stats.totalTracks ?? stats.activeTracks ?? stats.careersCovered ?? 7);
                setText("statLearningPaths", stats.totalPaths ?? stats.learningPaths ?? 5);
            } else {
                applyCalculatedOrDefaultStats();
            }
        } catch (err) {
            console.warn("Could not fetch resource stats:", err);
            applyCalculatedOrDefaultStats();
        }
    }

    function applyCalculatedOrDefaultStats() {
        if (allResources && allResources.length > 0) {
            const distinctTracks = new Set(allResources.map(r => r.courseTrack).filter(Boolean)).size;
            const distinctCats = new Set(allResources.map(r => r.category).filter(Boolean)).size;
            const distinctStages = new Set(allResources.map(r => r.stage).filter(Boolean)).size;

            setText("statTotalResources", allResources.length);
            setText("statCategories", distinctCats || 8);
            setText("statActiveTracks", distinctTracks || 7);
            setText("statLearningPaths", distinctStages || 5);
        } else {
            setText("statTotalResources", 42);
            setText("statCategories", 8);
            setText("statActiveTracks", 7);
            setText("statLearningPaths", 5);
        }
    }

    // ==========================================
    // LOAD RESOURCES DATA (ALL ITEMS IN-MEMORY)
    // ==========================================
    async function loadResources() {
        const tbody = document.getElementById("resourcesTableBody");
        if (!tbody) return;

        if (allResources.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="loading">
                        <i class="bi bi-arrow-repeat spin"></i> Loading learning resources...
                    </td>
                </tr>
            `;
        }

        try {
            const headers = getAuthHeaders();
            let res = await fetch("/api/admin/resources?page=0&size=1000", {
                method: "GET",
                headers: headers
            });

            if (!res.ok) {
                res = await fetch("/api/student/resources", {
                    method: "GET",
                    headers: headers
                });
            }

            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    allResources = data;
                } else if (data && Array.isArray(data.content)) {
                    allResources = data.content;
                } else {
                    allResources = [];
                }
                applyFiltersAndRender(false);
            } else {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="empty-state">
                            <i class="bi bi-exclamation-circle" style="color: #ef4444;"></i>
                            <h3>Failed to load resources</h3>
                            <p>Please check your network connection or verify authorization.</p>
                        </td>
                    </tr>
                `;
            }
        } catch (err) {
            console.error("Error loading resources:", err);
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <i class="bi bi-exclamation-triangle" style="color: #f59e0b;"></i>
                        <h3>Error Connecting to Server</h3>
                        <p>${escapeHtml(err.message)}</p>
                    </td>
                </tr>
            `;
        }
    }

    // ==========================================
    // INSTANT CLIENT-SIDE SEARCH & PAGINATION
    // ==========================================
    function applyFiltersAndRender(resetPage = true) {
        if (resetPage) currentPage = 0;

        const search = (searchInput?.value || "").toLowerCase().trim();
        const terms = search.split(/\s+/).filter(Boolean);

        const filtered = allResources.filter(res => {
            if (terms.length === 0) return true;

            // Search query matches across all resource attributes
            const combined = [
                res.title,
                res.description,
                res.category,
                res.courseTrack,
                res.resourceType,
                res.resourceUrl
            ].map(v => String(v || "").toLowerCase()).join(" ");

            return terms.every(term => combined.includes(term));
        });

        const totalElements = filtered.length;
        const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));
        if (currentPage >= totalPages) currentPage = totalPages - 1;
        if (currentPage < 0) currentPage = 0;

        const start = currentPage * pageSize;
        const pageItems = filtered.slice(start, start + pageSize);

        renderTable(pageItems, currentPage, totalElements, search);
        renderPagination(currentPage, totalPages, totalElements);
    }

    window.clearSearchAndReset = function () {
        if (searchInput) {
            searchInput.value = "";
            searchInput.focus();
        }
        applyFiltersAndRender(true);
    };

    function renderTable(resources, page, totalElements, search = "") {
        const tbody = document.getElementById("resourcesTableBody");
        if (!tbody) return;

        if (resources.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <i class="bi bi-journal-x"></i>
                        <h3>No resources found</h3>
                        <p>${search ? `No learning resources matched "<strong>${escapeHtml(search)}</strong>".` : 'Try adjusting your search keywords or filter criteria.'}</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = resources.map((res, idx) => {
            const rowNumber = (page * pageSize) + idx + 1;

            // Resource link
            const url = res.resourceUrl || "#";
            const linkDisplay = `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="resource-url-link">
                <i class="bi bi-box-arrow-up-right"></i> Open Link
            </a>`;

            return `
                <tr>
                    <td style="font-weight: 600; color: #64748b;">${rowNumber}</td>
                    <td>
                        <div class="resource-title-cell">
                            <strong>${escapeHtml(res.title || "Untitled")}</strong>
                            <span>${escapeHtml(res.courseTrack || "")}${res.description ? " • " + escapeHtml(res.description) : ""}</span>
                        </div>
                    </td>
                    <td><span class="skill-tag" style="font-size: 12px;">${escapeHtml(res.category || "General")}</span></td>
                    <td>${linkDisplay}</td>
                    <td><span class="badge-pill pending" style="font-weight: 500;">${escapeHtml(res.resourceType || "Course")}</span></td>
                    <td style="text-align: right;">
                        <div style="display: inline-flex; gap: 6px;">
                            <button type="button" class="icon-btn edit" onclick="window.editResource(${res.id})" title="Edit Resource">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button type="button" class="icon-btn delete" onclick="window.confirmDeleteResource(${res.id})" title="Delete Resource">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");
    }

    function renderPagination(page, totalPages, totalElements) {
        const infoEl = document.getElementById("paginationInfo");
        const controlsEl = document.getElementById("paginationControls");
        if (!infoEl || !controlsEl) return;

        const start = totalElements === 0 ? 0 : page * pageSize + 1;
        const end = Math.min((page + 1) * pageSize, totalElements);
        infoEl.textContent = `Showing ${start} to ${end} of ${totalElements} entries`;

        if (totalPages <= 1) {
            controlsEl.innerHTML = "";
            return;
        }

        let html = `
            <button type="button" class="pagination-btn" ${page === 0 ? "disabled" : ""} onclick="window.loadResourcesPage(${page - 1})">
                <i class="bi bi-chevron-left"></i>
            </button>
        `;

        for (let i = 0; i < totalPages; i++) {
            if (i === 0 || i === totalPages - 1 || (i >= page - 1 && i <= page + 1)) {
                html += `
                    <button type="button" class="pagination-btn ${i === page ? "active" : ""}" onclick="window.loadResourcesPage(${i})">
                        ${i + 1}
                    </button>
                `;
            } else if (i === page - 2 || i === page + 2) {
                html += `<span style="padding: 0 4px; color: #94a3b8;">...</span>`;
            }
        }

        html += `
            <button type="button" class="pagination-btn" ${page >= totalPages - 1 ? "disabled" : ""} onclick="window.loadResourcesPage(${page + 1})">
                <i class="bi bi-chevron-right"></i>
            </button>
        `;

        controlsEl.innerHTML = html;
    }

    window.loadResourcesPage = function (page) {
        currentPage = page;
        applyFiltersAndRender(false);
        const container = document.querySelector(".data-table-container");
        container?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    // ==========================================
    // ADD & EDIT MODALS
    // ==========================================
    function openAddResourceModal() {
        document.getElementById("resourceForm")?.reset();
        document.getElementById("resourceId").value = "";
        currentEditingResource = null;
        setText("modalTitle", "Add New Learning Resource");
        document.getElementById("resUrl").value = "https://";

        const modal = document.getElementById("resourceModal");
        if (modal) {
            modal.classList.add("active");
            document.body.style.overflow = "hidden";
        }
    }
    window.openAddResourceModal = openAddResourceModal;

    function setSelectValue(selectId, value) {
        const sel = document.getElementById(selectId);
        if (!sel) return;
        if (!value) {
            sel.selectedIndex = 0;
            return;
        }
        const valLower = String(value).trim().toLowerCase();
        // 1. Exact value match
        for (let i = 0; i < sel.options.length; i++) {
            if (sel.options[i].value.toLowerCase() === valLower) {
                sel.selectedIndex = i;
                return;
            }
        }
        // 2. Exact text match
        for (let i = 0; i < sel.options.length; i++) {
            if (sel.options[i].textContent.trim().toLowerCase() === valLower) {
                sel.selectedIndex = i;
                return;
            }
        }
        // 3. Partial containment match
        for (let i = 0; i < sel.options.length; i++) {
            const optVal = sel.options[i].value.toLowerCase();
            const optTxt = sel.options[i].textContent.trim().toLowerCase();
            if ((optVal && (optVal.includes(valLower) || valLower.includes(optVal))) ||
                (optTxt && (optTxt.includes(valLower) || valLower.includes(optTxt)))) {
                sel.selectedIndex = i;
                return;
            }
        }
        // 4. Fallback: dynamically add option and select it
        const opt = document.createElement("option");
        opt.value = value;
        opt.textContent = value;
        sel.appendChild(opt);
        sel.value = value;
    }

    function populateResourceModal(resource) {
        if (!resource) return;
        currentEditingResource = resource;
        document.getElementById("resourceId").value = resource.id || "";
        document.getElementById("resTitle").value = resource.title || "";
        setSelectValue("resTrack", resource.courseTrack);
        setSelectValue("resCategory", resource.category);
        setSelectValue("resType", resource.resourceType);
        document.getElementById("resUrl").value = resource.resourceUrl || "https://";
        document.getElementById("resDescription").value = resource.description || "";

        setText("modalTitle", "Edit Learning Resource");

        const modal = document.getElementById("resourceModal");
        if (modal) {
            modal.classList.add("active");
            document.body.style.overflow = "hidden";
        }
    }

    async function editResource(id) {
        const targetId = Number(id) || id;

        // 1. Instantly check client memory for zero-latency modal opening
        const inMemory = allResources.find(r => Number(r.id) === targetId || r.id == id);
        if (inMemory) {
            populateResourceModal(inMemory);
            return;
        }

        // 2. Fallback network fetch if not found in memory
        try {
            const headers = getAuthHeaders();
            let res = await fetch(`/api/admin/resources/${targetId}`, {
                method: "GET",
                headers: headers
            });

            if (!res.ok) {
                res = await fetch(`/api/student/resources`);
                if (res.ok) {
                    const list = await res.json();
                    const item = Array.isArray(list) ? list.find(r => Number(r.id) === targetId || r.id == id) : null;
                    if (item) {
                        populateResourceModal(item);
                        return;
                    }
                }
            }

            if (res.ok) {
                const resource = await res.json();
                populateResourceModal(resource);
            } else {
                showToast("Failed to fetch resource details", "error");
            }
        } catch (err) {
            console.error("Edit error:", err);
            showToast("Could not load resource details", "error");
        }
    }
    window.editResource = editResource;

    function closeResourceModal() {
        currentEditingResource = null;
        const modal = document.getElementById("resourceModal");
        if (modal) {
            modal.classList.remove("active");
            document.body.style.overflow = "";
        }
    }
    window.closeResourceModal = closeResourceModal;

    let isSavingResource = false;
    async function handleResourceSubmit(e) {
        if (e && typeof e.preventDefault === "function") {
            e.preventDefault();
        }

        if (isSavingResource) return false;

        const id = document.getElementById("resourceId").value;
        const payload = {
            title: document.getElementById("resTitle").value.trim(),
            courseTrack: document.getElementById("resTrack").value.trim(),
            stage: currentEditingResource?.stage || "Beginner",
            category: document.getElementById("resCategory").value.trim(),
            resourceType: document.getElementById("resType").value.trim(),
            resourceUrl: document.getElementById("resUrl").value.trim(),
            status: currentEditingResource?.status || "Active",
            description: document.getElementById("resDescription").value.trim()
        };

        if (!payload.title || !payload.courseTrack || !payload.category || !payload.resourceType || !payload.resourceUrl) {
            showToast("Please fill in all required fields marked with *", "error");
            return false;
        }

        isSavingResource = true;

        const saveBtn = document.getElementById("saveResourceBtn");
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = `<i class="bi bi-arrow-repeat spin"></i> Saving...`;
        }

        try {
            const headers = getAuthHeaders();
            headers["Content-Type"] = "application/json";

            const method = id ? "PUT" : "POST";
            const url = id ? `/api/admin/resources/${id}` : "/api/admin/resources";

            const res = await fetch(url, {
                method: method,
                headers: headers,
                body: JSON.stringify(payload)
            });

            if (res.status === 401 || res.status === 403) {
                showToast("Admin authorization required. Please login again.", "error");
                setTimeout(() => {
                    window.location.href = "/admin-login.html";
                }, 1600);
                return false;
            }

            if (res.ok) {
                const savedData = await res.json().catch(() => null);
                if (savedData && id) {
                    const idx = allResources.findIndex(r => Number(r.id) === Number(id) || r.id == id);
                    if (idx !== -1) allResources[idx] = savedData;
                } else if (id) {
                    const idx = allResources.findIndex(r => Number(r.id) === Number(id) || r.id == id);
                    if (idx !== -1) allResources[idx] = { ...allResources[idx], ...payload, id: Number(id) || id };
                } else if (savedData && !id) {
                    allResources.unshift(savedData);
                }
                showToast(id ? "Learning resource updated successfully!" : "Learning resource created successfully!", "success");
                closeResourceModal();
                applyFiltersAndRender(false);
                loadResourceStats();
            } else {
                const errData = await res.json().catch(() => ({}));
                showToast(errData.message || errData.error || "Failed to save resource. Please check required fields.", "error");
            }
        } catch (err) {
            console.error("Save error:", err);
            showToast("Server connection error while saving resource.", "error");
        } finally {
            isSavingResource = false;
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = `<i class="bi bi-check2"></i> Save Resource`;
            }
        }
        return false;
    }
    window.handleResourceSubmit = handleResourceSubmit;

    // ==========================================
    // DELETE MODAL
    // ==========================================
    function confirmDeleteResource(id) {
        const targetId = Number(id) || id;
        currentDeleteId = targetId;
        const res = allResources.find(r => Number(r.id) === targetId || r.id == id);
        const title = res ? res.title : "this resource";
        setText("deleteResourceTitle", `"${title}"`);

        const modal = document.getElementById("deleteModal");
        if (modal) {
            modal.classList.add("active");
            document.body.style.overflow = "hidden";
        }
    }
    window.confirmDeleteResource = confirmDeleteResource;

    function closeDeleteModal() {
        currentDeleteId = null;
        const modal = document.getElementById("deleteModal");
        if (modal) {
            modal.classList.remove("active");
            document.body.style.overflow = "";
        }
    }
    window.closeDeleteModal = closeDeleteModal;

    async function executeDelete() {
        if (!currentDeleteId) return;

        const deleteBtn = document.getElementById("confirmDeleteBtn");
        if (deleteBtn) {
            deleteBtn.disabled = true;
            deleteBtn.innerHTML = `<i class="bi bi-arrow-repeat spin"></i> Deleting...`;
        }

        try {
            const headers = getAuthHeaders();
            const res = await fetch(`/api/admin/resources/${currentDeleteId}`, {
                method: "DELETE",
                headers: headers
            });

            if (res.ok) {
                showToast("Resource deleted successfully", "success");
                closeDeleteModal();
                loadResources();
                loadResourceStats();
            } else {
                showToast("Failed to delete resource", "error");
            }
        } catch (err) {
            console.error("Delete error:", err);
            showToast("Network error during deletion", "error");
        } finally {
            if (deleteBtn) {
                deleteBtn.disabled = false;
                deleteBtn.innerHTML = `<i class="bi bi-trash"></i> Confirm Delete`;
            }
        }
    }

    // ==========================================
    // HELPERS
    // ==========================================
    function getAuthHeaders() {
        if (typeof window.authHeaders === "function") {
            return window.authHeaders();
        }

        const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
        if (!token) return { "Accept": "application/json" };
        return {
            "Authorization": "Bearer " + token,
            "Accept": "application/json"
        };
    }

    function showToast(msg, type = "info") {
        if (window.AppToast) {
            if (type === "success") window.AppToast.success(msg);
            else if (type === "error") window.AppToast.error(msg);
            else window.AppToast.info(msg);
        } else {
            alert(msg);
        }
    }

    function setText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value ?? "";
    }

    function escapeHtml(str) {
        if (!str) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

});
