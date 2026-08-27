document.addEventListener("DOMContentLoaded", () => {

    // =========================================================
    // ELEMENTS
    // =========================================================

    const form =
        document.getElementById("createTestForm") ||
        document.getElementById("testForm");

    const questionList =
        document.getElementById("questionList");

    const questionSearch =
        document.getElementById("questionSearch");

    const selectedCount =
        document.getElementById("selectedCount");

    const selectAllBtn =
        document.getElementById("selectAllBtn");

    const clearSelectionBtn =
        document.getElementById("clearSelectionBtn");

    const selectionType =
        document.getElementById("selectionType");

    const noQuestions =
        document.getElementById("noQuestions");

    const message =
        document.getElementById("message");

    const createTestBtn =
        document.getElementById("createTestBtn");

    const resetBtn =
        document.getElementById("resetBtn");

    // =========================================================
    // EDIT MODE
    // =========================================================

    const urlParams =
        new URLSearchParams(
            window.location.search
        );

    const editId =
        urlParams.get("id");

    const isEditMode =
        !!editId;

    // =========================================================
    // DATA
    // =========================================================

    let questions = [];
    let selectedQuestionIds = [];

    // =========================================================
    // INITIALIZE
    // =========================================================

    initialize();

    async function initialize() {
        try {
            if (isEditMode) {
                setEditModeUI();
            }

            if (isEditMode) {
                await Promise.all([
                    loadQuestions(),
                    loadExistingTest()
                ]);
                applyExistingQuestionSelection();
                renderQuestions();
                updateSelectedCount();
            } else {
                await loadQuestions();
            }

        } catch (error) {
            console.error("Initialization error:", error);
            showMessage(
                error.message || "Unable to initialize test page.",
                "error"
            );
        }
    }

    // =========================================================
    // SET EDIT MODE UI
    // =========================================================

    function setEditModeUI() {
        const pageTitle =
            document.querySelector(".page-header h1");

        const topbarTitle =
            document.querySelector(".topbar h4");

        if (pageTitle) {
            pageTitle.textContent = "Edit Test";
        }

        if (topbarTitle) {
            topbarTitle.textContent = "Edit Test";
        }

        if (createTestBtn) {
            createTestBtn.innerHTML = `
                <i class="bi bi-check-circle"></i>
                Update Test
            `;
        }
    }

    // =========================================================
    // EVENT LISTENERS
    // =========================================================

    if (questionSearch) {
        questionSearch.addEventListener("input", renderQuestions);
    }

    if (selectionType) {
        selectionType.addEventListener("change", handleSelectionType);
    }

    if (selectAllBtn) {
        selectAllBtn.addEventListener("click", selectAllQuestions);
    }

    if (clearSelectionBtn) {
        clearSelectionBtn.addEventListener("click", clearAllQuestions);
    }

    if (form) {
        form.addEventListener("submit", submitTest);
    }

    if (resetBtn) {
        resetBtn.addEventListener("click", function () {
            setTimeout(() => {
                if (isEditMode) {
                    loadExistingTest();
                } else {
                    clearAllQuestions();
                    clearMessage();
                    renderQuestions();
                }
            }, 0);
        });
    }

    // =========================================================
    // LOAD QUESTIONS
    // =========================================================

    async function loadQuestions() {
        showLoading();

        try {
            const token = getToken();

            if (!token) {
                throw new Error("Admin login session not found. Please login again.");
            }

            const response = await fetch("/api/admin/questions", {
                method: "GET",
                headers: {
                    "Authorization": "Bearer " + token,
                    "Accept": "application/json"
                }
            });

            if (response.status === 401) {
                throw new Error("Your admin session has expired. Please login again.");
            }

            if (response.status === 403) {
                throw new Error("Access denied. Please login with an ADMIN account.");
            }

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || "Unable to load questions.");
            }

            const data = await response.json();
            questions = Array.isArray(data) ? data : (data?.content || data?.data || []);

            console.log("Total questions loaded:", questions.length);

            if (!isEditMode) {
                renderQuestions();
            }

        } catch (error) {
            console.error("Question loading error:", error);
            showError(error.message || "Unable to load questions.");
            throw error;
        }
    }

    // =========================================================
    // LOAD EXISTING TEST
    // =========================================================

    async function loadExistingTest() {
        if (!editId) return;

        try {
            const token = getToken();
            if (!token) {
                throw new Error("Admin login session not found. Please login again.");
            }

            const testResponse = await fetch(
                `/api/admin/tests/${encodeURIComponent(editId)}`,
                {
                    method: "GET",
                    headers: {
                        "Authorization": "Bearer " + token,
                        "Accept": "application/json"
                    }
                }
            );

            if (!testResponse.ok) {
                const testText = await testResponse.text();
                throw new Error(testText || "Unable to load test.");
            }

            const test = await testResponse.json();

            setInputValue("testName", test.testName);
            setInputValue("description", test.description || "");
            setInputValue("questionCount", test.questionCount);
            setInputValue("timeLimitMinutes", test.timeLimitMinutes);
            setDateTimeValue("startTime", test.startTime);
            setDateTimeValue("endTime", test.endTime);

            const randomCheckbox = document.getElementById("randomQuestions");
            if (randomCheckbox) {
                randomCheckbox.checked = test.randomQuestions === true || test.randomQuestions === "true";
            }

            const activeCheckbox = document.getElementById("active");
            if (activeCheckbox) {
                activeCheckbox.checked = test.active === true || test.active === "true";
            }

            // Load questions assigned to this test
            const questionsResponse = await fetch(
                `/api/admin/tests/${encodeURIComponent(editId)}/questions`,
                {
                    method: "GET",
                    headers: {
                        "Authorization": "Bearer " + token,
                        "Accept": "application/json"
                    }
                }
            );

            if (questionsResponse.ok) {
                const qData = await questionsResponse.json();
                const existingQuestions = Array.isArray(qData) ? qData : (qData?.content || qData?.data || []);
                selectedQuestionIds = existingQuestions
                    .map(item => Number(item.questionId || item.id))
                    .filter(id => !Number.isNaN(id));
            }

            if (selectionType) {
                selectionType.value = test.randomQuestions ? "RANDOM" : "MANUAL";
            }

        } catch (error) {
            console.error("Load existing test error:", error);
            showError(error.message);
        }
    }

    function applyExistingQuestionSelection() {
        if (!selectionType) return;

        if (selectionType.value === "ALL") {
            selectedQuestionIds = questions.map(q => Number(q.id)).filter(id => !Number.isNaN(id));
        }
    }

    // =========================================================
    // RENDER QUESTIONS
    // =========================================================

    function renderQuestions() {
        if (!questionList) return;

        const search = questionSearch?.value?.toLowerCase()?.trim() || "";

        const filtered = questions.filter(q => {
            const text = String(q.questionText || "").toLowerCase();
            const type = String(q.questionType || "").toLowerCase();
            return !search || text.includes(search) || type.includes(search);
        });

        questionList.innerHTML = "";

        if (filtered.length === 0) {
            if (noQuestions) noQuestions.hidden = false;
            return;
        }

        if (noQuestions) noQuestions.hidden = true;

        filtered.forEach((q, idx) => {
            const item = document.createElement("div");
            item.className = "question-item";

            const isChecked = selectedQuestionIds.includes(Number(q.id));

            item.innerHTML = `
                <div class="question-checkbox">
                    <input
                        type="checkbox"
                        id="q_${q.id}"
                        name="questionIds"
                        value="${q.id}"
                        ${isChecked ? "checked" : ""}>
                </div>
                <div class="question-info">
                    <label for="q_${q.id}" style="cursor: pointer; display: block; margin-bottom: 4px;">
                        <strong>#${idx + 1}. ${escapeHtml(q.questionText || "")}</strong>
                    </label>
                    <div style="font-size: 0.8rem; color: #64748b;">
                        <span class="badge" style="background: #e2e8f0; color: #334155; padding: 2px 6px; border-radius: 4px; font-weight: 600;">
                            ${escapeHtml(q.questionType || "")}
                        </span>
                        &bull; ${q.options ? q.options.length : 0} options
                    </div>
                </div>
            `;

            const checkbox = item.querySelector(`input[name="questionIds"]`);
            checkbox?.addEventListener("change", () => {
                const qId = Number(q.id);
                if (checkbox.checked) {
                    if (!selectedQuestionIds.includes(qId)) {
                        selectedQuestionIds.push(qId);
                    }
                } else {
                    selectedQuestionIds = selectedQuestionIds.filter(id => id !== qId);
                }
                updateSelectedCount();
            });

            questionList.appendChild(item);
        });

        updateSelectedCount();
    }

    function handleSelectionType() {
        const type = selectionType?.value;

        if (type === "ALL") {
            selectAllQuestions();
        } else if (type === "RANDOM") {
            // Check random option
            const rand = document.getElementById("randomQuestions");
            if (rand) rand.checked = true;
            selectAllQuestions();
        }
    }

    function selectAllQuestions() {
        selectedQuestionIds = questions.map(q => Number(q.id)).filter(id => !Number.isNaN(id));
        const checkboxes = questionList?.querySelectorAll('input[name="questionIds"]');
        checkboxes?.forEach(cb => { cb.checked = true; });
        updateSelectedCount();
    }

    function clearAllQuestions() {
        selectedQuestionIds = [];
        const checkboxes = questionList?.querySelectorAll('input[name="questionIds"]');
        checkboxes?.forEach(cb => { cb.checked = false; });
        updateSelectedCount();
    }

    function updateSelectedCount() {
        if (selectedCount) {
            selectedCount.textContent = selectedQuestionIds.length;
        }
    }

    // =========================================================
    // SUBMIT TEST
    // =========================================================

    async function submitTest(event) {
        event.preventDefault();
        clearMessage();

        const testName = document.getElementById("testName")?.value.trim();
        const description = document.getElementById("description")?.value.trim() || "";
        const questionCount = Number(document.getElementById("questionCount")?.value || 0);
        const timeLimitMinutes = Number(document.getElementById("timeLimitMinutes")?.value || 0);
        const startTime = document.getElementById("startTime")?.value || null;
        const endTime = document.getElementById("endTime")?.value || null;
        const randomQuestions = document.getElementById("randomQuestions")?.checked || false;
        const active = document.getElementById("active")?.checked ?? true;

        const questionIds = [...new Set(selectedQuestionIds.map(id => Number(id)))];

        if (!testName) {
            showMessage("Please enter a test name.", "error");
            return;
        }

        if (questionCount <= 0) {
            showMessage("Please enter a valid question count.", "error");
            return;
        }

        if (timeLimitMinutes <= 0) {
            showMessage("Please enter a valid time limit in minutes.", "error");
            return;
        }

        if (questionIds.length === 0) {
            showMessage("Please select at least one question.", "error");
            return;
        }

        if (questionCount > questionIds.length) {
            showMessage("Question count cannot exceed the number of selected questions.", "error");
            return;
        }

        const payload = {
            testName: testName,
            description: description,
            questionCount: questionCount,
            timeLimitMinutes: timeLimitMinutes,
            randomQuestions: randomQuestions,
            active: active,
            startTime: convertLocalDateTime(startTime),
            endTime: convertLocalDateTime(endTime),
            questionIds: questionIds
        };

        const token = getToken();
        if (!token) {
            showMessage("Admin login session not found. Please login again.", "error");
            return;
        }

        if (createTestBtn) {
            createTestBtn.disabled = true;
            createTestBtn.innerHTML = `<i class="bi bi-arrow-repeat"></i> ${isEditMode ? "Updating..." : "Creating..."}`;
        }

        try {
            const url = isEditMode ? `/api/admin/tests/${encodeURIComponent(editId)}` : "/api/admin/tests";
            const method = isEditMode ? "PUT" : "POST";

            const response = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const responseText = await response.text();
                throw new Error(responseText || (isEditMode ? "Unable to update test." : "Unable to create test."));
            }

            showMessage(
                isEditMode ? "Test updated successfully!" : "Test created successfully!",
                "success"
            );

            setTimeout(() => {
                window.location.href = "view-tests.html";
            }, 800);

        } catch (error) {
            console.error("Test save error:", error);
            showMessage(error.message, "error");
        } finally {
            if (createTestBtn) {
                createTestBtn.disabled = false;
                createTestBtn.innerHTML = `
                    <i class="bi bi-check-circle"></i>
                    ${isEditMode ? "Update Test" : "Create Test"}
                `;
            }
        }
    }

    // =========================================================
    // HELPERS
    // =========================================================

    function setInputValue(id, value) {
        const element = document.getElementById(id);
        if (element) element.value = value ?? "";
    }

    function setDateTimeValue(id, value) {
        const element = document.getElementById(id);
        if (!element || !value) return;
        let formatted = String(value);
        if (formatted.length >= 16) {
            formatted = formatted.substring(0, 16);
        }
        element.value = formatted;
    }

    function getToken() {
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

    function convertLocalDateTime(value) {
        if (!value) return null;
        if (value.length === 16) return value + ":00";
        return value;
    }

    function showLoading() {
        if (!questionList) return;
        questionList.innerHTML = `
            <div class="loading">
                <i class="bi bi-arrow-repeat"></i>
                Loading questions...
            </div>
        `;
        if (noQuestions) noQuestions.hidden = true;
    }

    function showError(errorMessage) {
        if (!questionList) return;
        questionList.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-exclamation-triangle"></i>
                <h3>Unable to load questions</h3>
                <p>${escapeHtml(errorMessage)}</p>
                <button type="button" id="retryQuestionsBtn" class="btn btn-primary">
                    <i class="bi bi-arrow-clockwise"></i> Retry
                </button>
            </div>
        `;
        if (noQuestions) noQuestions.hidden = true;
        document.getElementById("retryQuestionsBtn")?.addEventListener("click", loadQuestions);
    }

    function showMessage(text, type) {
        if (window.AppToast) {
            if (type === "success") window.AppToast.success(text);
            else window.AppToast.error(text);
        }
        if (!message) return;
        message.textContent = text;
        message.className = "form-message " + type;
    }

    function clearMessage() {
        if (!message) return;
        message.textContent = "";
        message.className = "form-message";
    }

    function escapeHtml(value) {
        const div = document.createElement("div");
        div.textContent = value ?? "";
        return div.innerHTML;
    }

});