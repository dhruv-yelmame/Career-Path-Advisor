document.addEventListener("DOMContentLoaded", function () {

    // =================================================
    // DOM ELEMENTS - NORMAL MODE
    // =================================================
    const normalModeContainer = document.getElementById("normalQuestionMode");
    const csvModeContainer = document.getElementById("csvQuestionMode");
    const tabNormalBtn = document.getElementById("tabNormalMode");
    const tabCsvBtn = document.getElementById("tabCsvMode");

    const form = document.getElementById("questionForm");
    const addOptionBtn = document.getElementById("addOptionBtn");
    const optionsContainer = document.getElementById("optionsContainer");
    const message = document.getElementById("message");

    // =================================================
    // DOM ELEMENTS - CSV MODE
    // =================================================
    const downloadCsvTemplateBtn = document.getElementById("downloadCsvTemplateBtn");
    const csvDropzone = document.getElementById("csvDropzone");
    const csvFileInput = document.getElementById("csvFileInput");
    const selectedFileInfo = document.getElementById("selectedFileInfo");
    const selectedFileName = document.getElementById("selectedFileName");
    const selectedFileSize = document.getElementById("selectedFileSize");
    const clearFileBtn = document.getElementById("clearFileBtn");

    const csvPreviewSection = document.getElementById("csvPreviewSection");
    const csvPreviewBody = document.getElementById("csvPreviewBody");
    const csvTotalCount = document.getElementById("csvTotalCount");
    const csvValidCount = document.getElementById("csvValidCount");
    const csvErrorBadge = document.getElementById("csvErrorBadge");
    const csvErrorCount = document.getElementById("csvErrorCount");
    const uploadCountText = document.getElementById("uploadCountText");
    const uploadCsvBtn = document.getElementById("uploadCsvBtn");
    const cancelCsvBtn = document.getElementById("cancelCsvBtn");
    const csvMessage = document.getElementById("csvMessage");

    let optionIndex = 0;
    let parsedCsvRows = [];

    // =================================================
    // DOMAIN CATEGORY HELPERS
    // =================================================
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

    // =================================================
    // INITIALIZATION & DOMAIN SELECTORS
    // =================================================
    const domainSelect = document.getElementById("questionCategory");

    loadDynamicCareerDomains();

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

            const existingCategories = new Set();
            if (domainSelect) {
                domainSelect.querySelectorAll("option").forEach(opt => {
                    if (opt.value) existingCategories.add(opt.value.toUpperCase());
                });
            }

            const newCategories = [];
            careers.forEach(c => {
                const cat = (c.category || c.domain || "").trim().toUpperCase();
                if (cat && !existingCategories.has(cat)) {
                    existingCategories.add(cat);
                    newCategories.push({
                        value: cat,
                        title: c.title || formatCategory(cat)
                    });
                }
            });

            if (newCategories.length > 0) {
                if (domainSelect) {
                    const optgroup = document.createElement("optgroup");
                    optgroup.label = "🎯 Additional Career Paths";
                    newCategories.forEach(item => {
                        const opt = document.createElement("option");
                        opt.value = item.value;
                        opt.textContent = item.title;
                        optgroup.appendChild(opt);
                    });
                    domainSelect.appendChild(optgroup);
                }

                const defaultCsvCategory = document.getElementById("defaultCsvCategory");
                if (defaultCsvCategory) {
                    const optgroup = document.createElement("optgroup");
                    optgroup.label = "🎯 Additional Career Paths";
                    newCategories.forEach(item => {
                        const opt = document.createElement("option");
                        opt.value = item.value;
                        opt.textContent = item.title;
                        optgroup.appendChild(opt);
                    });
                    defaultCsvCategory.appendChild(optgroup);
                }
            }
        } catch (e) {
            console.warn("Could not load dynamic career domains:", e);
        }
    }

    // 4 Default Options by Default (first marked correct)
    for (let i = 0; i < 4; i++) {
        addOption(i === 0);
    }

    // =================================================
    // TAB MODE SWITCHING
    // =================================================
    window.switchQuestionMode = function (mode) {
        clearNormalMessage();
        clearCsvMessage();

        if (mode === "csv") {
            tabNormalBtn?.classList.remove("active");
            tabCsvBtn?.classList.add("active");
            if (normalModeContainer) normalModeContainer.style.display = "none";
            if (csvModeContainer) csvModeContainer.style.display = "block";
        } else {
            tabCsvBtn?.classList.remove("active");
            tabNormalBtn?.classList.add("active");
            if (csvModeContainer) csvModeContainer.style.display = "none";
            if (normalModeContainer) normalModeContainer.style.display = "block";
        }
    };

    tabNormalBtn?.addEventListener("click", () => window.switchQuestionMode("normal"));
    tabCsvBtn?.addEventListener("click", () => window.switchQuestionMode("csv"));

    // =================================================
    // NORMAL MODE: EVENTS
    // =================================================
    addOptionBtn?.addEventListener("click", () => addOption(false));

    form?.addEventListener("submit", submitQuestion);

    form?.addEventListener("reset", function () {
        setTimeout(function () {
            optionsContainer.innerHTML = "";
            optionIndex = 0;

            // Reset to 4 default options with first marked correct
            for (let i = 0; i < 4; i++) {
                addOption(i === 0);
            }

            clearNormalMessage();
        }, 0);
    });

    // =================================================
    // ADD OPTION ROW
    // =================================================
    function addOption(isDefaultCorrect = false) {
        if (!optionsContainer) return;

        optionIndex++;

        const row = document.createElement("div");
        row.className = "option-row";

        row.innerHTML = `
            <div class="option-number">
                ${optionIndex}
            </div>

            <input
                type="text"
                class="option-text"
                placeholder="Enter option text..."
                required>

            <label class="correct-wrapper" title="Mark this as the correct answer">
                <input
                    type="radio"
                    name="correctOptionRadio"
                    class="correct-option-radio"
                    ${isDefaultCorrect ? "checked" : ""}>
                <span><i class="bi bi-check-circle-fill" style="margin-right: 3px;"></i> Correct</span>
            </label>

            <button
                type="button"
                class="remove-option"
                title="Remove this option">
                <i class="bi bi-trash"></i>
            </button>
        `;

        // Remove Row
        const removeButton = row.querySelector(".remove-option");
        removeButton?.addEventListener("click", function () {
            const rows = document.querySelectorAll(".option-row");
            if (rows.length <= 2) {
                showNormalMessage("At least two options are recommended for a question.", "error");
                return;
            }
            const wasChecked = row.querySelector(".correct-option-radio")?.checked;
            row.remove();
            updateOptionNumbers();

            // If the deleted option was the checked correct one, make the first one checked
            if (wasChecked) {
                const firstRadio = optionsContainer.querySelector(".correct-option-radio");
                if (firstRadio) firstRadio.checked = true;
            }
        });

        optionsContainer.appendChild(row);
    }

    // =================================================
    // UPDATE OPTION NUMBERS
    // =================================================
    function updateOptionNumbers() {
        const rows = [...document.querySelectorAll(".option-row")];
        rows.forEach(function (row, index) {
            const number = row.querySelector(".option-number");
            if (number) {
                number.textContent = index + 1;
            }
        });
        optionIndex = rows.length;
    }

    // =================================================
    // NORMAL MODE: SUBMIT QUESTION
    // =================================================
    async function submitQuestion(event) {
        event.preventDefault();
        clearNormalMessage();

        const questionText = document.getElementById("questionText")?.value.trim();

        if (!questionText) {
            showNormalMessage("Please enter question text.", "error");
            return;
        }

        const categorySelect = document.getElementById("questionCategory");
        let selectedCategory = categorySelect?.value?.trim();
        if (!selectedCategory || selectedCategory === "GENERAL") {
            const detected = detectDomainCategory(questionText);
            if (detected !== "GENERAL") {
                selectedCategory = detected;
            } else {
                selectedCategory = selectedCategory || "GENERAL";
            }
        }

        const STANDARD_MARKS = 10;
        const rows = [...document.querySelectorAll(".option-row")];
        if (rows.length < 2) {
            showNormalMessage("Please provide at least 2 options for the question.", "error");
            return;
        }

        const options = [];
        let hasCorrectOption = false;

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const optionText = row.querySelector(".option-text")?.value.trim();
            const isCorrect = row.querySelector(".correct-option-radio")?.checked || false;

            if (!optionText) {
                showNormalMessage(`Please enter text for Option #${i + 1}.`, "error");
                return;
            }

            if (isCorrect) {
                hasCorrectOption = true;
            }

            options.push({
                optionText: optionText,
                category: selectedCategory,
                score: isCorrect ? STANDARD_MARKS : 0
            });
        }

        if (!hasCorrectOption) {
            showNormalMessage("Please select one correct option for this question.", "error");
            return;
        }

        const payload = {
            questionText: questionText,
            keyword: selectedCategory,
            category: selectedCategory,
            marks: STANDARD_MARKS,
            options: options
        };

        const token = getToken();
        if (!token) {
            showNormalMessage("Admin session expired. Please login again.", "error");
            setTimeout(function () {
                window.location.href = "/admin-login.html";
            }, 1000);
            return;
        }

        const submitBtn = document.getElementById("saveQuestionBtn");
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<i class="bi bi-arrow-repeat spin"></i> Saving Question...`;
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

            const data = await readResponse(response);

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    showNormalMessage("Admin authentication failed. Please login again.", "error");
                    localStorage.removeItem("adminToken");
                    localStorage.removeItem("token");
                    setTimeout(() => { window.location.href = "/admin-login.html"; }, 1000);
                    return;
                }
                throw new Error(getErrorMessage(data));
            }

            showNormalMessage("Question and options added successfully!", "success");

            // Reset form and recreate 4 default option rows
            form.reset();
            optionsContainer.innerHTML = "";
            optionIndex = 0;
            for (let i = 0; i < 4; i++) {
                addOption(i === 0);
            }

        } catch (error) {
            console.error("Add question error:", error);
            showNormalMessage(error.message || "Unable to add question.", "error");
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = `<i class="bi bi-check-circle"></i> Save Question`;
            }
        }
    }

    // =================================================
    // CSV MODE: SAMPLE TEMPLATE DOWNLOAD
    // =================================================
    downloadCsvTemplateBtn?.addEventListener("click", downloadSampleCsv);

    function downloadSampleCsv() {
        const headers = ["Question", "Option A", "Option B", "Option C", "Option D", "Correct Option", "Category"];
        const sampleRows = [
            [
                "Which Python library provides DataFrame structures for tabular data manipulation?",
                "Matplotlib",
                "Pandas",
                "Requests",
                "Flask",
                "B",
                "DATA_SCIENCE"
            ],
            [
                "What type of Machine Learning algorithm predicts continuous numerical values?",
                "Regression",
                "Classification",
                "Clustering",
                "Dimensionality Reduction",
                "A",
                "AI_MACHINE_LEARNING"
            ],
            [
                "Which HTTP protocol version standardizes end-to-end encrypted web traffic?",
                "HTTP/1.0",
                "FTP",
                "HTTPS",
                "Telnet",
                "C",
                "WEB_DEVELOPMENT"
            ],
            [
                "Which data structure operates on a Last In First Out (LIFO) basis?",
                "Queue",
                "Stack",
                "Array",
                "Linked List",
                "B",
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
        link.setAttribute("download", "questions_upload_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // =================================================
    // CSV MODE: FILE SELECTION & DRAG-AND-DROP
    // =================================================
    csvDropzone?.addEventListener("click", function (e) {
        if (e.target !== clearFileBtn && !clearFileBtn?.contains(e.target)) {
            csvFileInput?.click();
        }
    });

    ["dragenter", "dragover"].forEach(eventName => {
        csvDropzone?.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            csvDropzone.classList.add("dragover");
        });
    });

    ["dragleave", "drop"].forEach(eventName => {
        csvDropzone?.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            csvDropzone.classList.remove("dragover");
        });
    });

    csvDropzone?.addEventListener("drop", function (e) {
        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
            handleCsvFile(files[0]);
        }
    });

    csvFileInput?.addEventListener("change", function () {
        if (this.files && this.files.length > 0) {
            handleCsvFile(this.files[0]);
        }
    });

    clearFileBtn?.addEventListener("click", function (e) {
        e.stopPropagation();
        resetCsvUploadState();
    });

    cancelCsvBtn?.addEventListener("click", function () {
        resetCsvUploadState();
    });

    function resetCsvUploadState() {
        if (csvFileInput) csvFileInput.value = "";
        parsedCsvRows = [];
        if (selectedFileInfo) selectedFileInfo.style.display = "none";
        if (csvPreviewSection) csvPreviewSection.style.display = "none";
        if (csvPreviewBody) csvPreviewBody.innerHTML = "";
        clearCsvMessage();
    }

    function formatFileSize(bytes) {
        if (!bytes || bytes === 0) return "0 KB";
        const k = 1024;
        const dm = 1;
        const sizes = ["Bytes", "KB", "MB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
    }

    function handleCsvFile(file) {
        clearCsvMessage();

        if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv" && file.type !== "application/vnd.ms-excel") {
            showCsvMessage("Please select a valid .csv file.", "error");
            return;
        }

        if (selectedFileName) selectedFileName.textContent = file.name;
        if (selectedFileSize) selectedFileSize.textContent = formatFileSize(file.size);
        if (selectedFileInfo) selectedFileInfo.style.display = "inline-flex";

        const reader = new FileReader();
        reader.onload = function (event) {
            const text = event.target?.result;
            if (!text || typeof text !== "string") {
                showCsvMessage("Failed to read CSV file contents.", "error");
                return;
            }
            processCsvContent(text);
        };
        reader.onerror = function () {
            showCsvMessage("Error reading CSV file.", "error");
        };
        reader.readAsText(file);
    }

    // =================================================
    // CSV PARSER (RFC-4180 COMPLIANT)
    // =================================================
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

    // =================================================
    // PROCESS & VALIDATE CSV
    // =================================================
    function processCsvContent(csvText) {
        const rawRows = parseCsvString(csvText);

        if (!rawRows || rawRows.length === 0) {
            showCsvMessage("The uploaded CSV file is empty.", "error");
            return;
        }

        // Determine if first row is header
        let startIndex = 0;
        const firstCol = (rawRows[0][0] || "").toLowerCase();
        if (firstCol.includes("question") || firstCol.includes("text") || firstCol.includes("title")) {
            startIndex = 1;
        }

        if (startIndex >= rawRows.length) {
            showCsvMessage("The CSV file only contains a header row with no questions.", "error");
            return;
        }

        parsedCsvRows = [];
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

            // Support both 7-column format (col 6 is category) and legacy 8-column format (col 6 is marks, col 7 is category)
            let catRaw = "";
            if (r.length >= 8 && /^\d+$/.test((r[6] || "").trim())) {
                catRaw = (r[7] || "").trim();
            } else {
                catRaw = (r[6] || "").trim();
            }

            const defaultCat = document.getElementById("defaultCsvCategory")?.value || "AUTO";
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

            const marksNum = 10; // Standard 10 marks per question

            if (isValid) {
                validCount++;
            } else {
                errorCount++;
            }

            parsedCsvRows.push({
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

        renderCsvPreview(validCount, errorCount);
    }

    // =================================================
    // RENDER CSV PREVIEW TABLE
    // =================================================
    function renderCsvPreview(validCount, errorCount) {
        if (!csvPreviewSection || !csvPreviewBody) return;

        const totalCount = parsedCsvRows.length;
        if (csvTotalCount) csvTotalCount.textContent = totalCount;
        if (csvValidCount) csvValidCount.textContent = validCount;
        if (uploadCountText) uploadCountText.textContent = validCount;

        if (csvErrorCount && csvErrorBadge) {
            csvErrorCount.textContent = errorCount;
            if (errorCount > 0) {
                csvErrorBadge.style.display = "inline-flex";
            } else {
                csvErrorBadge.style.display = "none";
            }
        }

        let html = "";
        parsedCsvRows.forEach((item, index) => {
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
                    <td style="font-weight: 600; max-width: 280px; word-break: break-word;">${escapeHtml(item.questionText || "(Empty)")}</td>
                    <td><span class="badge" style="background: #e0e7ff; color: #4338ca; padding: 2px 8px; border-radius: 4px; font-weight: 600; font-size: 11px;">${escapeHtml(formatCategory(item.category))}</span></td>
                    <td>${optAHtml}</td>
                    <td>${optBHtml}</td>
                    <td>${optCHtml}</td>
                    <td>${optDHtml}</td>
                    <td style="text-align: center;">${correctDisplay}</td>
                    <td style="text-align: center;">${statusHtml}</td>
                </tr>
            `;
        });

        csvPreviewBody.innerHTML = html;
        csvPreviewSection.style.display = "block";

        if (uploadCsvBtn) {
            uploadCsvBtn.disabled = validCount === 0;
        }

        if (errorCount > 0) {
            showCsvMessage(`Found ${validCount} ready questions and ${errorCount} rows with formatting errors. Only ready questions will be imported.`, "info");
        } else {
            showCsvMessage(`All ${validCount} questions passed formatting validation and are ready to import!`, "success");
        }
    }

    // =================================================
    // CSV MODE: UPLOAD BATCH VIA API
    // =================================================
    uploadCsvBtn?.addEventListener("click", uploadCsvQuestions);

    async function uploadCsvQuestions() {
        clearCsvMessage();

        const validItems = parsedCsvRows.filter(r => r.isValid);
        if (validItems.length === 0) {
            showCsvMessage("No valid questions found to upload.", "error");
            return;
        }

        const token = getToken();
        if (!token) {
            showCsvMessage("Admin session expired. Please login again.", "error");
            setTimeout(function () {
                window.location.href = "/admin-login.html";
            }, 1000);
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

            // Keep non-empty options
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

        if (uploadCsvBtn) {
            uploadCsvBtn.disabled = true;
            uploadCsvBtn.innerHTML = `<i class="bi bi-arrow-repeat spin"></i> Importing ${validItems.length} Questions...`;
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

            const data = await readResponse(response);

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    showCsvMessage("Admin authentication failed. Please login again.", "error");
                    localStorage.removeItem("adminToken");
                    localStorage.removeItem("token");
                    setTimeout(() => { window.location.href = "/admin-login.html"; }, 1000);
                    return;
                }
                throw new Error(getErrorMessage(data));
            }

            const countSaved = Array.isArray(data) ? data.length : validItems.length;
            showCsvMessage(`Successfully imported ${countSaved} questions into the Question Bank!`, "success");

            // Reset file and preview after successful import
            setTimeout(() => {
                resetCsvUploadState();
            }, 2500);

        } catch (error) {
            console.error("Batch upload error:", error);
            showCsvMessage(error.message || "Failed to upload CSV questions.", "error");
        } finally {
            if (uploadCsvBtn) {
                uploadCsvBtn.disabled = false;
                uploadCsvBtn.innerHTML = `<i class="bi bi-cloud-check-fill"></i> Upload <span id="uploadCountText">${validItems.length}</span> Questions`;
            }
        }
    }

    // =================================================
    // HELPERS & MESSAGING
    // =================================================
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

    async function readResponse(response) {
        const text = await response.text();
        if (!text) return {};
        try {
            return JSON.parse(text);
        } catch {
            return text;
        }
    }

    function getErrorMessage(data) {
        if (typeof data === "string") return data;
        if (data && data.message) return data.message;
        if (data && data.error) return data.error;
        return "Request failed.";
    }

    function showNormalMessage(text, type) {
        if (window.AppToast) {
            if (type === "success") {
                window.AppToast.success(text);
            } else {
                window.AppToast.error(text);
            }
        }
        if (!message) return;
        message.textContent = text;
        message.className = "form-message " + type;
    }

    function clearNormalMessage() {
        if (!message) return;
        message.textContent = "";
        message.className = "form-message";
    }

    function showCsvMessage(text, type) {
        if (window.AppToast) {
            if (type === "success") {
                window.AppToast.success(text);
            } else if (type === "error") {
                window.AppToast.error(text);
            } else {
                window.AppToast.info(text);
            }
        }
        if (!csvMessage) return;
        csvMessage.textContent = text;
        csvMessage.className = "form-message " + (type === "info" ? "info" : type);
        csvMessage.style.display = "block";
    }

    function clearCsvMessage() {
        if (!csvMessage) return;
        csvMessage.textContent = "";
        csvMessage.className = "form-message";
        csvMessage.style.display = "none";
    }

    function escapeHtml(value) {
        const div = document.createElement("div");
        div.textContent = value ?? "";
        return div.innerHTML;
    }
});