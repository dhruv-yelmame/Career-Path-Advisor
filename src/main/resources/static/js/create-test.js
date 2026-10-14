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

    const noQuestions =
        document.getElementById("noQuestions");

    const message =
        document.getElementById("message");

    const createTestBtn =
        document.getElementById("createTestBtn");

    const resetBtn =
        document.getElementById("resetBtn");

    // =========================================================
    // MODAL ELEMENTS (DUAL-MODE: SINGLE / CSV)
    // =========================================================

    const openAddQuestionModalBtn = document.getElementById("openAddQuestionModalBtn");
    const openCsvModalBtn = document.getElementById("openCsvModalBtn");
    const emptyAddQuestionBtn = document.getElementById("emptyAddQuestionBtn");
    const emptyCsvBtn = document.getElementById("emptyCsvBtn");
    const addQuestionModal = document.getElementById("addQuestionModal");
    const closeQuestionModalBtn = document.getElementById("closeQuestionModalBtn");
    const modalCancelBtn = document.getElementById("modalCancelBtn");

    const modalTabNormal = document.getElementById("modalTabNormal");
    const modalTabCsv = document.getElementById("modalTabCsv");
    const modalNormalMode = document.getElementById("modalNormalMode");
    const modalCsvMode = document.getElementById("modalCsvMode");

    const modalQuestionForm = document.getElementById("modalQuestionForm");
    const modalQuestionText = document.getElementById("modalQuestionText");
    const modalAddOptionBtn = document.getElementById("modalAddOptionBtn");
    const modalOptionsContainer = document.getElementById("modalOptionsContainer");
    const modalResetBtn = document.getElementById("modalResetBtn");
    const modalSaveQuestionBtn = document.getElementById("modalSaveQuestionBtn");
    const modalSingleMessage = document.getElementById("modalSingleMessage");

    const modalDownloadCsvTemplateBtn = document.getElementById("modalDownloadCsvTemplateBtn");
    const modalCsvDropzone = document.getElementById("modalCsvDropzone");
    const modalCsvFileInput = document.getElementById("modalCsvFileInput");
    const modalSelectedFileInfo = document.getElementById("modalSelectedFileInfo");
    const modalSelectedFileName = document.getElementById("modalSelectedFileName");
    const modalSelectedFileSize = document.getElementById("modalSelectedFileSize");
    const modalClearFileBtn = document.getElementById("modalClearFileBtn");
    const modalCancelCsvBtn = document.getElementById("modalCancelCsvBtn");
    const modalCsvPreviewSection = document.getElementById("modalCsvPreviewSection");
    const modalCsvPreviewBody = document.getElementById("modalCsvPreviewBody");
    const modalCsvTotalCount = document.getElementById("modalCsvTotalCount");
    const modalCsvValidCount = document.getElementById("modalCsvValidCount");
    const modalCsvErrorBadge = document.getElementById("modalCsvErrorBadge");
    const modalCsvErrorCount = document.getElementById("modalCsvErrorCount");
    const modalUploadCountText = document.getElementById("modalUploadCountText");
    const modalUploadCsvBtn = document.getElementById("modalUploadCsvBtn");
    const modalCsvMessage = document.getElementById("modalCsvMessage");

    let modalOptionIndex = 0;
    let modalParsedCsvRows = [];

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

    const questionCategoryFilter = document.getElementById("questionCategoryFilter");
    if (questionSearch) {
        questionSearch.addEventListener("input", renderQuestions);
    }
    if (questionCategoryFilter) {
        questionCategoryFilter.addEventListener("change", renderQuestions);
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
    // MODAL EVENT LISTENERS (ADD QUESTION DUAL-MODE)
    // =========================================================

    openAddQuestionModalBtn?.addEventListener("click", () => openQuestionModal("normal"));
    openCsvModalBtn?.addEventListener("click", () => openQuestionModal("csv"));
    emptyAddQuestionBtn?.addEventListener("click", () => openQuestionModal("normal"));
    emptyCsvBtn?.addEventListener("click", () => openQuestionModal("csv"));
    closeQuestionModalBtn?.addEventListener("click", closeQuestionModal);
    modalCancelBtn?.addEventListener("click", closeQuestionModal);

    addQuestionModal?.addEventListener("click", function (e) {
        if (e.target === addQuestionModal) {
            closeQuestionModal();
        }
    });

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && addQuestionModal && !addQuestionModal.hidden) {
            closeQuestionModal();
        }
    });

    modalAddOptionBtn?.addEventListener("click", () => addModalOption(false));
    modalResetBtn?.addEventListener("click", () => resetModalNormalForm());
    modalQuestionForm?.addEventListener("submit", submitModalQuestion);

    modalDownloadCsvTemplateBtn?.addEventListener("click", downloadModalSampleCsv);
    modalClearFileBtn?.addEventListener("click", (e) => {
        e.stopPropagation();
        resetModalCsvState();
    });
    modalCancelCsvBtn?.addEventListener("click", resetModalCsvState);
    modalUploadCsvBtn?.addEventListener("click", uploadModalCsvQuestions);

    modalCsvDropzone?.addEventListener("click", function (e) {
        if (e.target !== modalClearFileBtn && !modalClearFileBtn?.contains(e.target)) {
            modalCsvFileInput?.click();
        }
    });

    ["dragenter", "dragover"].forEach(eventName => {
        modalCsvDropzone?.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            modalCsvDropzone.classList.add("dragover");
        });
    });

    ["dragleave", "drop"].forEach(eventName => {
        modalCsvDropzone?.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            modalCsvDropzone.classList.remove("dragover");
        });
    });

    modalCsvDropzone?.addEventListener("drop", function (e) {
        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
            handleModalCsvFile(files[0]);
        }
    });

    modalCsvFileInput?.addEventListener("change", function () {
        if (this.files && this.files.length > 0) {
            handleModalCsvFile(this.files[0]);
        }
    });

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

        } catch (error) {
            console.error("Load existing test error:", error);
            showError(error.message);
        }
    }

    // =========================================================
    // RENDER QUESTIONS
    // =========================================================

    function renderQuestions() {
        if (!questionList) return;

        const search = questionSearch?.value?.toLowerCase()?.trim() || "";
        const catFilter = questionCategoryFilter?.value || "";

        const filtered = questions.filter(q => {
            const text = String(q.questionText || "").toLowerCase();
            const type = String(q.questionType || "").toLowerCase();
            const cat = String(q.category || q.keyword || "GENERAL").toUpperCase();
            const matchesSearch = !search || text.includes(search) || type.includes(search) || cat.includes(search);
            const matchesCat = !catFilter || cat === catFilter;
            return matchesSearch && matchesCat;
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
            const categoryText = formatCategory(q.category || q.keyword || "GENERAL");

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
                    <div style="font-size: 0.8rem; color: #64748b; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                        <span class="badge" style="background: #e2e8f0; color: #334155; padding: 2px 6px; border-radius: 4px; font-weight: 600;">
                            ${escapeHtml(q.questionType || "")}
                        </span>
                        <span class="badge" style="background: #e0e7ff; color: #4338ca; padding: 2px 6px; border-radius: 4px; font-weight: 600;">
                            ${escapeHtml(categoryText)}
                        </span>
                        <span>&bull; ${q.options ? q.options.length : 0} options</span>
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

    function detectDomainCategory(text) {
        if (!text) return "GENERAL";
        const lower = text.toLowerCase();
        if (lower.includes("data science") || lower.includes("dataset") || lower.includes("pandas")
            || lower.includes("dataframe") || lower.includes("numpy") || lower.includes("csv")
            || lower.includes("standard deviation") || lower.includes("median") || lower.includes("mode")
            || lower.includes("mean of") || lower.includes("data cleaning") || lower.includes("missing value")
            || lower.includes("data visualization") || lower.includes("eda") || lower.includes("skewed")
            || (lower.includes("sql") && (lower.includes("data") || lower.includes("analytics")))) {
            return "DATA_SCIENCE";
        }
        if (lower.includes("machine learning") || lower.includes("supervised learning")
            || lower.includes("unsupervised learning") || lower.includes("deep learning")
            || lower.includes("neural network") || lower.includes("svm") || lower.includes("overfitting")
            || lower.includes("transformer") || lower.includes("nlp") || lower.includes("clustering")) {
            return "AI_MACHINE_LEARNING";
        }
        if (lower.includes("react") || lower.includes("html") || lower.includes("css")
            || lower.includes("flexbox") || lower.includes("cors") || lower.includes("useeffect")
            || lower.includes("web development") || lower.includes("javascript")) {
            return "WEB_DEVELOPMENT";
        }
        if (lower.includes("cyber") || lower.includes("phishing") || lower.includes("sql injection")
            || lower.includes("firewall") || lower.includes("penetration testing") || lower.includes("encryption")) {
            return "CYBER_SECURITY";
        }
        if (lower.includes("cloud") || lower.includes("aws") || lower.includes("azure")
            || lower.includes("s3") || lower.includes("serverless") || lower.includes("iaas")) {
            return "CLOUD_COMPUTING";
        }
        if (lower.includes("devops") || lower.includes("ci/cd") || lower.includes("kubernetes")
            || lower.includes("docker") || lower.includes("terraform")) {
            return "DEVOPS_ENGINEERING";
        }
        if (lower.includes("mobile") || lower.includes("flutter") || lower.includes("android")
            || lower.includes("ios") || lower.includes("swift") || lower.includes("kotlin")) {
            return "MOBILE_DEVELOPMENT";
        }
        // Network Engineering
        if (lower.includes("cisco") || lower.includes("ccna") || lower.includes("subnet mask")
            || lower.includes("ospf") || lower.includes("bgp") || lower.includes("wireshark")
            || lower.includes("packet analyzer") || lower.includes("three-way handshake")) {
            return "NETWORK_ENGINEERING";
        }
        // Business Intelligence
        if (lower.includes("power bi") || lower.includes("dax") || lower.includes("tableau")
            || lower.includes("star schema") || lower.includes("snowflake schema")
            || lower.includes("business intelligence") || lower.includes("etl")) {
            return "BUSINESS_INTELLIGENCE";
        }
        // Big Data & Data Engineering
        if (lower.includes("big data") || lower.includes("spark") || lower.includes("hadoop")
            || lower.includes("kafka") || lower.includes("airflow") || lower.includes("data lake")
            || lower.includes("databricks") || lower.includes("data engineering")) {
            return "BIG_DATA";
        }
        // UI/UX & Design
        if (lower.includes("ui/ux") || lower.includes("figma") || lower.includes("wireframe")
            || lower.includes("prototyp") || lower.includes("usability") || lower.includes("user experience")
            || lower.includes("design system")) {
            return "UI_UX_DESIGN";
        }
        // Blockchain & Web3
        if (lower.includes("blockchain") || lower.includes("solidity") || lower.includes("smart contract")
            || lower.includes("ethereum") || lower.includes("web3") || lower.includes("dapp")) {
            return "BLOCKCHAIN";
        }
        // Game Development
        if (lower.includes("unity") || lower.includes("unreal") || lower.includes("game engine")
            || lower.includes("gameplay") || lower.includes("shader") || lower.includes("blender")) {
            return "GAME_DEVELOPMENT";
        }
        // Robotics & AI
        if (lower.includes("robotics") || lower.includes("ros 2") || lower.includes("ros2")
            || lower.includes("robot operating system") || lower.includes("slam") || lower.includes("lidar")) {
            return "ROBOTICS_AI";
        }
        // IoT & Embedded
        if (lower.includes("iot") || lower.includes("embedded") || lower.includes("microcontroller")
            || lower.includes("arduino") || lower.includes("raspberry pi") || lower.includes("esp32")
            || lower.includes("rtos") || lower.includes("mqtt")) {
            return "IOT_EMBEDDED";
        }
        // QA & Automation
        if (lower.includes("selenium") || lower.includes("cypress") || lower.includes("playwright")
            || lower.includes("test automation") || lower.includes("istqb") || lower.includes("jmeter")
            || lower.includes("unit test") || lower.includes("regression test")) {
            return "QA_AUTOMATION";
        }
        // Product Management
        if (lower.includes("product manager") || lower.includes("product roadmap") || lower.includes("agile")
            || lower.includes("scrum") || lower.includes("user story") || lower.includes("sprint backlog")) {
            return "PRODUCT_MANAGEMENT";
        }
        // Management Consulting & Strategy
        if (lower.includes("consulting") || lower.includes("swot") || lower.includes("porter")
            || lower.includes("business strategy") || lower.includes("mckinsey")) {
            return "BUSINESS_MANAGEMENT";
        }
        // Marketing
        if (lower.includes("seo") || lower.includes("sem") || lower.includes("google ads")
            || lower.includes("digital marketing") || lower.includes("conversion rate") || lower.includes("funnel")) {
            return "MARKETING";
        }
        // Finance
        if (lower.includes("financial analysis") || lower.includes("investment banking") || lower.includes("dcf")
            || lower.includes("valuation") || lower.includes("equity research") || lower.includes("cfa")
            || lower.includes("balance sheet")) {
            return "FINANCE";
        }
        // Healthcare
        if (lower.includes("health informatics") || lower.includes("ehr") || lower.includes("hipaa")
            || lower.includes("fhir") || lower.includes("clinical data") || lower.includes("biomedical")) {
            return "HEALTHCARE";
        }
        // Human Resources
        if (lower.includes("human resources") || lower.includes("talent acquisition") || lower.includes("recruiting")
            || lower.includes("hr analytics") || lower.includes("employee relations")) {
            return "HUMAN_RESOURCES";
        }
        // Personal Coaching
        if (lower.includes("executive coaching") || lower.includes("emotional intelligence")
            || lower.includes("leadership development") || lower.includes("active listening")) {
            return "PERSONAL";
        }
        // Software Engineering & Java
        if (lower.includes("dependency injection") || lower.includes("solid") || lower.includes("design pattern")
            || lower.includes("binary search tree") || lower.includes("software engineering") || lower.includes("oop")
            || lower.includes("java") || lower.includes("spring boot") || lower.includes("multithreading")
            || lower.includes("operating system") || lower.includes("data structure") || lower.includes("algorithm")) {
            return "SOFTWARE_ENGINEERING";
        }
        return "GENERAL";
    }

    function formatCategory(cat) {
        if (!cat) return "General";
        return String(cat).replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    }

    // =========================================================
    // MODAL QUESTION MANAGEMENT (DUAL-MODE: SINGLE / CSV)
    // =========================================================

    function openQuestionModal(mode = "normal") {
        if (!addQuestionModal) return;
        addQuestionModal.hidden = false;
        window.switchModalMode(mode);

        if (mode === "normal" && (!modalOptionsContainer || modalOptionsContainer.children.length === 0)) {
            resetModalNormalForm();
        }
    }

    function closeQuestionModal() {
        if (!addQuestionModal) return;
        addQuestionModal.hidden = true;
        clearModalSingleMessage();
        clearModalCsvMessage();
    }

    window.switchModalMode = function (mode) {
        clearModalSingleMessage();
        clearModalCsvMessage();

        if (mode === "csv") {
            modalTabNormal?.classList.remove("active");
            modalTabCsv?.classList.add("active");
            if (modalNormalMode) modalNormalMode.style.display = "none";
            if (modalCsvMode) modalCsvMode.style.display = "block";
        } else {
            modalTabCsv?.classList.remove("active");
            modalTabNormal?.classList.add("active");
            if (modalCsvMode) modalCsvMode.style.display = "none";
            if (modalNormalMode) modalNormalMode.style.display = "block";
        }
    };

    // ---------------------------------------------------------
    // MODAL NORMAL MODE
    // ---------------------------------------------------------

    function addModalOption(isDefaultCorrect = false) {
        if (!modalOptionsContainer) return;
        modalOptionIndex++;

        const row = document.createElement("div");
        row.className = "option-row";
        row.innerHTML = `
            <div class="option-number">${modalOptionIndex}</div>
            <input type="text" class="option-text" placeholder="Enter option text..." required>
            <label class="correct-wrapper" title="Mark this as the correct answer">
                <input type="radio" name="modalCorrectRadio" class="modal-correct-radio" ${isDefaultCorrect ? "checked" : ""}>
                <span>Correct</span>
            </label>
            <button type="button" class="remove-option" title="Remove option">
                <i class="bi bi-trash"></i>
            </button>
        `;

        const removeBtn = row.querySelector(".remove-option");
        removeBtn?.addEventListener("click", function () {
            const rows = modalOptionsContainer.querySelectorAll(".option-row");
            if (rows.length <= 2) {
                showModalSingleMessage("At least two options are recommended for a question.", "error");
                return;
            }
            const wasChecked = row.querySelector(".modal-correct-radio")?.checked;
            row.remove();
            updateModalOptionNumbers();

            if (wasChecked) {
                const firstRadio = modalOptionsContainer.querySelector(".modal-correct-radio");
                if (firstRadio) firstRadio.checked = true;
            }
        });

        modalOptionsContainer.appendChild(row);
    }

    function updateModalOptionNumbers() {
        if (!modalOptionsContainer) return;
        const rows = [...modalOptionsContainer.querySelectorAll(".option-row")];
        rows.forEach((r, idx) => {
            const num = r.querySelector(".option-number");
            if (num) num.textContent = idx + 1;
        });
        modalOptionIndex = rows.length;
    }

    function resetModalNormalForm() {
        if (!modalOptionsContainer) return;
        modalOptionsContainer.innerHTML = "";
        modalOptionIndex = 0;
        for (let i = 0; i < 4; i++) {
            addModalOption(i === 0);
        }
        if (modalQuestionText) modalQuestionText.value = "";
        clearModalSingleMessage();
    }

    async function submitModalQuestion(event) {
        event.preventDefault();
        clearModalSingleMessage();

        const qText = modalQuestionText?.value.trim();
        if (!qText) {
            showModalSingleMessage("Please enter question text.", "error");
            return;
        }

        const categorySelect = document.getElementById("modalQuestionCategory");
        let selectedCategory = categorySelect?.value?.trim();
        if (!selectedCategory || selectedCategory === "GENERAL") {
            const detected = detectDomainCategory(qText);
            if (detected !== "GENERAL") {
                selectedCategory = detected;
            } else {
                selectedCategory = selectedCategory || "GENERAL";
            }
        }

        const marksInput = document.getElementById("modalQuestionMarks");
        const defaultMarks = Number(marksInput?.value) || 10;

        const rows = [...modalOptionsContainer.querySelectorAll(".option-row")];
        if (rows.length < 2) {
            showModalSingleMessage("Please provide at least 2 options for the question.", "error");
            return;
        }

        const options = [];
        let hasCorrect = false;

        for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            const optText = r.querySelector(".option-text")?.value.trim();
            const isCorrect = r.querySelector(".modal-correct-radio")?.checked || false;

            if (!optText) {
                showModalSingleMessage(`Please enter text for Option #${i + 1}.`, "error");
                return;
            }

            if (isCorrect) {
                hasCorrect = true;
            }

            options.push({
                optionText: optText,
                category: selectedCategory,
                score: isCorrect ? defaultMarks : 0
            });
        }

        if (!hasCorrect) {
            showModalSingleMessage("Please select one correct option for this question.", "error");
            return;
        }

        const payload = {
            questionText: qText,
            keyword: selectedCategory,
            category: selectedCategory,
            marks: defaultMarks,
            options: options
        };

        const token = getToken();
        if (!token) {
            showModalSingleMessage("Admin session expired. Please login again.", "error");
            return;
        }

        if (modalSaveQuestionBtn) {
            modalSaveQuestionBtn.disabled = true;
            modalSaveQuestionBtn.innerHTML = `<i class="bi bi-arrow-repeat spin"></i> Saving Question...`;
        }

        try {
            const response = await fetch("/api/admin/questions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || "Failed to save question.");
            }

            const savedQuestion = await response.json();

            // Prepend to questions array
            questions.unshift(savedQuestion);
            const qId = Number(savedQuestion.id);
            if (!selectedQuestionIds.includes(qId)) {
                selectedQuestionIds.push(qId);
            }

            // Sync questionCount if less than selected
            const qcInput = document.getElementById("questionCount");
            if (qcInput) {
                const curVal = Number(qcInput.value || 0);
                if (curVal < selectedQuestionIds.length) {
                    qcInput.value = selectedQuestionIds.length;
                }
            }

            renderQuestions();
            updateSelectedCount();
            closeQuestionModal();
            resetModalNormalForm();

            if (window.AppToast) {
                window.AppToast.success("Question created and added to test selection!");
            }

        } catch (err) {
            console.error("Save question error:", err);
            showModalSingleMessage(err.message || "Unable to save question.", "error");
        } finally {
            if (modalSaveQuestionBtn) {
                modalSaveQuestionBtn.disabled = false;
                modalSaveQuestionBtn.innerHTML = `<i class="bi bi-check-circle"></i> Save & Add to Test`;
            }
        }
    }

    // ---------------------------------------------------------
    // MODAL CSV MODE
    // ---------------------------------------------------------

    function downloadModalSampleCsv() {
        const headers = ["Question", "Option A", "Option B", "Option C", "Option D", "Correct Option", "Marks", "Category"];
        const sampleRows = [
            [
                "Which Python library provides DataFrame structures for tabular data manipulation?",
                "Matplotlib",
                "Pandas",
                "Requests",
                "Flask",
                "B",
                "10",
                "DATA_SCIENCE"
            ],
            [
                "What type of Machine Learning algorithm predicts continuous numerical values?",
                "Regression",
                "Classification",
                "Clustering",
                "Dimensionality Reduction",
                "A",
                "10",
                "DATA_SCIENCE"
            ],
            [
                "Which HTTP protocol version standardizes end-to-end encrypted web traffic?",
                "HTTP/1.0",
                "FTP",
                "HTTPS",
                "Telnet",
                "C",
                "10",
                "WEB_DEVELOPMENT"
            ],
            [
                "Which data structure operates on a Last In First Out (LIFO) basis?",
                "Queue",
                "Stack",
                "Array",
                "Linked List",
                "B",
                "10",
                "SOFTWARE_ENGINEERING"
            ]
        ];

        const csvContent = [
            headers.join(","),
            ...sampleRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        ].join("\r\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "test_questions_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function handleModalCsvFile(file) {
        clearModalCsvMessage();

        if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv" && file.type !== "application/vnd.ms-excel") {
            showModalCsvMessage("Please select a valid .csv file.", "error");
            return;
        }

        if (modalSelectedFileName) modalSelectedFileName.textContent = file.name;
        if (modalSelectedFileSize) modalSelectedFileSize.textContent = formatFileSize(file.size);
        if (modalSelectedFileInfo) modalSelectedFileInfo.style.display = "inline-flex";

        const reader = new FileReader();
        reader.onload = function (event) {
            const text = event.target?.result;
            if (!text || typeof text !== "string") {
                showModalCsvMessage("Failed to read CSV file contents.", "error");
                return;
            }
            processModalCsvContent(text);
        };
        reader.onerror = function () {
            showModalCsvMessage("Error reading CSV file.", "error");
        };
        reader.readAsText(file);
    }

    function resetModalCsvState() {
        if (modalCsvFileInput) modalCsvFileInput.value = "";
        modalParsedCsvRows = [];
        if (modalSelectedFileInfo) modalSelectedFileInfo.style.display = "none";
        if (modalCsvPreviewSection) modalCsvPreviewSection.style.display = "none";
        if (modalCsvPreviewBody) modalCsvPreviewBody.innerHTML = "";
        clearModalCsvMessage();
    }

    function formatFileSize(bytes) {
        if (!bytes || bytes === 0) return "0 KB";
        const k = 1024;
        const dm = 1;
        const sizes = ["Bytes", "KB", "MB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
    }

    function parseCsvString(text) {
        const rows = [];
        let currentRow = [];
        let currentCell = "";
        let insideQuotes = false;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const nextChar = text[i + 1];

            if (char === '"') {
                if (insideQuotes && nextChar === '"') {
                    currentCell += '"';
                    i++;
                } else {
                    insideQuotes = !insideQuotes;
                }
            } else if (char === ',' && !insideQuotes) {
                currentRow.push(currentCell.trim());
                currentCell = "";
            } else if ((char === '\r' || char === '\n') && !insideQuotes) {
                if (char === '\r' && nextChar === '\n') {
                    i++;
                }
                currentRow.push(currentCell.trim());
                if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0] !== "")) {
                    rows.push(currentRow);
                }
                currentRow = [];
                currentCell = "";
            } else {
                currentCell += char;
            }
        }

        if (currentCell !== "" || currentRow.length > 0) {
            currentRow.push(currentCell.trim());
            if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0] !== "")) {
                rows.push(currentRow);
            }
        }

        return rows;
    }

    function parseCorrectAnswerIndex(raw) {
        if (!raw) return -1;
        const val = String(raw).trim().toUpperCase();
        if (val === "A" || val === "OPTION A" || val === "1" || val === "OPTION 1") return 0;
        if (val === "B" || val === "OPTION B" || val === "2" || val === "OPTION 2") return 1;
        if (val === "C" || val === "OPTION C" || val === "3" || val === "OPTION 3") return 2;
        if (val === "D" || val === "OPTION D" || val === "4" || val === "OPTION 4") return 3;
        return -1;
    }

    function getOptionLetter(index) {
        return ["A", "B", "C", "D"][index] || `Option ${index + 1}`;
    }

    function processModalCsvContent(csvText) {
        const rawRows = parseCsvString(csvText);
        if (!rawRows || rawRows.length === 0) {
            showModalCsvMessage("The uploaded CSV file is empty.", "error");
            return;
        }

        let startIndex = 0;
        const firstCol = (rawRows[0][0] || "").toLowerCase();
        if (firstCol.includes("question") || firstCol.includes("text") || firstCol.includes("title")) {
            startIndex = 1;
        }

        if (startIndex >= rawRows.length) {
            showModalCsvMessage("The CSV file only contains a header row with no questions.", "error");
            return;
        }

        modalParsedCsvRows = [];
        let validCount = 0;
        let errorCount = 0;

        for (let i = startIndex; i < rawRows.length; i++) {
            const r = rawRows[i];
            const rowNum = i + 1;

            const qText = (r[0] || "").trim();
            const optA = (r[1] || "").trim();
            const optB = (r[2] || "").trim();
            const optC = (r[3] || "").trim();
            const optD = (r[4] || "").trim();
            const correctRaw = (r[5] || "").trim();
            const marksRaw = (r[6] || "").trim();
            const catRaw = (r[7] || "").trim();

            const defaultCat = document.getElementById("modalDefaultCsvCategory")?.value || "AUTO";
            let resolvedCat = (catRaw && catRaw.toUpperCase() !== "GENERAL")
                ? catRaw.toUpperCase()
                : (defaultCat !== "AUTO" && defaultCat !== "GENERAL" ? defaultCat : detectDomainCategory(qText));
            if (!resolvedCat) resolvedCat = "GENERAL";

            let isValid = true;
            const errors = [];

            if (!qText) {
                isValid = false;
                errors.push("Missing question text");
            }

            if (!optA || !optB) {
                isValid = false;
                errors.push("Options A and B are required");
            }

            const correctIdx = parseCorrectAnswerIndex(correctRaw);
            if (correctIdx < 0) {
                isValid = false;
                errors.push("Correct Option must be A, B, C, or D");
            } else {
                const options = [optA, optB, optC, optD];
                if (!options[correctIdx]) {
                    isValid = false;
                    errors.push(`Option ${getOptionLetter(correctIdx)} is empty but marked correct`);
                }
            }

            let marksNum = 10;
            if (marksRaw) {
                const parsedMarks = parseInt(marksRaw, 10);
                if (isNaN(parsedMarks) || parsedMarks <= 0) {
                    isValid = false;
                    errors.push("Marks must be a positive integer");
                } else {
                    marksNum = parsedMarks;
                }
            }

            if (isValid) {
                validCount++;
            } else {
                errorCount++;
            }

            modalParsedCsvRows.push({
                rowNum: rowNum,
                questionText: qText,
                category: resolvedCat,
                optionA: optA,
                optionB: optB,
                optionC: optC,
                optionD: optD,
                correctRaw: correctRaw,
                correctIdx: correctIdx,
                marks: marksNum,
                isValid: isValid,
                errorMsg: errors.join("; ")
            });
        }

        renderModalCsvPreview(validCount, errorCount);
    }

    function renderModalCsvPreview(validCount, errorCount) {
        if (!modalCsvPreviewSection || !modalCsvPreviewBody) return;

        const totalCount = modalParsedCsvRows.length;
        if (modalCsvTotalCount) modalCsvTotalCount.textContent = totalCount;
        if (modalCsvValidCount) modalCsvValidCount.textContent = validCount;
        if (modalUploadCountText) modalUploadCountText.textContent = validCount;

        if (modalCsvErrorCount && modalCsvErrorBadge) {
            modalCsvErrorCount.textContent = errorCount;
            modalCsvErrorBadge.style.display = errorCount > 0 ? "inline-flex" : "none";
        }

        let html = "";
        modalParsedCsvRows.forEach((item, index) => {
            const rowClass = item.isValid ? "" : "row-error";
            const statusHtml = item.isValid
                ? `<span class="status-pill valid"><i class="bi bi-check-circle"></i> Ready</span>`
                : `<span class="status-pill error" title="${escapeHtml(item.errorMsg)}"><i class="bi bi-x-circle"></i> ${escapeHtml(item.errorMsg)}</span>`;

            const optAHtml = item.correctIdx === 0
                ? `<strong style="color: #166534;"><i class="bi bi-check"></i> ${escapeHtml(item.optionA || "-")}</strong>`
                : escapeHtml(item.optionA || "-");

            const optBHtml = item.correctIdx === 1
                ? `<strong style="color: #166534;"><i class="bi bi-check"></i> ${escapeHtml(item.optionB || "-")}</strong>`
                : escapeHtml(item.optionB || "-");

            const optCHtml = item.correctIdx === 2
                ? `<strong style="color: #166534;"><i class="bi bi-check"></i> ${escapeHtml(item.optionC || "-")}</strong>`
                : escapeHtml(item.optionC || "-");

            const optDHtml = item.correctIdx === 3
                ? `<strong style="color: #166534;"><i class="bi bi-check"></i> ${escapeHtml(item.optionD || "-")}</strong>`
                : escapeHtml(item.optionD || "-");

            const correctDisplay = item.correctIdx >= 0
                ? `<span class="cell-correct">Opt ${getOptionLetter(item.correctIdx)}</span>`
                : `<span style="color: #dc2626; font-weight: 600;">${escapeHtml(item.correctRaw || "None")}</span>`;

            html += `
                <tr class="${rowClass}">
                    <td style="color: #64748b; font-weight: 600;">${index + 1}</td>
                    <td style="font-weight: 600; max-width: 250px; word-break: break-word;">${escapeHtml(item.questionText || "(Empty)")}</td>
                    <td><span class="badge" style="background: #e0e7ff; color: #4338ca; padding: 2px 6px; border-radius: 4px; font-weight: 600; font-size: 11px;">${escapeHtml(formatCategory(item.category))}</span></td>
                    <td>${optAHtml}</td>
                    <td>${optBHtml}</td>
                    <td>${optCHtml}</td>
                    <td>${optDHtml}</td>
                    <td style="text-align: center;">${correctDisplay}</td>
                    <td style="text-align: center; font-weight: 600;">${item.marks}</td>
                    <td style="text-align: center;">${statusHtml}</td>
                </tr>
            `;
        });

        modalCsvPreviewBody.innerHTML = html;
        modalCsvPreviewSection.style.display = "block";

        if (modalUploadCsvBtn) {
            modalUploadCsvBtn.disabled = validCount === 0;
        }

        if (errorCount > 0) {
            showModalCsvMessage(`Found ${validCount} ready questions and ${errorCount} rows with formatting errors. Only ready questions will be imported.`, "info");
        } else {
            showModalCsvMessage(`All ${validCount} questions passed formatting validation and are ready to import!`, "success");
        }
    }

    async function uploadModalCsvQuestions() {
        clearModalCsvMessage();
        const validItems = modalParsedCsvRows.filter(r => r.isValid);
        if (validItems.length === 0) {
            showModalCsvMessage("No valid questions found to upload.", "error");
            return;
        }

        const token = getToken();
        if (!token) {
            showModalCsvMessage("Admin session expired. Please login again.", "error");
            return;
        }

        const questionsPayload = validItems.map(item => {
            const rawOptions = [
                { text: item.optionA, isCorrect: item.correctIdx === 0 },
                { text: item.optionB, isCorrect: item.correctIdx === 1 },
                { text: item.optionC, isCorrect: item.correctIdx === 2 },
                { text: item.optionD, isCorrect: item.correctIdx === 3 }
            ];

            const itemCategory = item.category || "GENERAL";

            const options = rawOptions
                .filter(opt => opt.text && opt.text.trim().length > 0)
                .map(opt => ({
                    optionText: opt.text.trim(),
                    category: itemCategory,
                    score: opt.isCorrect ? item.marks : 0
                }));

            return {
                questionText: item.questionText,
                keyword: itemCategory,
                category: itemCategory,
                marks: item.marks,
                options: options
            };
        });

        const batchRequest = {
            questions: questionsPayload
        };

        if (modalUploadCsvBtn) {
            modalUploadCsvBtn.disabled = true;
            modalUploadCsvBtn.innerHTML = `<i class="bi bi-arrow-repeat spin"></i> Importing ${validItems.length} Questions...`;
        }

        try {
            const response = await fetch("/api/admin/questions/batch", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify(batchRequest)
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || "Failed to batch upload questions.");
            }

            const savedQuestions = await response.json();
            const list = Array.isArray(savedQuestions) ? savedQuestions : [];

            // Prepend each to questions and select them
            list.forEach(sq => {
                questions.unshift(sq);
                const qId = Number(sq.id);
                if (!selectedQuestionIds.includes(qId)) {
                    selectedQuestionIds.push(qId);
                }
            });

            const qcInput = document.getElementById("questionCount");
            if (qcInput) {
                const curVal = Number(qcInput.value || 0);
                if (curVal < selectedQuestionIds.length) {
                    qcInput.value = selectedQuestionIds.length;
                }
            }

            renderQuestions();
            updateSelectedCount();
            closeQuestionModal();
            resetModalCsvState();

            if (window.AppToast) {
                window.AppToast.success(`Successfully imported ${list.length} questions and selected them for this test!`);
            }

        } catch (err) {
            console.error("CSV batch upload error:", err);
            showModalCsvMessage(err.message || "Failed to upload CSV questions.", "error");
        } finally {
            if (modalUploadCsvBtn) {
                modalUploadCsvBtn.disabled = false;
                modalUploadCsvBtn.innerHTML = `<i class="bi bi-cloud-check-fill"></i> Import & Add <span id="modalUploadCountText">${validItems.length}</span> Questions to Test`;
            }
        }
    }

    // ---------------------------------------------------------
    // MODAL MESSAGING HELPERS
    // ---------------------------------------------------------

    function showModalSingleMessage(text, type) {
        if (!modalSingleMessage) return;
        modalSingleMessage.textContent = text;
        modalSingleMessage.className = "form-message " + type;
    }

    function clearModalSingleMessage() {
        if (!modalSingleMessage) return;
        modalSingleMessage.textContent = "";
        modalSingleMessage.className = "form-message";
    }

    function showModalCsvMessage(text, type) {
        if (!modalCsvMessage) return;
        modalCsvMessage.textContent = text;
        modalCsvMessage.className = "form-message " + (type === "info" ? "info" : type);
        modalCsvMessage.style.display = "block";
    }

    function clearModalCsvMessage() {
        if (!modalCsvMessage) return;
        modalCsvMessage.textContent = "";
        modalCsvMessage.className = "form-message";
        modalCsvMessage.style.display = "none";
    }

    // =========================================================
    // DYNAMIC CAREER DOMAINS LOADER
    // =========================================================
    async function loadDynamicCareerDomains() {
        const token = getToken();
        if (!token) return;
        try {
            const response = await fetch("/api/admin/career-paths", {
                headers: {
                    "Accept": "application/json",
                    "Authorization": "Bearer " + token
                }
            });
            if (!response.ok) return;
            const data = await response.json();
            const careers = Array.isArray(data) ? data : (data?.content || []);

            const existingCats = new Set();
            if (questionCategoryFilter) {
                questionCategoryFilter.querySelectorAll("option").forEach(opt => {
                    if (opt.value) existingCats.add(opt.value.toUpperCase());
                });
            }

            const extra = [];
            careers.forEach(c => {
                const cat = (c.category || c.domain || "").trim().toUpperCase();
                if (cat && !existingCats.has(cat)) {
                    existingCats.add(cat);
                    extra.push({
                        value: cat,
                        title: c.careerName || c.title || formatCategory(cat)
                    });
                }
            });

            if (extra.length > 0) {
                const targets = [
                    questionCategoryFilter,
                    document.getElementById("modalQuestionCategory"),
                    document.getElementById("modalDefaultCsvCategory")
                ];
                targets.forEach(selectEl => {
                    if (!selectEl) return;
                    const optgroup = document.createElement("optgroup");
                    optgroup.label = "🎯 Additional Career Paths";
                    extra.forEach(item => {
                        const opt = document.createElement("option");
                        opt.value = item.value;
                        opt.textContent = item.title;
                        optgroup.appendChild(opt);
                    });
                    selectEl.appendChild(optgroup);
                });
            }
        } catch (e) {
            console.warn("Could not load dynamic career domains:", e);
        }
    }

    loadDynamicCareerDomains();

});