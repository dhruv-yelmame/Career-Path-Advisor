document.addEventListener("DOMContentLoaded", () => {

    const container = document.getElementById("testsContainer");
    const searchInput = document.getElementById("testSearch");
    const statusFilter = document.getElementById("testStatusFilter");
    const refreshBtn = document.getElementById("refreshTestsBtn");

    let tests = [];

    loadTests();

    searchInput?.addEventListener("input", renderTests);
    statusFilter?.addEventListener("change", renderTests);
    refreshBtn?.addEventListener("click", loadTests);

    async function loadTests() {
        showLoading();

        try {
            const token = getToken();
            if (!token) {
                throw new Error("Admin login session not found. Please login again.");
            }

            const response = await fetch("/api/admin/tests", {
                method: "GET",
                headers: {
                    "Authorization": "Bearer " + token,
                    "Accept": "application/json"
                }
            });

            if (response.status === 401 || response.status === 403) {
                if (window.AppToast) window.AppToast.error("Session expired. Please login again.");
                setTimeout(() => { window.location.href = "admin-login.html"; }, 1500);
                return;
            }

            if (!response.ok) {
                throw new Error("Unable to load tests. HTTP " + response.status);
            }

            const responseData = await response.json();

            if (Array.isArray(responseData)) {
                tests = responseData;
            } else if (responseData && Array.isArray(responseData.content)) {
                tests = responseData.content;
            } else {
                tests = [];
            }

            updateStats();
            renderTests();

        } catch (error) {
            console.error("Load tests error:", error);
            showError(error.message || "Unable to load tests.");
        }
    }

    function renderTests() {
        if (!container) return;

        const search = searchInput?.value?.toLowerCase().trim() || "";
        const status = statusFilter?.value || "";

        const filtered = tests.filter(test => {
            const testName = String(test.testName || "").toLowerCase();
            const description = String(test.description || "").toLowerCase();
            const matchesSearch = !search || testName.includes(search) || description.includes(search);
            const active = isActive(test);

            let matchesStatus = true;
            if (status === "true" || status === "active") matchesStatus = active;
            if (status === "false" || status === "inactive") matchesStatus = !active;

            return matchesSearch && matchesStatus;
        });

        container.innerHTML = "";

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-file-earmark-x"></i>
                    <h3>No Tests Found</h3>
                    <p>${tests.length === 0 ? "No tests have been created yet." : "No tests match your search or filter."}</p>
                </div>
            `;
            return;
        }

        filtered.forEach(test => {
            const card = createTestCard(test);
            container.appendChild(card);
        });
    }

    function createTestCard(test) {
        const card = document.createElement("div");
        card.className = "test-card";
        const active = isActive(test);

        card.innerHTML = `
            <div class="test-card-content">
                <h3>${escapeHtml(test.testName || "Untitled Test")}</h3>
                <p class="test-description">${escapeHtml(test.description || "")}</p>
                <div class="test-meta">
                    <span class="test-meta-item">
                        <i class="bi bi-question-circle"></i>
                        ${test.questionCount ?? 0} Questions
                    </span>
                    <span class="test-meta-item">
                        <i class="bi bi-clock"></i>
                        ${test.timeLimitMinutes ?? 0} Minutes
                    </span>
                    <span class="test-meta-item">
                        <i class="bi bi-shuffle"></i>
                        ${test.randomQuestions === true ? "Random Order" : "Fixed Order"}
                    </span>
                </div>
            </div>

            <div class="test-card-actions">
                <span class="status-badge ${active ? "status-active" : "status-inactive"}">
                    ${active ? "Active" : "Inactive"}
                </span>

                <button type="button" class="btn btn-secondary view-test">
                    <i class="bi bi-eye"></i> View
                </button>

                <button type="button" class="btn btn-outline-primary edit-test">
                    <i class="bi bi-pencil"></i> Edit
                </button>

                <button type="button" class="btn btn-secondary toggle-status-btn" title="${active ? "Deactivate test" : "Activate test"}">
                    <i class="bi ${active ? "bi-toggle-on text-success" : "bi-toggle-off text-secondary"}"></i> ${active ? "Active" : "Inactive"}
                </button>

                <button type="button" class="btn btn-danger delete-test">
                    <i class="bi bi-trash"></i> Delete
                </button>
            </div>
        `;

        card.querySelector(".view-test")?.addEventListener("click", () => {
            if (!test.id) return;
            window.location.href = "test-details.html?id=" + encodeURIComponent(test.id);
        });

        card.querySelector(".edit-test")?.addEventListener("click", () => {
            if (!test.id) return;
            window.location.href = "create-test.html?id=" + encodeURIComponent(test.id);
        });

        card.querySelector(".toggle-status-btn")?.addEventListener("click", async () => {
            await toggleTestStatus(test);
        });

        card.querySelector(".delete-test")?.addEventListener("click", () => {
            if (!test.id) return;
            deleteTest(test.id, test.testName);
        });

        return card;
    }

    async function toggleTestStatus(test) {
        const token = getToken();
        if (!token) return;

        const endpoint = test.active
            ? `/api/admin/tests/${test.id}/deactivate`
            : `/api/admin/tests/${test.id}/activate`;

        try {
            const res = await fetch(endpoint, {
                method: "PUT",
                headers: { "Authorization": "Bearer " + token, "Accept": "application/json" }
            });

            if (!res.ok) throw new Error("Could not update test status");

            test.active = !test.active;
            if (window.AppToast) {
                window.AppToast.success(`Test is now ${test.active ? "Active" : "Inactive"}`);
            }
            updateStats();
            renderTests();
        } catch (e) {
            if (window.AppToast) window.AppToast.error(e.message);
        }
    }

    async function deleteTest(id, name) {
        let confirmed = false;
        if (window.AppModal && typeof window.AppModal.confirm === "function") {
            confirmed = await window.AppModal.confirm({
                title: "Delete Assessment Test",
                message: `Are you sure you want to delete test <strong>${escapeHtml(name || "this test")}</strong>?`,
                confirmText: "Delete Test",
                cancelText: "Cancel",
                type: "danger"
            });
        } else {
            confirmed = window.confirm(`Are you sure you want to delete test "${name || id}"? All associated attempt records will also be deleted.`);
        }

        if (!confirmed) return;

        try {
            const token = getToken();
            if (!token) throw new Error("Please login again.");

            const response = await fetch(`/api/admin/tests/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": "Bearer " + token,
                    "Accept": "application/json"
                }
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || "Unable to delete test.");
            }

            tests = tests.filter(test => Number(test.id) !== Number(id));
            updateStats();
            renderTests();

            if (window.AppToast) {
                window.AppToast.success("Test deleted successfully.");
            }

        } catch (error) {
            console.error("Delete test error:", error);
            if (window.AppToast) {
                window.AppToast.error(error.message || "Unable to delete test.");
            }
        }
    }

    function updateStats() {
        const total = tests.length;
        const active = tests.filter(test => isActive(test)).length;
        const inactive = tests.filter(test => !isActive(test)).length;
        const attempts = tests.reduce((total, test) => total + Number(test.studentCount || 0), 0);

        setText("totalTests", total);
        setText("activeTestCount", active);
        setText("inactiveTestCount", inactive);
        setText("totalAttempts", attempts);
    }

    function isActive(test) {
        return test.active === true || test.active === 1 || test.active === "true" || test.active === "1";
    }

    function showLoading() {
        if (!container) return;
        container.innerHTML = `
            <div class="loading">
                <i class="bi bi-arrow-repeat"></i> Loading tests...
            </div>
        `;
    }

    function showError(message) {
        if (!container) return;
        container.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-exclamation-triangle"></i>
                <h3>Unable to Load Tests</h3>
                <p>${escapeHtml(message)}</p>
                <button type="button" class="btn btn-primary" id="retryTestsBtn">
                    <i class="bi bi-arrow-clockwise"></i> Retry
                </button>
            </div>
        `;
        document.getElementById("retryTestsBtn")?.addEventListener("click", loadTests);
    }

    function getToken() {
        return localStorage.getItem("token") || localStorage.getItem("adminToken");
    }

    function setText(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value ?? 0;
    }

    function escapeHtml(value) {
        const div = document.createElement("div");
        div.textContent = value ?? "";
        return div.innerHTML;
    }
});