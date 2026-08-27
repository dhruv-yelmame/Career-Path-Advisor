document.addEventListener(
    "DOMContentLoaded",
    function () {

        const container = document.getElementById("questionsContainer");
        const loading = document.getElementById("loading");
        const empty = document.getElementById("emptyState");
        const searchInput = document.getElementById("searchInput");
        const typeFilter = document.getElementById("typeFilter");
        const categoryFilter = document.getElementById("categoryFilter");
        const refreshBtn = document.getElementById("refreshQuestionsBtn");

        let questions = [];

        loadQuestions();

        searchInput?.addEventListener("input", renderQuestions);
        typeFilter?.addEventListener("change", renderQuestions);
        categoryFilter?.addEventListener("change", renderQuestions);

        refreshBtn?.addEventListener("click", function () {
            if (searchInput) searchInput.value = "";
            if (typeFilter) typeFilter.value = "ALL";
            if (categoryFilter) categoryFilter.value = "ALL";
            loadQuestions(true);
        });

        async function loadQuestions(isManualRefresh = false) {
            const icon = refreshBtn?.querySelector("i");
            if (refreshBtn) refreshBtn.disabled = true;
            if (icon) icon.classList.add("spin");

            try {
                showLoading(true);

                const token = localStorage.getItem("token") || localStorage.getItem("adminToken");

                if (!token) {
                    window.location.href = "/admin-login.html";
                    return;
                }

                const response = await fetch("/api/admin/questions", {
                    method: "GET",
                    headers: {
                        "Accept": "application/json",
                        "Authorization": "Bearer " + token
                    }
                });

                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    if (window.AppToast) window.AppToast.error("Session expired. Please login again.");
                    setTimeout(() => { window.location.href = "/admin-login.html"; }, 1500);
                    return;
                }

                if (!response.ok) {
                    throw new Error("Unable to load questions.");
                }

                const data = await response.json();
                questions = Array.isArray(data) ? data : (data?.content || []);

                populateCategoriesFilter();
                updateTotalQuestions();
                renderQuestions();

                if (isManualRefresh && window.AppToast) {
                    window.AppToast.success("Questions refreshed successfully!");
                }

            } catch (error) {
                console.error("Load questions error:", error);

                if (container) {
                    container.innerHTML = `
                        <div class="empty-state">
                            <i class="bi bi-exclamation-triangle"></i>
                            <h3>Unable to load questions</h3>
                            <p>${escapeHtml(error.message)}</p>
                        </div>
                    `;
                }

            } finally {
                showLoading(false);
                if (refreshBtn) refreshBtn.disabled = false;
                if (icon) icon.classList.remove("spin");
            }
        }

        function populateCategoriesFilter() {
            if (!categoryFilter) return;

            const categorySet = new Set();
            questions.forEach(q => {
                const options = q.options || q.questionOptions || [];
                options.forEach(opt => {
                    if (opt.category && opt.category.trim()) {
                        categorySet.add(opt.category.trim());
                    }
                });
            });

            const currentVal = categoryFilter.value || "ALL";
            categoryFilter.innerHTML = `<option value="ALL">All Categories</option>`;

            Array.from(categorySet).sort().forEach(cat => {
                const opt = document.createElement("option");
                opt.value = cat;
                opt.textContent = cat;
                if (cat === currentVal) opt.selected = true;
                categoryFilter.appendChild(opt);
            });
        }

        function renderQuestions() {
            if (!container) return;

            const rawSearch = (searchInput?.value || "").trim();
            const search = rawSearch.toLowerCase();
            const selectedType = (typeFilter?.value || "ALL").toUpperCase();
            const selectedCat = (categoryFilter?.value || "ALL");

            const filtered = questions.filter(function (question) {
                const idStr = String(question.id || "");
                const text = (question.questionText || "").toLowerCase();
                const questionType = String(question.questionType || "").toUpperCase();
                const options = question.options || question.questionOptions || [];
                const optionsText = options.map(o => (o.optionText || "") + " " + (o.category || "")).join(" ").toLowerCase();

                const matchesSearch = !search ||
                    text.includes(search) ||
                    idStr === search ||
                    idStr.includes(search) ||
                    ("question #" + idStr).toLowerCase().includes(search) ||
                    optionsText.includes(search);

                const matchesType = selectedType === "ALL" || questionType === selectedType;

                const matchesCategory = selectedCat === "ALL" || options.some(o => o.category === selectedCat);

                return matchesSearch && matchesType && matchesCategory;
            });

            container.innerHTML = "";

            if (filtered.length === 0) {
                if (empty) empty.hidden = false;
                return;
            }

            if (empty) empty.hidden = true;

            filtered.forEach(function (question) {
                container.appendChild(createQuestionCard(question));
            });
        }

        function createQuestionCard(question) {
            const card = document.createElement("div");
            card.className = "question-card";

            const options = question.options || question.questionOptions || [];
            const questionType = question.questionType || "";
            const isActive = question.active !== false;

            card.innerHTML = `
                <div class="question-card-header">
                    <div class="question-main">
                        <div class="question-id">Question #${escapeHtml(String(question.id))}</div>
                        <h3>${escapeHtml(question.questionText || "")}</h3>
                        <div class="question-meta">
                            <span class="badge ${questionType === "INTEREST" ? "badge-interest" : "badge-correct"}">
                                ${escapeHtml(questionType)}
                            </span>
                            <span class="badge ${isActive ? "badge-active" : "badge-inactive"}">
                                ${isActive ? "Active" : "Inactive"}
                            </span>
                        </div>
                    </div>

                    <div class="question-actions">
                        <button type="button" class="icon-btn delete" title="Delete Question" data-id="${question.id}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>

                ${
                    options.length > 0
                        ? `
                            <div class="question-options">
                                <strong>Options:</strong>
                                <ul style="list-style-type: none; padding-left: 0; margin-top: 8px;">
                                    ${options
                                        .map(function (option) {
                                            const isCorr = option.correctAnswer === true;
                                            return `
                                                <li style="padding: 6px 12px; margin-bottom: 4px; border-radius: 6px; background: ${isCorr ? '#d1fae5' : '#f8fafc'}; color: ${isCorr ? '#065f46' : '#334155'}; font-weight: ${isCorr ? '600' : 'normal'};">
                                                    ${isCorr ? '✓ ' : '• '} ${escapeHtml(option.optionText || "")}
                                                    ${option.category ? `<span style="float: right; font-size: 0.75rem; color: #64748b; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${escapeHtml(option.category)} (+${option.score || 0})</span>` : ''}
                                                </li>
                                            `;
                                        })
                                        .join("")}
                                </ul>
                            </div>
                        `
                        : ""
                }
            `;

            card.querySelector(".delete")?.addEventListener("click", function () {
                deleteQuestion(question.id, question.questionText);
            });

            return card;
        }

        async function deleteQuestion(id, text) {
            let confirmed = false;
            if (window.AppModal && typeof window.AppModal.confirm === "function") {
                confirmed = await window.AppModal.confirm({
                    title: "Delete Question",
                    message: `Are you sure you want to delete question #${escapeHtml(String(id))}? It will also be detached from associated tests.`,
                    confirmText: "Delete Question",
                    cancelText: "Cancel",
                    type: "danger"
                });
            } else {
                confirmed = window.confirm(`Are you sure you want to delete question #${id}? It will also be detached from any tests.`);
            }

            if (!confirmed) return;

            try {
                const token = localStorage.getItem("token") || localStorage.getItem("adminToken");

                if (!token) {
                    window.location.href = "/admin-login.html";
                    return;
                }

                const response = await fetch(`/api/admin/questions/${encodeURIComponent(id)}`, {
                    method: "DELETE",
                    headers: {
                        "Accept": "application/json",
                        "Authorization": "Bearer " + token
                    }
                });

                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    window.location.href = "/admin-login.html";
                    return;
                }

                if (!response.ok) {
                    const textErr = await response.text();
                    throw new Error(textErr || "Unable to delete question.");
                }

                questions = questions.filter(function (q) {
                    return Number(q.id) !== Number(id);
                });

                populateCategoriesFilter();
                updateTotalQuestions();
                renderQuestions();

                if (window.AppToast) {
                    window.AppToast.success("Question deleted successfully.");
                }

            } catch (error) {
                console.error("Delete question error:", error);
                if (window.AppToast) {
                    window.AppToast.error(error.message || "Unable to delete question.");
                }
            }
        }

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
    }
);