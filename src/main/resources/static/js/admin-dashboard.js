/**
 * Career Path Adviser - Admin Dashboard Script
 * Handles live metrics fetching, Career Path distribution analytics,
 * Quick Actions, Recent Students table, and the Student Career Profile Modal.
 */

document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    let cachedStudents = [];

    // ==========================================
    // INITIAL LOAD
    // ==========================================
    displayCurrentDate();
    loadAdminUser();
    tryApplyPrefetchedAdminData();
    loadDashboardStats();
    loadRecentUsers();

    // ==========================================
    // PREFETCH APPLICATION (FROM LOGIN TIME)
    // ==========================================
    function tryApplyPrefetchedAdminData() {
        try {
            const raw = sessionStorage.getItem("adminDashboardPrefetch");
            if (!raw) return;
            const prefetch = JSON.parse(raw);
            if (!prefetch) return;

            if (prefetch.stats) {
                setText("statTotalUsers", prefetch.stats.totalStudents ?? 0);
                setText("statTotalTests", prefetch.stats.totalTests ?? 0);
                setText("statActiveTests", prefetch.stats.activeTests ?? 0);
                setText("statTotalCareerPaths", prefetch.stats.totalCareerPaths ?? 0);
            }

            if (Array.isArray(prefetch.students) && prefetch.students.length > 0) {
                cachedStudents = prefetch.students;
                renderRecentUsers(prefetch.students.slice(0, 8));
            }
        } catch (e) {
            console.warn("Could not apply admin prefetch:", e);
        }
    }

    // ==========================================
    // DATE DISPLAY
    // ==========================================
    function displayCurrentDate() {
        const dateEl = document.getElementById("currentDateDisplay");
        if (!dateEl) return;

        try {
            const today = new Date();
            const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
            dateEl.textContent = today.toLocaleDateString('en-US', options);
        } catch (e) {
            dateEl.textContent = "Today";
        }
    }

    // ==========================================
    // ADMIN PROFILE INFO
    // ==========================================
    function loadAdminUser() {
        let user = null;
        const adminUser = localStorage.getItem("adminUser") || localStorage.getItem("user");
        if (adminUser) {
            try { user = JSON.parse(adminUser); } catch (e) {}
        }

        const name = localStorage.getItem("adminName") || user?.name || "Administrator";
        setText("adminName", name);
        setText("topbarAdminName", name);
    }

    // ==========================================
    // LOAD DASHBOARD METRICS
    // ==========================================
    async function loadDashboardStats() {
        try {
            const headers = getAuthHeaders();
            const res = await fetch("/api/admin/students/dashboard-stats", {
                method: "GET",
                headers: headers
            });

            if (res.ok) {
                const data = await res.json();
                setText("statTotalUsers", data.totalStudents ?? 0);
                setText("statTotalTests", data.totalTests ?? 0);
                setText("statActiveTests", data.activeTests ?? 0);
                setText("statTotalCareerPaths", data.totalCareerPaths ?? 0);

                // Update session cache
                updatePrefetchCache("stats", data);
            } else if (res.status === 401 || res.status === 403) {
                handleAuthError();
            } else {
                renderDefaultStats();
            }
        } catch (err) {
            console.warn("Could not load dashboard stats:", err);
            renderDefaultStats();
        }
    }

    function renderDefaultStats() {
        setText("statTotalUsers", 0);
        setText("statTotalTests", 0);
        setText("statActiveTests", 0);
        setText("statTotalCareerPaths", 0);
    }

    // ==========================================
    // LOAD RECENT STUDENTS TABLE
    // ==========================================
    async function loadRecentUsers() {
        const tbody = document.getElementById("recentUsersTableBody");
        if (!tbody) return;

        try {
            const headers = getAuthHeaders();
            const res = await fetch("/api/admin/students", {
                method: "GET",
                headers: headers
            });

            if (res.ok) {
                const data = await res.json();
                let students = Array.isArray(data) ? data : (data?.content || []);

                // Sort newest registered first
                students.sort((a, b) => (b.id || 0) - (a.id || 0));

                cachedStudents = students;

                // Update session cache
                updatePrefetchCache("students", students);

                if (students.length === 0) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="5" style="text-align: center; padding: 24px; color: #94a3b8;">
                                No students registered yet.
                            </td>
                        </tr>
                    `;
                    return;
                }

                renderRecentUsers(students.slice(0, 8));
            } else if (res.status === 401 || res.status === 403) {
                handleAuthError();
            } else {
                renderErrorRow("Unable to load recent students from server.");
            }
        } catch (err) {
            console.warn("Error fetching students:", err);
            renderErrorRow("Could not connect to server to fetch students.");
        }
    }

    function updatePrefetchCache(key, val) {
        try {
            let current = {};
            const raw = sessionStorage.getItem("adminDashboardPrefetch");
            if (raw) current = JSON.parse(raw) || {};
            current[key] = val;
            current.timestamp = Date.now();
            sessionStorage.setItem("adminDashboardPrefetch", JSON.stringify(current));
        } catch (e) {}
    }

    function renderErrorRow(msg) {
        const tbody = document.getElementById("recentUsersTableBody");
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 24px; color: #ef4444;">
                        <i class="bi bi-exclamation-circle"></i> ${escapeHtml(msg)}
                    </td>
                </tr>
            `;
        }
    }

    function renderRecentUsers(students) {
        const tbody = document.getElementById("recentUsersTableBody");
        if (!tbody) return;

        tbody.innerHTML = students.map(student => {
            const initial = (student.name || "S").charAt(0).toUpperCase();
            const email = student.email || student.maskedEmail || "-";
            const name = student.name || "Student";
            const role = student.role || "STUDENT";
            const course = student.education || student.course || "-";

            let statusBadge = '';
            let rec = student.latestRecommendation || "";
            if (rec && rec.toLowerCase() !== "not yet assessed" && rec.toLowerCase() !== "assessed") {
                if (rec.includes("_")) {
                    rec = rec.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
                }
                const isNotFound = rec.toLowerCase() === "career not found";
                statusBadge = `
                    <span style="display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 9999px; background: ${isNotFound ? '#fef3c7' : '#ecfdf5'}; color: ${isNotFound ? '#b45309' : '#059669'}; font-size: 11.5px; font-weight: 700; border: 1px solid ${isNotFound ? '#fde68a' : '#a7f3d0'};">
                        <i class="bi ${isNotFound ? 'bi-exclamation-triangle-fill' : 'bi-stars'}"></i> ${escapeHtml(rec)}
                    </span>
                `;
            } else if (student.testsCompleted && student.testsCompleted > 0) {
                statusBadge = `
                    <span style="display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 9999px; background: #ecfdf5; color: #059669; font-size: 11.5px; font-weight: 700;">
                        <i class="bi bi-check-circle-fill"></i> Completed
                    </span>
                `;
            } else if (student.testsAttempted && student.testsAttempted > 0) {
                statusBadge = `
                    <span style="display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 9999px; background: #fffbeb; color: #d97706; font-size: 11.5px; font-weight: 700;">
                        <i class="bi bi-hourglass-split"></i> In Progress
                    </span>
                `;
            } else {
                statusBadge = `
                    <span style="display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 9999px; background: #eff6ff; color: #2563eb; font-size: 11.5px; font-weight: 700;">
                        <i class="bi bi-person-check-fill"></i> Registered
                    </span>
                `;
            }

            return `
                <tr>
                    <td>
                        <div class="user-cell d-flex align-items-center gap-2">
                            <div class="avatar-initial">
                                ${initial}
                            </div>
                            <div class="user-info-text text-truncate" style="max-width: 170px;">
                                <strong class="d-block text-dark text-truncate" style="font-size: 0.85rem;">${escapeHtml(name)}</strong>
                                <span class="text-muted" style="font-size: 0.72rem;">${escapeHtml(role)}</span>
                            </div>
                        </div>
                    </td>
                    <td class="text-muted" style="font-size: 0.82rem;">${escapeHtml(email)}</td>
                    <td class="text-dark fw-medium" style="font-size: 0.82rem;">${escapeHtml(course)}</td>
                    <td>${statusBadge}</td>
                    <td class="text-end text-nowrap">
                        <button type="button" class="btn btn-sm btn-light border text-primary fw-semibold rounded-pill px-3 py-1 me-1" onclick="openCareerProfileModal(${student.id})" style="font-size: 0.78rem;">
                            <i class="bi bi-person-badge"></i> Profile
                        </button>
                        <a href="student-details.html?id=${encodeURIComponent(student.id)}" class="btn btn-sm btn-outline-secondary fw-semibold rounded-pill px-3 py-1" style="font-size: 0.78rem;">
                            <i class="bi bi-eye"></i> Details
                        </a>
                    </td>
                </tr>
            `;
        }).join("");
    }

    // ==========================================
    // CAREER PROFILE MODAL
    // ==========================================
    window.openCareerProfileModal = async function (studentId) {
        let student = cachedStudents.find(s => s.id === studentId || s.id == studentId);

        if (!student) {
            try {
                const headers = getAuthHeaders();
                const res = await fetch(`/api/admin/students/${studentId}`, { headers });
                if (res.ok) {
                    student = await res.json();
                }
            } catch (e) {
                console.warn("Could not load student profile:", e);
            }
        }

        if (!student) {
            if (window.AppToast) window.AppToast.error("Student profile not found.");
            return;
        }

        const name = student.name || "Student Profile";
        const email = student.email || student.maskedEmail || "Not provided";
        const education = student.education || student.course || "Not specified";

        let assessmentStatus = "Not yet started";
        let statusBtnText = "Assessment Pending";
        if (student.testsCompleted && student.testsCompleted > 0) {
            const rec = student.latestRecommendation || "Completed";
            assessmentStatus = `COMPLETED (Recommended: ${rec})`;
            statusBtnText = `Recommended Career: ${rec}`;
        } else if (student.testsAttempted && student.testsAttempted > 0) {
            assessmentStatus = `IN PROGRESS (${student.testsAttempted} tests attempted)`;
            statusBtnText = "Assessment In Progress";
        }

        setText("modalStudentName", name);
        setText("modalStudentEmail", email);
        setText("modalEducation", education);
        setText("modalAssessmentStatus", assessmentStatus);
        setText("modalStatusBtnText", statusBtnText);

        const detailsLink = document.getElementById("modalViewFullDetailsBtn");
        if (detailsLink) {
            detailsLink.href = `student-details.html?id=${encodeURIComponent(student.id)}`;
        }

        const modal = document.getElementById("careerProfileModal");
        if (modal) {
            modal.classList.add("active");
            document.body.style.overflow = "hidden";
        }
    };

    window.closeCareerProfileModal = function () {
        const modal = document.getElementById("careerProfileModal");
        if (modal) {
            modal.classList.remove("active");
            document.body.style.overflow = "";
        }
    };

    // Close on backdrop click
    const modalBackdrop = document.getElementById("careerProfileModal");
    modalBackdrop?.addEventListener("click", function (e) {
        if (e.target === modalBackdrop) {
            closeCareerProfileModal();
        }
    });

    // Close on ESC key
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
            closeCareerProfileModal();
        }
    });

    // ==========================================
    // HELPERS & AUTH
    // ==========================================
    function handleAuthError() {
        if (window.AppToast) {
            window.AppToast.error("Admin session has expired. Please sign in again.");
        }
        setTimeout(() => {
            window.location.href = "admin-login.html";
        }, 1200);
    }

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

    function setText(id, val) {
        const el = document.getElementById(id);
        if (el) el.textContent = val ?? "";
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