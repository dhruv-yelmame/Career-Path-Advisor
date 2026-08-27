document.addEventListener("DOMContentLoaded", () => {

    const container = document.getElementById("resultsContainer");
    const searchInput = document.getElementById("resultSearch") || document.getElementById("searchInput");
    const careerFilter = document.getElementById("careerFilter");
    const refreshBtn = document.getElementById("refreshResultsBtn");

    let results = [];

    loadResults();

    searchInput?.addEventListener("input", renderResults);
    careerFilter?.addEventListener("change", renderResults);
    refreshBtn?.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";
        if (careerFilter) careerFilter.value = "";
        loadResults(true);
    });

    function getAuthHeaders() {
        const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
        return {
            "Accept": "application/json",
            ...(token ? { "Authorization": "Bearer " + token } : {})
        };
    }

    async function loadResults(isManualRefresh = false) {
        const icon = refreshBtn?.querySelector("i");
        if (refreshBtn) refreshBtn.disabled = true;
        if (icon) icon.classList.add("spin");

        if (container) {
            container.innerHTML = `
                <div class="loading">
                    <i class="bi bi-arrow-repeat"></i>
                    Loading assessment results...
                </div>
            `;
        }

        try {
            const response = await fetch("/api/student/results/all", {
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error("Unable to load results.");
            }

            const data = await response.json();
            results = Array.isArray(data) ? data : (data?.content || []);

            populateCategoriesFilter();
            updateStats();
            renderResults();

            if (isManualRefresh && window.AppToast) {
                window.AppToast.success("Assessment results refreshed successfully!");
            }

        } catch (error) {
            console.error(error);
            if (container) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="bi bi-exclamation-triangle"></i>
                        <h3>Unable to load results</h3>
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
        if (!careerFilter) return;

        const categories = [...new Set(results.map(r => r.category).filter(Boolean))];
        const currentVal = careerFilter.value;

        careerFilter.innerHTML = `<option value="">All Career Categories</option>`;
        categories.forEach(cat => {
            const opt = document.createElement("option");
            opt.value = cat;
            opt.textContent = cat;
            if (cat === currentVal) opt.selected = true;
            careerFilter.appendChild(opt);
        });
    }

    function renderResults() {
        if (!container) return;

        const search = searchInput?.value?.toLowerCase().trim() || "";
        const selectedCat = careerFilter?.value?.trim() || "";

        const filtered = results.filter(result => {
            const student = (result.studentName || result.studentEmail || "").toLowerCase();
            const career = (result.recommendedCareer || "").toLowerCase();
            const test = (result.testName || "").toLowerCase();
            const category = (result.category || "").toLowerCase();

            const matchesSearch = !search ||
                student.includes(search) ||
                career.includes(search) ||
                test.includes(search) ||
                category.includes(search);

            const matchesCat = !selectedCat || (result.category === selectedCat);

            return matchesSearch && matchesCat;
        });

        container.innerHTML = "";

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-bar-chart"></i>
                    <h3>No results found</h3>
                    <p>${results.length === 0 ? "No assessment submissions yet." : "No results match your search and filter."}</p>
                </div>
            `;
            return;
        }

        filtered.forEach(result => {
            const card = document.createElement("div");
            card.className = "result-card";

            const studentName = result.studentName || "Student";
            const studentEmail = result.studentEmail || "";
            const testName = result.testName || "Assessment Test";
            const careerName = result.recommendedCareer || "Career Not Assigned";

            card.innerHTML = `
                <div style="flex: 1;">
                    <h3 style="font-size: 16px; font-weight: 700; color: #0f172a;">
                        ${escapeHtml(studentName)}
                        ${studentEmail ? `<small style="font-size: 0.85rem; color: #64748b; font-weight: normal;">(${escapeHtml(studentEmail)})</small>` : ""}
                    </h3>
                    <p style="margin: 6px 0 10px 0; color: var(--admin-primary); font-weight: 600; font-size: 13px;">
                        <i class="bi bi-file-earmark-check"></i> ${escapeHtml(testName)} &nbsp;&bull;&nbsp; <i class="bi bi-award"></i> ${escapeHtml(careerName)}
                    </p>

                    <div class="result-meta">
                        <span><strong>Category:</strong> ${escapeHtml(result.category || "-")}</span>
                        <span><strong>Interest:</strong> ${result.interestScore ?? 0} pts</span>
                        <span><strong>Knowledge:</strong> ${result.knowledgeScore ?? 0} pts</span>
                        <span><strong>Completed:</strong> ${formatDate(result.completedAt)}</span>
                    </div>
                </div>

                <div class="result-score" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 100px; padding: 10px 16px; background: #f8fafc; border: 1px solid var(--admin-border); border-radius: 10px;">
                    <strong style="font-size: 1.75rem; color: var(--admin-primary); line-height: 1;">${result.totalScore ?? result.score ?? 0}</strong>
                    <span style="font-size: 0.75rem; color: var(--admin-text-muted); margin-top: 4px; font-weight: 600; text-transform: uppercase;">Total Score</span>
                </div>
            `;

            container.appendChild(card);
        });
    }

    function updateStats() {
        const uniqueStudents = new Set(results.map(r => r.studentId || r.studentEmail).filter(Boolean)).size;
        const uniqueCategories = new Set(results.map(r => r.category).filter(Boolean)).size;

        setText("studentsEvaluated", uniqueStudents || results.length);
        setText("careerCategories", uniqueCategories);

        if (results.length === 0) {
            setText("averageScore", "0");
            return;
        }

        const total = results.reduce((sum, result) => sum + Number(result.totalScore || result.score || 0), 0);
        const average = total / results.length;

        setText("averageScore", average.toFixed(1));
    }

    function formatDate(value) {
        if (!value) return "-";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
    }

    function setText(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }

    function escapeHtml(value) {
        const div = document.createElement("div");
        div.textContent = value ?? "";
        return div.innerHTML;
    }
});