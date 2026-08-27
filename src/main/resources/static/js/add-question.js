document.addEventListener("DOMContentLoaded", function () {

    const form = document.getElementById("questionForm");
    const addOptionBtn = document.getElementById("addOptionBtn");
    const optionsContainer = document.getElementById("optionsContainer");
    const questionType = document.getElementById("questionType");
    const message = document.getElementById("message");

    let optionIndex = 0;

    // Standard Categories (20 Predefined Categories + Custom Option)
    let availableCategories = [
        { code: "SOFTWARE_ENGINEERING", label: "Software Engineering & Development" },
        { code: "DATA_SCIENCE", label: "Data Science & Machine Learning" },
        { code: "CYBER_SECURITY", label: "Cybersecurity & Networking" },
        { code: "CLOUD_COMPUTING", label: "Cloud Computing & DevOps" },
        { code: "DESIGN", label: "UI/UX & Digital Design" },
        { code: "ROBOTICS_AI", label: "Robotics & Artificial Intelligence" },
        { code: "WEB_DEVELOPMENT", label: "Full Stack Web Development" },
        { code: "MOBILE_DEVELOPMENT", label: "Mobile App Development (iOS/Android)" },
        { code: "BLOCKCHAIN", label: "Blockchain & Web3 Engineering" },
        { code: "PRODUCT_MANAGEMENT", label: "Tech Product Management" },
        { code: "GAME_DEVELOPMENT", label: "Game Development & 3D Interactive" },
        { code: "IOT_EMBEDDED", label: "IoT & Embedded Systems" },
        { code: "QA_AUTOMATION", label: "Quality Assurance & Test Automation" },
        { code: "BIG_DATA", label: "Data Engineering & Big Data" },
        { code: "BUSINESS_MANAGEMENT", label: "Business Management & Strategy" },
        { code: "MARKETING", label: "Digital Marketing & Sales" },
        { code: "FINANCE", label: "Finance & Accounting" },
        { code: "HEALTHCARE", label: "Healthcare & Life Sciences" },
        { code: "HUMAN_RESOURCES", label: "Human Resources & Talent Management" },
        { code: "PERSONAL", label: "Personal / Personality Development" }
    ];

    // =================================================
    // INITIALIZATION
    // =================================================
    initCategories();

    // 4 Default Options by Default
    for (let i = 0; i < 4; i++) {
        addOption();
    }

    // =================================================
    // FETCH CAREER PATHS (DYNAMIC CATEGORIES)
    // =================================================
    async function initCategories() {
        try {
            const token = getToken();
            if (!token) return;

            const response = await fetch("/api/admin/career-paths", {
                method: "GET",
                headers: {
                    "Accept": "application/json",
                    "Authorization": "Bearer " + token
                }
            });

            if (response.ok) {
                const data = await response.json();
                const paths = Array.isArray(data) ? data : (data?.content || data?.data || []);

                paths.forEach(p => {
                    const cat = (p.category || "").trim().toUpperCase();
                    if (cat && !availableCategories.some(c => c.code === cat)) {
                        availableCategories.push({
                            code: cat,
                            label: p.careerName ? `${p.careerName} (${cat})` : cat
                        });
                    }
                });

                // Update existing selects with any newly fetched categories
                updateAllCategoryDropdowns();
            }
        } catch (err) {
            console.warn("Could not fetch extra categories:", err);
        }
    }

    function updateAllCategoryDropdowns() {
        document.querySelectorAll(".option-category").forEach(select => {
            const currentVal = select.value;
            select.innerHTML = buildCategoryOptionsHtml(currentVal);
            select.value = currentVal;
        });
    }

    function buildCategoryOptionsHtml(selectedCode = "") {
        let html = `<option value="" disabled ${!selectedCode ? "selected" : ""}>-- Select Category --</option>`;
        availableCategories.forEach(cat => {
            const isSelected = cat.code === selectedCode ? "selected" : "";
            html += `<option value="${escapeHtml(cat.code)}" ${isSelected}>${escapeHtml(cat.label)}</option>`;
        });
        html += `<option value="__CUSTOM__" ${selectedCode === "__CUSTOM__" ? "selected" : ""}>➕ + Add Custom Category...</option>`;
        return html;
    }

    // =================================================
    // EVENTS
    // =================================================
    addOptionBtn?.addEventListener("click", () => addOption());

    form?.addEventListener("submit", submitQuestion);

    form?.addEventListener("reset", function () {
        setTimeout(function () {
            optionsContainer.innerHTML = "";
            optionIndex = 0;

            // Reset to 4 default options
            for (let i = 0; i < 4; i++) {
                addOption();
            }

            clearMessage();
        }, 0);
    });

    // =================================================
    // ADD OPTION ROW
    // =================================================
    function addOption(defaultCategory = "") {
        if (!optionsContainer) return;

        optionIndex++;

        // Default category rotation for variety if not specified
        if (!defaultCategory) {
            const catIndex = (optionIndex - 1) % availableCategories.length;
            defaultCategory = availableCategories[catIndex]?.code || "";
        }

        const row = document.createElement("div");
        row.className = "option-row";

        row.innerHTML = `
            <div class="option-number">
                ${optionIndex}
            </div>

            <input
                type="text"
                class="option-text"
                placeholder="Option text (e.g. Building software applications)"
                required>

            <div class="category-select-wrapper">
                <select class="option-category" required>
                    ${buildCategoryOptionsHtml(defaultCategory)}
                </select>
                <input
                    type="text"
                    class="custom-category-input"
                    placeholder="Enter custom category name..."
                    style="display: none; margin-top: 6px;">
            </div>

            <div class="score-wrapper" title="Points assigned to this option">
                <input
                    type="number"
                    class="option-score"
                    placeholder="Points"
                    value="5"
                    min="0"
                    required>
                <span class="score-label">pts</span>
            </div>

            <label class="correct-wrapper" title="Mark as correct answer">
                <input
                    type="checkbox"
                    class="correct-answer">
                <span>Correct</span>
            </label>

            <button
                type="button"
                class="remove-option"
                title="Remove this option">
                <i class="bi bi-trash"></i>
            </button>
        `;

        // Handle Custom Category Toggle
        const categorySelect = row.querySelector(".option-category");
        const customInput = row.querySelector(".custom-category-input");

        categorySelect?.addEventListener("change", function () {
            if (this.value === "__CUSTOM__") {
                customInput.style.display = "block";
                customInput.required = true;
                customInput.focus();
            } else {
                customInput.style.display = "none";
                customInput.required = false;
                customInput.value = "";
            }
        });

        // Set initial state for custom input if needed
        if (defaultCategory === "__CUSTOM__") {
            customInput.style.display = "block";
            customInput.required = true;
        }

        // Remove Row
        const removeButton = row.querySelector(".remove-option");
        removeButton?.addEventListener("click", function () {
            const rows = document.querySelectorAll(".option-row");
            if (rows.length <= 1) {
                showMessage("At least one option is required.", "error");
                return;
            }
            row.remove();
            updateOptionNumbers();
        });

        // Correct Answer Checkbox handling (single choice for CORRECT_ANSWER)
        const checkbox = row.querySelector(".correct-answer");
        checkbox?.addEventListener("change", function () {
            if (questionType?.value === "CORRECT_ANSWER" && checkbox.checked) {
                document.querySelectorAll(".correct-answer").forEach(function (other) {
                    if (other !== checkbox) {
                        other.checked = false;
                    }
                });
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
    // SUBMIT QUESTION
    // =================================================
    async function submitQuestion(event) {
        event.preventDefault();
        clearMessage();

        const questionText = document.getElementById("questionText")?.value.trim();
        const type = questionType?.value;

        if (!questionText) {
            showMessage("Please enter question text.", "error");
            return;
        }

        if (!type) {
            showMessage("Please select question type.", "error");
            return;
        }

        const rows = [...document.querySelectorAll(".option-row")];
        if (rows.length === 0) {
            showMessage("Please add at least one option.", "error");
            return;
        }

        const options = [];
        let correctAnswerCount = 0;

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const optionText = row.querySelector(".option-text")?.value.trim();
            const categorySelect = row.querySelector(".option-category");
            const customCategoryInput = row.querySelector(".custom-category-input");
            const scoreValue = row.querySelector(".option-score")?.value;
            const correctAnswer = row.querySelector(".correct-answer")?.checked || false;

            if (!optionText) {
                showMessage(`Please enter text for Option #${i + 1}.`, "error");
                return;
            }

            let category = categorySelect?.value?.trim() || "";
            if (category === "__CUSTOM__") {
                category = customCategoryInput?.value?.trim().toUpperCase() || "";
                if (!category) {
                    showMessage(`Please enter the custom category name for Option #${i + 1}.`, "error");
                    customCategoryInput?.focus();
                    return;
                }
            }

            if (!category) {
                showMessage(`Please select a category for Option #${i + 1}.`, "error");
                return;
            }

            const score = Number(scoreValue !== undefined && scoreValue !== "" ? scoreValue : 5);
            if (Number.isNaN(score) || score < 0) {
                showMessage(`Please enter a valid point value (0 or higher) for Option #${i + 1}.`, "error");
                return;
            }

            if (correctAnswer) {
                correctAnswerCount++;
            }

            options.push({
                optionText: optionText,
                category: category,
                score: score,
                correctAnswer: correctAnswer
            });
        }

        // Validations by question type
        if (type === "CORRECT_ANSWER" && correctAnswerCount !== 1) {
            showMessage("For a Correct Answer question, please select exactly one correct option.", "error");
            return;
        }

        if (type === "INTEREST" && correctAnswerCount > 0) {
            showMessage("Interest Assessment questions evaluate career preference and should not have a correct answer checked.", "error");
            return;
        }

        const payload = {
            questionText: questionText,
            questionType: type,
            options: options
        };

        const token = getToken();
        if (!token) {
            showMessage("Admin session expired. Please login again.", "error");
            setTimeout(function () {
                window.location.href = "/admin-login.html";
            }, 1000);
            return;
        }

        const submitBtn = document.querySelector("#questionForm button[type='submit']");
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<i class="bi bi-arrow-repeat"></i> Saving Question...`;
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
                    showMessage("Admin authentication failed. Please login again.", "error");
                    localStorage.removeItem("adminToken");
                    localStorage.removeItem("token");
                    setTimeout(() => { window.location.href = "/admin-login.html"; }, 1000);
                    return;
                }
                throw new Error(getErrorMessage(data));
            }

            showMessage("Question and options added successfully!", "success");

            // Reset form and recreate 4 default option rows with default 5 points
            form.reset();
            optionsContainer.innerHTML = "";
            optionIndex = 0;
            for (let i = 0; i < 4; i++) {
                addOption();
            }

        } catch (error) {
            console.error("Add question error:", error);
            showMessage(error.message || "Unable to add question.", "error");
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = `<i class="bi bi-check-circle"></i> Save Question`;
            }
        }
    }

    // =================================================
    // HELPERS
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

    function showMessage(text, type) {
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