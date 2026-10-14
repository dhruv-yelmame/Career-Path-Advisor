document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    const container = document.getElementById("questionsContainer");
    const loading = document.getElementById("loading");
    const empty = document.getElementById("emptyState");
    const searchInput = document.getElementById("searchInput");
    const selectAllCheckbox = document.getElementById("selectAllCheckbox");
    const selectionStatusText = document.getElementById("selectionStatusText");
    const deleteSelectedBtn = document.getElementById("deleteSelectedBtn");
    const selectedCountBadge = document.getElementById("selectedCountBadge");
    const paginationRow = document.getElementById("paginationRow");
    const paginationInfo = document.getElementById("paginationInfo");
    const paginationControls = document.getElementById("paginationControls");

    let questions = [];
    const selectedQuestionIds = new Set();
    let currentPage = 0;
    const pageSize = 10;
    let currentPageQuestions = [];

    loadQuestions();

    searchInput?.addEventListener("input", () => renderQuestions(true));
    selectAllCheckbox?.addEventListener("change", () => toggleSelectAll(selectAllCheckbox.checked));
    deleteSelectedBtn?.addEventListener("click", () => deleteSelectedQuestions());

    function getAuthToken() {
        if (typeof window.authHeaders === "function") {
            const h = window.authHeaders();
            if (h && h["Authorization"]) {
                return h["Authorization"].replace("Bearer ", "");
            }
        }
        return (
            localStorage.getItem("adminToken") ||
            localStorage.getItem("token") ||
            localStorage.getItem("jwtToken") ||
            null
        );
    }

    function getAuthHeaders(hasBody = false) {
        let headers = {};
        if (typeof window.authHeaders === "function") {
            try {
                headers = Object.assign({}, window.authHeaders());
            } catch (e) {
                headers = {};
            }
        }
        const token = getAuthToken();
        if (token && !headers["Authorization"]) {
            headers["Authorization"] = "Bearer " + token;
        }
        headers["Accept"] = "application/json";
        if (hasBody) {
            headers["Content-Type"] = "application/json";
        }
        return headers;
    }

    async function loadQuestions() {
        try {
            showLoading(true);

            const token = getAuthToken();
            if (!token) {
                console.warn("No admin auth token found, redirecting to login...");
                window.location.href = "/admin-login.html";
                return;
            }

            const response = await fetch("/api/admin/questions", {
                method: "GET",
                headers: getAuthHeaders()
            });

            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem("token");
                localStorage.removeItem("adminToken");
                localStorage.removeItem("user");
                localStorage.removeItem("adminUser");
                if (window.AppToast) window.AppToast.error("Session expired. Please login again.");
                setTimeout(() => { window.location.href = "/admin-login.html"; }, 1500);
                return;
            }

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(errText || "Unable to load questions.");
            }

            const data = await response.json();
            questions = Array.isArray(data) ? data : (data?.content || data?.data || []);

            updateTotalQuestions();
            renderQuestions();

        } catch (error) {
            console.error("Load questions error:", error);

            if (container) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="bi bi-exclamation-triangle" style="font-size: 2rem; color: #f59e0b; margin-bottom: 10px;"></i>
                        <h3 style="font-size: 16px; font-weight: 600; color: #1e293b; margin-bottom: 6px;">Unable to load questions</h3>
                        <p style="font-size: 13px; color: #64748b; margin-bottom: 14px;">${escapeHtml(error.message)}</p>
                        <button type="button" class="btn btn-secondary" onclick="window.location.reload()" style="height: 36px; padding: 0 16px; font-size: 13px;">
                            <i class="bi bi-arrow-clockwise"></i> Retry
                        </button>
                    </div>
                `;
            }
        } finally {
            showLoading(false);
        }
    }

    function renderQuestions(resetPage = true) {
        if (!container) return;
        if (resetPage === true || typeof resetPage !== "boolean") {
            currentPage = 0;
        }

        const rawSearch = (searchInput?.value || "").trim().toLowerCase();

        const filtered = questions.filter(function (q) {
            if (!rawSearch) return true;
            const text = (q.questionText || "").toLowerCase();
            return text.includes(rawSearch);
        });

        const totalElements = filtered.length;
        const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));
        if (currentPage >= totalPages) currentPage = totalPages - 1;
        if (currentPage < 0) currentPage = 0;

        container.innerHTML = "";

        if (totalElements === 0) {
            currentPageQuestions = [];
            if (empty) empty.hidden = false;
            if (paginationRow) paginationRow.style.display = "none";
            updateSelectionUI();
            return;
        }

        if (empty) empty.hidden = true;
        if (paginationRow) paginationRow.style.display = "flex";

        const start = currentPage * pageSize;
        const pageItems = filtered.slice(start, start + pageSize);
        currentPageQuestions = pageItems;

        pageItems.forEach(function (question) {
            container.appendChild(createQuestionCard(question));
        });

        renderPagination(currentPage, totalPages, totalElements);
        updateSelectionUI();
    }

    function createQuestionCard(question) {
        const id = Number(question.id);
        const isSelected = selectedQuestionIds.has(id);
        const cat = question.category || question.keyword || "GENERAL";
        const catFormatted = String(cat).replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase());

        const card = document.createElement("div");
        card.className = `question-simple-card ${isSelected ? 'selected' : ''}`;
        card.dataset.id = id;
        card.style.cursor = "pointer";

        card.innerHTML = `
            <div class="question-checkbox-wrap">
                <input type="checkbox" class="question-checkbox" data-id="${id}" ${isSelected ? 'checked' : ''} aria-label="Select question">
            </div>
            <div class="question-text">
                <div style="font-weight: 600; color: #1e293b;">${escapeHtml(question.questionText || "Untitled Question")}</div>
                <div style="margin-top: 5px; display: flex; align-items: center; gap: 8px;">
                    <span class="badge" style="font-size: 11px; background: #e0e7ff; color: #4338ca; border-radius: 4px; padding: 2px 8px; font-weight: 600;">
                        ${escapeHtml(catFormatted)}
                    </span>
                    <span style="font-size: 11.5px; color: #64748b; font-weight: 500;">
                        ${question.marks || 10} pts
                    </span>
                </div>
            </div>
        `;

        const checkbox = card.querySelector(".question-checkbox");
        checkbox?.addEventListener("change", function (e) {
            e.stopPropagation();
            toggleSelectQuestion(id, checkbox.checked, card);
        });

        // Clicking anywhere on the card toggles its selection
        card.addEventListener("click", function (e) {
            if (e.target.closest(".question-checkbox-wrap") || e.target.tagName === "INPUT") return;
            const nextState = !checkbox.checked;
            checkbox.checked = nextState;
            toggleSelectQuestion(id, nextState, card);
        });

        return card;
    }

    function toggleSelectQuestion(id, checked, cardEl = null) {
        if (checked) {
            selectedQuestionIds.add(id);
        } else {
            selectedQuestionIds.delete(id);
        }

        const card = cardEl || container.querySelector(`.question-simple-card[data-id="${id}"]`);
        if (card) {
            if (checked) {
                card.classList.add("selected");
            } else {
                card.classList.remove("selected");
            }
        }

        updateSelectionUI();
    }

    function toggleSelectAll(checked) {
        if (!currentPageQuestions || currentPageQuestions.length === 0) return;

        currentPageQuestions.forEach(q => {
            const id = Number(q.id);
            if (checked) {
                selectedQuestionIds.add(id);
            } else {
                selectedQuestionIds.delete(id);
            }
        });

        container.querySelectorAll(".question-simple-card").forEach(card => {
            const cb = card.querySelector(".question-checkbox");
            if (cb) cb.checked = checked;
            if (checked) {
                card.classList.add("selected");
            } else {
                card.classList.remove("selected");
            }
        });

        updateSelectionUI();
    }

    function updateSelectionUI() {
        const count = selectedQuestionIds.size;

        if (selectionStatusText) {
            selectionStatusText.textContent = `${count} selected`;
        }

        if (deleteSelectedBtn) {
            deleteSelectedBtn.disabled = count === 0;
            if (count > 0) {
                deleteSelectedBtn.style.opacity = "1";
                deleteSelectedBtn.style.cursor = "pointer";
            } else {
                deleteSelectedBtn.style.opacity = "0.55";
                deleteSelectedBtn.style.cursor = "not-allowed";
            }
        }

        if (selectedCountBadge) {
            selectedCountBadge.textContent = count;
            selectedCountBadge.style.display = count > 0 ? "inline-flex" : "none";
        }

        if (selectAllCheckbox && currentPageQuestions.length > 0) {
            const allVisibleSelected = currentPageQuestions.every(q => selectedQuestionIds.has(Number(q.id)));
            const someVisibleSelected = currentPageQuestions.some(q => selectedQuestionIds.has(Number(q.id)));

            selectAllCheckbox.checked = allVisibleSelected;
            selectAllCheckbox.indeterminate = !allVisibleSelected && someVisibleSelected;
        } else if (selectAllCheckbox) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        }
    }

    async function deleteSelectedQuestions() {
        const count = selectedQuestionIds.size;
        if (count === 0) return;

        let confirmed = false;
        const msg = `Are you sure you want to delete ${count} selected question${count === 1 ? '' : 's'}? They will also be removed from any associated tests.`;

        if (window.AppModal && typeof window.AppModal.confirm === "function") {
            confirmed = await window.AppModal.confirm({
                title: "Delete Selected Questions",
                message: msg,
                confirmText: `Delete (${count})`,
                cancelText: "Cancel",
                type: "danger"
            });
        } else {
            confirmed = window.confirm(msg);
        }

        if (!confirmed) return;

        try {
            const token = getAuthToken();
            if (!token) {
                window.location.href = "/admin-login.html";
                return;
            }

            const idsToDelete = Array.from(selectedQuestionIds);

            // Attempt batch delete API
            let success = false;
            try {
                const batchRes = await fetch("/api/admin/questions/batch", {
                    method: "DELETE",
                    headers: getAuthHeaders(true),
                    body: JSON.stringify(idsToDelete)
                });
                if (batchRes.ok) {
                    success = true;
                }
            } catch (err) {
                console.warn("DELETE /batch failed, falling back:", err);
            }

            if (!success) {
                try {
                    const postRes = await fetch("/api/admin/questions/batch-delete", {
                        method: "POST",
                        headers: getAuthHeaders(true),
                        body: JSON.stringify(idsToDelete)
                    });
                    if (postRes.ok) {
                        success = true;
                    }
                } catch (err) {
                    console.warn("POST /batch-delete failed, falling back to individual deletes:", err);
                }
            }

            if (!success) {
                // Fallback to parallel single deletes
                await Promise.all(idsToDelete.map(id => fetch(`/api/admin/questions/${encodeURIComponent(id)}`, {
                    method: "DELETE",
                    headers: getAuthHeaders()
                })));
            }

            const deletedSet = new Set(idsToDelete);
            questions = questions.filter(q => !deletedSet.has(Number(q.id)));
            selectedQuestionIds.clear();

            updateTotalQuestions();
            renderQuestions(false);

            if (window.AppToast) {
                window.AppToast.success(`${count} question${count === 1 ? '' : 's'} deleted successfully.`);
            }

        } catch (error) {
            console.error("Batch delete questions error:", error);
            if (window.AppToast) {
                window.AppToast.error(error.message || "Failed to delete selected questions.");
            }
        }
    }

    function renderPagination(page, totalPages, totalElements) {
        if (!paginationInfo || !paginationControls) return;

        if (totalElements === 0) {
            paginationInfo.textContent = "Showing 0 to 0 of 0 questions";
            paginationControls.innerHTML = "";
            return;
        }

        const start = totalElements === 0 ? 0 : page * pageSize + 1;
        const end = Math.min((page + 1) * pageSize, totalElements);
        paginationInfo.textContent = `Showing ${start} to ${end} of ${totalElements} questions`;

        if (totalPages <= 1) {
            paginationControls.innerHTML = "";
            return;
        }

        let html = `
            <button type="button" class="pagination-btn" ${page === 0 ? "disabled" : ""} onclick="window.goToQuestionsPage(${page - 1})" aria-label="Previous Page">
                <i class="bi bi-chevron-left"></i>
            </button>
        `;

        for (let i = 0; i < totalPages; i++) {
            if (i === 0 || i === totalPages - 1 || (i >= page - 1 && i <= page + 1)) {
                html += `
                    <button type="button" class="pagination-btn ${i === page ? "active" : ""}" onclick="window.goToQuestionsPage(${i})">
                        ${i + 1}
                    </button>
                `;
            } else if (i === page - 2 || i === page + 2) {
                html += `<span style="padding: 0 4px; color: #94a3b8;">...</span>`;
            }
        }

        html += `
            <button type="button" class="pagination-btn" ${page >= totalPages - 1 ? "disabled" : ""} onclick="window.goToQuestionsPage(${page + 1})" aria-label="Next Page">
                <i class="bi bi-chevron-right"></i>
            </button>
        `;

        paginationControls.innerHTML = html;
    }

    window.goToQuestionsPage = function (page) {
        currentPage = page;
        renderQuestions(false);
        const panel = container?.closest(".panel");
        panel?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    function updateTotalQuestions() {
        const element = document.getElementById("totalQuestions");
        if (element) {
            element.textContent = questions.length;
        }
    }

    function showLoading(show) {
        if (!loading) return;
        loading.style.display = show ? "block" : "none";
    }

    function escapeHtml(value) {
        const div = document.createElement("div");
        div.textContent = value ?? "";
        return div.innerHTML;
    }
});