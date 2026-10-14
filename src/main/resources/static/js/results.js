/**
 * Career Path Adviser - Modern Assessment Results Script
 * Features:
 * - Interactive test summary cards & tab switcher
 * - Dynamic instant search, score tier filters, and sorting
 * - Responsive pagination with configurable page size (8, 15, 25, 50)
 * - Detailed Student Career Profile Bootstrap Modal
 * - Full mobile responsiveness
 */

document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    // DOM Elements - Statistics
    const testsCountBadge = document.getElementById("testsCountBadge");

    // DOM Elements - Tests Overview
    const testsGrid = document.getElementById("testsGrid");
    const viewAllTestsBtn = document.getElementById("viewAllTestsBtn");

    // DOM Elements - Results Table & Section
    const resultsSection = document.getElementById("resultsSection");
    const resultsHeading = document.getElementById("resultsHeading");
    const resultsSubheading = document.getElementById("resultsSubheading");
    const totalResultsBadge = document.getElementById("totalResultsBadge");
    const resultsTableWrapper = document.getElementById("resultsTableWrapper");
    const resultsTableBody = document.getElementById("resultsTableBody");
    const emptyResults = document.getElementById("emptyResults");
    const emptyResultsText = document.getElementById("emptyResultsText");
    const resetFiltersBtn = document.getElementById("resetFiltersBtn");

    // DOM Elements - Filters & Search
    const searchInput = document.getElementById("resultSearch");
    const clearSearchBtn = document.getElementById("clearSearchBtn");
    const scoreTierFilter = document.getElementById("scoreTierFilter");
    const sortFilter = document.getElementById("sortFilter");
    const pageSizeSelect = document.getElementById("pageSizeSelect");

    // DOM Elements - Pagination
    const paginationRow = document.getElementById("paginationRow");
    const paginationInfo = document.getElementById("paginationInfo");
    const paginationControls = document.getElementById("paginationControls");

    // State
    let selectedTestId = null; // null = all tests
    let testsSummaryList = [];
    let allResults = [];
    let filteredResults = [];
    let currentPage = 0;
    let pageSize = 15;
    let debounceTimer = null;

    init();

    async function init() {
        setupEventListeners();
        await refreshData();
    }

    function getAuthHeaders() {
        if (typeof window.authHeaders === "function") {
            return window.authHeaders();
        }
        const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
        return {
            "Accept": "application/json",
            ...(token ? { "Authorization": "Bearer " + token } : {})
        };
    }

    function setupEventListeners() {
        // View all tests combined button
        viewAllTestsBtn?.addEventListener("click", () => {
            selectTest(null);
        });

        // Search input with debounce
        searchInput?.addEventListener("input", () => {
            const val = searchInput.value.trim();
            if (clearSearchBtn) {
                clearSearchBtn.style.display = val ? "inline-block" : "none";
            }
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                currentPage = 0;
                applyFilterAndRender();
            }, 150);
        });

        clearSearchBtn?.addEventListener("click", () => {
            if (searchInput) searchInput.value = "";
            clearSearchBtn.style.display = "none";
            currentPage = 0;
            applyFilterAndRender();
        });

        // Score tier filter
        scoreTierFilter?.addEventListener("change", () => {
            currentPage = 0;
            applyFilterAndRender();
        });

        // Sort filter
        sortFilter?.addEventListener("change", () => {
            currentPage = 0;
            applyFilterAndRender();
        });

        // Page size selector
        pageSizeSelect?.addEventListener("change", () => {
            pageSize = parseInt(pageSizeSelect.value, 10) || 15;
            currentPage = 0;
            applyFilterAndRender();
        });

        // Reset all filters in empty state
        resetFiltersBtn?.addEventListener("click", () => {
            if (searchInput) searchInput.value = "";
            if (clearSearchBtn) clearSearchBtn.style.display = "none";
            if (scoreTierFilter) scoreTierFilter.value = "all";
            if (sortFilter) sortFilter.value = "newest";
            selectedTestId = null;
            currentPage = 0;
            renderTestsOverviewGrid();
            applyFilterAndRender();
        });
    }

    async function refreshData() {
        await Promise.all([
            loadTestsSummary(),
            loadAllResults()
        ]);
    }

    // ==========================================
    // 1. TESTS SUMMARY OVERVIEW & CARDS
    // ==========================================
    async function loadTestsSummary() {
        try {
            const res = await fetch("/api/student/results/tests-summary", { headers: getAuthHeaders() });
            if (!res.ok) throw new Error("Failed to load tests summary");

            testsSummaryList = await res.json();
            updateTopStatistics();
            renderTestsOverviewGrid();
        } catch (err) {
            console.error("Could not load tests summary:", err);
            if (testsGrid) {
                testsGrid.innerHTML = `
                    <div class="col-12 text-center py-4 text-danger">
                        <i class="bi bi-exclamation-triangle-fill fs-4 d-block mb-2"></i>
                        Unable to load tests summary analytics.
                    </div>
                `;
            }
        }
    }

    function updateTopStatistics() {
        let uniqueStudentCount = 0;
        let totalSubmissions = 0;

        if (Array.isArray(allResults) && allResults.length > 0) {
            const studentIds = new Set();
            allResults.forEach(r => {
                const id = r.studentId != null ? String(r.studentId) : (r.studentEmail || null);
                if (id) studentIds.add(id);
            });
            uniqueStudentCount = studentIds.size;
            totalSubmissions = allResults.length;
        } else {
            totalSubmissions = testsSummaryList.reduce((sum, t) => sum + Number(t.totalSubmissions != null ? t.totalSubmissions : (t.totalStudents || 0)), 0);
            uniqueStudentCount = testsSummaryList.reduce((sum, t) => sum + Number(t.totalStudents || 0), 0);
        }

        const testsWithAttempts = testsSummaryList.filter(t => (t.totalSubmissions != null ? t.totalSubmissions : (t.totalStudents || 0)) > 0);
        const avgScore = testsWithAttempts.length > 0
            ? (testsWithAttempts.reduce((sum, t) => sum + Number(t.averageScore || 0), 0) / testsWithAttempts.length).toFixed(1)
            : "0";

        setText("studentsEvaluated", uniqueStudentCount);
        setText("averageScore", `${avgScore}%`);
        setText("totalTestsCount", testsSummaryList.length);
        setText("totalSubmissionsCount", totalSubmissions);
        if (testsCountBadge) {
            testsCountBadge.textContent = `${testsSummaryList.length} ${testsSummaryList.length === 1 ? 'Test' : 'Tests'}`;
        }
    }

    function renderTestsOverviewGrid() {
        if (!testsGrid) return;

        if (testsSummaryList.length === 0) {
            testsGrid.innerHTML = `
                <div class="col-12 text-center py-4 text-muted">
                    <i class="bi bi-folder2-open fs-3 d-block mb-2 text-secondary"></i>
                    No assessment tests found in the system.
                </div>
            `;
            return;
        }

        testsGrid.innerHTML = testsSummaryList.map(t => {
            const isSelected = selectedTestId != null && String(selectedTestId) === String(t.testId);
            const studentCount = Number(t.totalStudents || 0);
            const submissionsCount = Number(t.totalSubmissions != null ? t.totalSubmissions : (t.totalStudents || 0));
            const avg = t.averageScore ? `${t.averageScore}%` : "0%";
            const high = t.highestScore ? `${t.highestScore}%` : "0%";

            return `
                <div class="col">
                    <div class="test-summary-card ${isSelected ? 'active-test-card' : ''}" 
                         data-test-id="${t.testId}" 
                         onclick="window.selectTestFromCard(${t.testId})">
                        <div>
                            <div class="d-flex align-items-center justify-content-between mb-2">
                                <span class="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2.5 py-1 fw-bold" style="font-size: 11px;">
                                    TEST #${t.testId}
                                </span>
                                <span class="badge ${submissionsCount > 0 ? 'bg-primary-subtle text-primary border border-primary-subtle' : 'bg-secondary-subtle text-secondary'} rounded-pill px-2.5 py-1 fw-semibold" style="font-size: 11px;">
                                    <i class="bi bi-arrow-repeat me-1"></i> ${submissionsCount} Attempts
                                </span>
                            </div>
                            <h6 class="fw-bold text-dark mb-1 text-truncate" title="${escapeHtml(t.testName || `Test ${t.testId}`)}">
                                ${escapeHtml(t.testName || `Test ${t.testId}`)}
                            </h6>
                            <p class="text-muted small mb-0" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 38px;">
                                ${escapeHtml(t.description || "Comprehensive career aptitude and domain competency evaluation.")}
                            </p>
                        </div>

                        <div>
                            <div class="test-metrics-grid">
                                <div class="metric-item">
                                    <span>Students</span>
                                    <strong class="text-primary">${studentCount}</strong>
                                </div>
                                <div class="metric-item">
                                    <span>Avg Score</span>
                                    <strong class="text-dark">${avg}</strong>
                                </div>
                                <div class="metric-item">
                                    <span>Top Score</span>
                                    <strong class="text-success">${high}</strong>
                                </div>
                            </div>

                            <button type="button" class="btn btn-sm ${isSelected ? 'btn-primary text-white' : 'btn-outline-primary'} w-100 rounded-pill fw-semibold d-inline-flex align-items-center justify-content-center gap-1">
                                <i class="bi ${isSelected ? 'bi-check-circle-fill' : 'bi-funnel'}"></i>
                                ${isSelected ? 'Currently Selected (Click to Clear)' : `Filter Test #${t.testId}`}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join("");
    }

    window.selectTestFromCard = function (testId) {
        if (selectedTestId != null && String(selectedTestId) === String(testId)) {
            // Tapping on already selected test unfilters back to all
            selectTest(null);
        } else {
            selectTest(testId);
        }
    };

    function selectTest(testId) {
        selectedTestId = testId != null ? Number(testId) : null;
        currentPage = 0;

        renderTestsOverviewGrid();
        applyFilterAndRender();
        scrollToResults();
    }

    // ==========================================
    // 2. LOAD RESULTS & FILTER/SORT/PAGINATE
    // ==========================================
    async function loadAllResults() {
        if (resultsTableBody) {
            resultsTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-5 text-muted">
                        <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                        Loading student assessment results...
                    </td>
                </tr>
            `;
        }

        try {
            const res = await fetch("/api/student/results/all?page=0&size=1000", { headers: getAuthHeaders() });
            if (!res.ok) throw new Error("Failed to load results");

            const data = await res.json();
            allResults = Array.isArray(data) ? data : (data?.content || []);

            updateTopStatistics();
            applyFilterAndRender();

        } catch (err) {
            console.error("Error loading results:", err);
            allResults = [];
            filteredResults = [];
            if (resultsTableBody) {
                resultsTableBody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center py-5 text-danger">
                            <i class="bi bi-exclamation-triangle-fill fs-4 d-block mb-2"></i>
                            Unable to load assessment results from server.
                        </td>
                    </tr>
                `;
            }
            if (emptyResults) emptyResults.style.display = "none";
            if (paginationRow) paginationRow.style.display = "none";
        }
    }

    function applyFilterAndRender() {
        const search = (searchInput?.value || "").trim().toLowerCase();
        const scoreTier = scoreTierFilter?.value || "all";
        const sortBy = sortFilter?.value || "newest";

        // 1. Filter
        filteredResults = allResults.filter(r => {
            // Filter by testId
            if (selectedTestId != null) {
                const rTestId = r.testId != null ? Number(r.testId) : null;
                if (rTestId !== Number(selectedTestId)) {
                    return false;
                }
            }

            // Filter by search
            if (search) {
                const name = (r.studentName || "").toLowerCase();
                const email = (r.studentEmail || "").toLowerCase();
                const careerName = getCareerString(r).toLowerCase();
                const test = (r.testName || "").toLowerCase();
                if (!name.includes(search) && !email.includes(search) && !careerName.includes(search) && !test.includes(search)) {
                    return false;
                }
            }

            // Filter by score tier
            const score = Number(r.totalScore ?? 0);
            if (scoreTier === "distinction" && score < 80) return false;
            if (scoreTier === "first_class" && (score < 60 || score >= 80)) return false;
            if (scoreTier === "average" && (score < 40 || score >= 60)) return false;
            if (scoreTier === "low" && score >= 40) return false;

            return true;
        });

        // 2. Sort
        filteredResults.sort((a, b) => {
            const scoreA = Number(a.totalScore ?? 0);
            const scoreB = Number(b.totalScore ?? 0);
            const timeA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
            const timeB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
            const nameA = (a.studentName || "").toLowerCase();
            const nameB = (b.studentName || "").toLowerCase();

            if (sortBy === "score_desc") return scoreB - scoreA;
            if (sortBy === "score_asc") return scoreA - scoreB;
            if (sortBy === "oldest") return timeA - timeB;
            if (sortBy === "name_asc") return nameA.localeCompare(nameB);
            // Default: newest first
            return timeB - timeA;
        });

        // 3. Paginate
        const totalItems = filteredResults.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

        if (currentPage >= totalPages) {
            currentPage = Math.max(0, totalPages - 1);
        }
        if (currentPage < 0) {
            currentPage = 0;
        }

        const start = currentPage * pageSize;
        const end = Math.min(start + pageSize, totalItems);
        const pageItems = filteredResults.slice(start, end);

        updateResultsHeader(totalItems);
        renderResultsTable(pageItems, start);
        renderPagination(currentPage, totalPages, totalItems);
    }

    function updateResultsHeader(totalItems) {
        // Do not create separate header for each test - keep section title as All Assessment Results
        setText("resultsHeading", "All Assessment Results");
        if (selectedTestId != null) {
            const test = testsSummaryList.find(t => String(t.testId) === String(selectedTestId));
            const testName = test?.testName || `Test #${selectedTestId}`;
            setText("resultsSubheading", `Showing results filtered by ${testName} (Test #${selectedTestId}).`);
        } else {
            setText("resultsSubheading", "Detailed student scores, recommendation breakdown, and completion history.");
        }

        if (totalResultsBadge) {
            totalResultsBadge.textContent = `${totalItems} ${totalItems === 1 ? 'Result' : 'Results'}`;
        }

        const filterPillContainer = document.getElementById("activeFilterPillContainer");
        if (filterPillContainer) {
            if (selectedTestId != null) {
                const test = testsSummaryList.find(t => String(t.testId) === String(selectedTestId));
                const testName = test?.testName || `Test #${selectedTestId}`;
                filterPillContainer.innerHTML = `
                    <span class="badge bg-primary text-white d-inline-flex align-items-center gap-1 px-2.5 py-1.5 rounded-pill shadow-sm" style="font-size: 11.5px; font-weight: 600;">
                        <i class="bi bi-funnel-fill"></i> ${escapeHtml(testName)}
                        <button type="button" class="btn-close btn-close-white ms-1" style="font-size: 8px;" onclick="window.selectTestFromCard(null)" title="Clear filter" aria-label="Clear filter"></button>
                    </span>
                `;
                filterPillContainer.style.display = "inline-flex";
            } else {
                filterPillContainer.innerHTML = "";
                filterPillContainer.style.display = "none";
            }
        }
    }

    function renderResultsTable(results, startIndex) {
        if (!resultsTableBody) return;

        if (results.length === 0) {
            resultsTableBody.innerHTML = "";
            if (resultsTableWrapper) resultsTableWrapper.style.display = "none";
            if (emptyResults) {
                emptyResults.style.display = "block";
                if (emptyResultsText) {
                    if (selectedTestId != null) {
                        emptyResultsText.textContent = `No students have completed Test #${selectedTestId} yet.`;
                    } else {
                        emptyResultsText.textContent = "No assessment results match your search or filter criteria.";
                    }
                }
            }
            if (paginationRow) paginationRow.style.display = "none";
            return;
        }

        if (emptyResults) emptyResults.style.display = "none";
        if (resultsTableWrapper) resultsTableWrapper.style.display = "block";

        resultsTableBody.innerHTML = results.map((r, idx) => {
            const rowIndex = startIndex + idx + 1;
            const name = r.studentName || "Student";
            const email = r.studentEmail || "-";
            const initial = name.charAt(0).toUpperCase();
            const testTitle = r.testName || (r.testId ? `Test #${r.testId}` : "Assessment");
            const career = getCareerString(r);
            const totScore = Number(r.totalScore ?? 0);
            const completed = formatDate(r.completedAt);

            // Score badge color
            let badgeClass = "score-badge-low";
            let progressBg = "bg-warning";
            if (totScore >= 80) {
                badgeClass = "score-badge-high";
                progressBg = "bg-success";
            } else if (totScore >= 60) {
                badgeClass = "score-badge-mid";
                progressBg = "bg-primary";
            }

            return `
                <tr>
                    <td class="ps-4 fw-semibold text-muted">${rowIndex}</td>
                    <td>
                        <div>
                            <strong class="text-dark d-block fw-bold" style="font-size: 13.5px;">${escapeHtml(name)}</strong>
                            <span class="text-muted small" style="font-size: 11px;">ID: #${r.studentId || r.resultId || '-'}</span>
                        </div>
                    </td>
                    <td>
                        <span class="text-secondary small">${escapeHtml(email)}</span>
                    </td>
                    <td>
                        <span class="badge-test-pill">
                            <i class="bi bi-file-earmark-check text-primary"></i> ${escapeHtml(testTitle)}
                        </span>
                    </td>
                    <td>
                        <span class="badge-career-pill">
                            <i class="bi bi-award-fill"></i> ${escapeHtml(career)}
                        </span>
                    </td>
                    <td>
                        <div class="score-progress-wrapper">
                            <div class="d-flex align-items-center justify-content-between mb-1">
                                <span class="score-badge-custom ${badgeClass}">${totScore}%</span>
                                <small class="text-muted fw-semibold" style="font-size: 10.5px;">
                                    ${totScore >= 80 ? 'Distinction' : totScore >= 60 ? 'First Class' : 'Average'}
                                </small>
                            </div>
                            <div class="progress" style="height: 5px;">
                                <div class="progress-bar ${progressBg}" role="progressbar" style="width: ${Math.min(100, Math.max(0, totScore))}%;" aria-valuenow="${totScore}" aria-valuemin="0" aria-valuemax="100"></div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="text-muted small text-nowrap">${completed}</span>
                    </td>
                </tr>
            `;
        }).join("");
    }

    // ==========================================
    // 3. RESPONSIVE PAGINATION
    // ==========================================
    function renderPagination(page, totalPages, totalElements) {
        if (!paginationRow) return;

        if (totalElements === 0) {
            paginationRow.style.display = "none";
            return;
        }

        paginationRow.style.display = "flex";

        if (paginationInfo) {
            const start = totalElements === 0 ? 0 : page * pageSize + 1;
            const end = Math.min((page + 1) * pageSize, totalElements);
            paginationInfo.textContent = `Showing ${start} to ${end} of ${totalElements} entries`;
        }

        if (!paginationControls) return;

        if (totalPages <= 1) {
            paginationControls.innerHTML = "";
            return;
        }

        let html = `
            <button type="button" class="pagination-btn" ${page === 0 ? "disabled" : ""} onclick="window.loadResultsPage(0)" title="First Page">
                <i class="bi bi-chevron-double-left"></i>
            </button>
            <button type="button" class="pagination-btn" ${page === 0 ? "disabled" : ""} onclick="window.loadResultsPage(${page - 1})" title="Previous Page">
                <i class="bi bi-chevron-left"></i>
            </button>
        `;

        for (let i = 0; i < totalPages; i++) {
            if (i === 0 || i === totalPages - 1 || (i >= page - 1 && i <= page + 1)) {
                html += `
                    <button type="button" class="pagination-btn ${i === page ? "active" : ""}" onclick="window.loadResultsPage(${i})">
                        ${i + 1}
                    </button>
                `;
            } else if (i === page - 2 || i === page + 2) {
                html += `<span class="px-1 text-muted">...</span>`;
            }
        }

        html += `
            <button type="button" class="pagination-btn" ${page >= totalPages - 1 ? "disabled" : ""} onclick="window.loadResultsPage(${page + 1})" title="Next Page">
                <i class="bi bi-chevron-right"></i>
            </button>
            <button type="button" class="pagination-btn" ${page >= totalPages - 1 ? "disabled" : ""} onclick="window.loadResultsPage(${totalPages - 1})" title="Last Page">
                <i class="bi bi-chevron-double-right"></i>
            </button>
        `;

        paginationControls.innerHTML = html;
    }

    window.loadResultsPage = function (page) {
        if (page < 0) return;
        const totalPages = Math.max(1, Math.ceil(filteredResults.length / pageSize));
        if (page >= totalPages) return;
        currentPage = page;
        applyFilterAndRender();
        scrollToResults();
    };

    function scrollToResults() {
        if (resultsSection) {
            resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }

    // ==========================================
    // 4. STUDENT PROFILE MODAL
    // ==========================================
    window.viewStudentProfileModal = function (resultIdOrIdx) {
        const item = allResults.find(r => r.resultId === resultIdOrIdx) || filteredResults[resultIdOrIdx] || allResults[0];
        if (!item) return;

        const name = item.studentName || "Student";
        const email = item.studentEmail || "-";
        const initial = name.charAt(0).toUpperCase();
        const testTitle = item.testName || (item.testId ? `Test #${item.testId}` : "Assessment");
        const career = getCareerString(item);
        const score = Number(item.totalScore ?? 0);
        const completed = formatDate(item.completedAt);

        setText("modalStudentName", name);
        setText("modalAvatar", initial);
        setText("modalStudentEmail", email);
        setText("modalTestTitle", testTitle);
        setText("modalScoreBadge", `${score}%`);
        setText("modalRecommendedCareer", career);
        setText("modalCompletedAt", completed);

        const viewStudentBtn = document.getElementById("modalViewFullStudentBtn");
        if (viewStudentBtn && item.studentId) {
            viewStudentBtn.href = `student-details.html?id=${item.studentId}`;
        }

        // Show Bootstrap Modal
        const modalEl = document.getElementById("careerProfileModal");
        if (modalEl && window.bootstrap) {
            const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
            modal.show();
        }
    };

    // ==========================================
    // 5. HELPERS
    // ==========================================
    function getCareerString(r) {
        if (!r) return "Career Pathway";
        if (typeof r.recommendedCareer === 'object' && r.recommendedCareer !== null) {
            return r.recommendedCareer.careerName || r.recommendedCareer.name || "Career Evaluation";
        }
        if (typeof r.recommendedCareer === 'string' && r.recommendedCareer.trim()) {
            return r.recommendedCareer;
        }
        if (r.careerName && r.careerName.trim()) {
            return r.careerName;
        }
        const cat = r.highestCategory || r.category || "";
        if (cat) {
            const catUpper = cat.trim().toUpperCase();
            if (catUpper === "DATA_SCIENCE") return "Data Scientist & ML Engineer";
            if (catUpper === "AI_MACHINE_LEARNING") return "AI & Machine Learning Engineer";
            if (catUpper === "SOFTWARE_ENGINEERING") return "Software Engineer";
            if (catUpper === "WEB_DEVELOPMENT") return "Full Stack Web Developer";
            if (catUpper === "CYBER_SECURITY") return "Cybersecurity Analyst";
            if (catUpper === "CLOUD_COMPUTING") return "Cloud Solutions Architect";
            if (catUpper === "DEVOPS_ENGINEERING") return "DevOps Engineer";
            if (catUpper === "MOBILE_DEVELOPMENT") return "Mobile App Developer";
            return formatCategory(catUpper);
        }
        return "Career Evaluation";
    }

    function formatCategory(cat) {
        if (!cat) return "Career Pathway";
        return String(cat).replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    }

    function formatDate(value) {
        if (!value) return "-";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleDateString("en-IN", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
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