document.addEventListener(
    "DOMContentLoaded",
    function () {

        const container = document.getElementById("studentsContainer");
        const emptyState = document.getElementById("emptyStudents");
        const searchInput = document.getElementById("studentSearch");
        const refreshButton = document.getElementById("refreshStudentsBtn");

        let students = [];
        let currentPage = 0;
        const pageSize = 12;

        loadStudents();

        searchInput?.addEventListener("input", function () {
            renderStudents();
        });

        refreshButton?.addEventListener("click", function () {
            loadStudents();
        });

        function getAuthHeaders() {
            const token = localStorage.getItem("token") || localStorage.getItem("adminToken");

            if (!token) {
                console.error("JWT token not found.");
                if (window.AppToast) {
                    window.AppToast.error("Your login session has expired. Please login again.");
                }
                setTimeout(() => { window.location.href = "admin-login.html"; }, 1500);
                return null;
            }

            return {
                "Accept": "application/json",
                "Authorization": "Bearer " + token
            };
        }

        async function loadStudents() {
            if (refreshButton) {
                refreshButton.disabled = true;
            }
            showLoading();

            try {
                const headers = getAuthHeaders();
                if (!headers) return;

                const response = await fetch("/api/admin/students", {
                    method: "GET",
                    headers: headers
                });

                if (response.status === 401 || response.status === 403) {
                    if (window.AppToast) {
                        window.AppToast.error("Admin authorization failed. Please login again.");
                    }
                    setTimeout(() => { window.location.href = "admin-login.html"; }, 1500);
                    return;
                }

                if (!response.ok) {
                    throw new Error("Unable to load students. HTTP " + response.status);
                }

                const data = await response.json();

                if (Array.isArray(data)) {
                    students = data;
                } else if (data && Array.isArray(data.students)) {
                    students = data.students;
                } else if (data && Array.isArray(data.content)) {
                    students = data.content;
                } else {
                    students = [];
                }

                updateStatistics();
                renderStudents();

            } catch (error) {
                console.error("Student loading error:", error);
                students = [];
                updateStatistics();

                if (container) {
                    container.innerHTML = `
                        <div class="empty-state">
                            <i class="bi bi-exclamation-triangle"></i>
                            <h3>Unable to load students</h3>
                            <p>${escapeHtml(error.message)}</p>
                            <button type="button" id="retryStudentsBtn" class="btn btn-primary">
                                <i class="bi bi-arrow-clockwise"></i> Retry
                            </button>
                        </div>
                    `;

                    document.getElementById("retryStudentsBtn")?.addEventListener("click", loadStudents);
                }
            } finally {
                if (refreshButton) {
                    refreshButton.disabled = false;
                }
            }
        }

        function updateStatistics() {
            setText("totalStudents", students.length);

            let tested = 0;
            let attempts = 0;
            let completed = 0;

            students.forEach(function (student) {
                const totalAtt = student.testsAttempted || 0;
                const totalComp = student.testsCompleted || 0;

                if (totalAtt > 0) tested++;
                attempts += totalAtt;
                completed += totalComp;
            });

            setText("studentsTested", tested);
            setText("totalAttempts", attempts);
            setText("completedTests", completed);
        }

        function renderStudents() {
            if (!container) return;

            const search = searchInput?.value?.toLowerCase()?.trim() || "";

            const filtered = students.filter(function (student) {
                const name = String(student.name || "").toLowerCase();
                const email = String(student.email || "").toLowerCase();
                const course = String(student.course || "").toLowerCase();

                return (!search || name.includes(search) || email.includes(search) || course.includes(search));
            });

            container.innerHTML = "";

            if (filtered.length === 0) {
                if (emptyState) {
                    emptyState.hidden = false;
                }
                return;
            }

            if (emptyState) {
                emptyState.hidden = true;
            }

            filtered.forEach(function (student) {
                container.appendChild(createStudentCard(student));
            });
        }

        function createStudentCard(student) {
            const card = document.createElement("div");
            card.className = "student-card";

            const id = student.id ?? student.userId ?? "";
            const name = student.name || "Unknown Student";
            const email = student.maskedEmail || student.email || "-";
            const mobile = student.mobile || "Not provided";
            const course = student.course || "General Studies";
            const percentage = student.percentage ? `${student.percentage}%` : "N/A";
            const recommendation = student.latestRecommendation || "Not assessed yet";

            card.innerHTML = `
                <div class="student-avatar">
                    <i class="bi bi-person"></i>
                </div>

                <div style="flex: 1;">
                    <strong>${escapeHtml(name)}</strong>
                    <p style="margin-bottom: 6px; color: #64748b; font-size: 0.875rem;">
                        <i class="bi bi-envelope"></i> ${escapeHtml(email)}
                    </p>

                    <div class="student-card-meta">
                        <span><i class="bi bi-telephone"></i> ${escapeHtml(String(mobile))}</span>
                        <span><i class="bi bi-book"></i> ${escapeHtml(String(course))}</span>
                        <span><i class="bi bi-percent"></i> ${escapeHtml(String(percentage))}</span>
                        <span class="badge" style="background:#e0e7ff; color:#4361ee; padding:2px 8px; border-radius:12px;">
                            <i class="bi bi-award"></i> ${escapeHtml(recommendation)}
                        </span>
                    </div>
                </div>

                <div class="student-card-actions" style="display:flex; gap:8px; align-items:center;">
                    <a href="student-details.html?id=${encodeURIComponent(id)}" class="btn btn-secondary btn-sm" title="View details">
                        <i class="bi bi-eye"></i> View
                    </a>
                    <button type="button" class="btn btn-danger btn-sm delete-student-btn" data-id="${id}" data-name="${escapeHtml(name)}" title="Delete student">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            `;

            card.querySelector(".delete-student-btn")?.addEventListener("click", async function () {
                const studentId = this.dataset.id;
                const studentName = this.dataset.name;

                let confirmed = false;
                if (window.AppModal) {
                    confirmed = await window.AppModal.confirm({
                        title: "Delete Student",
                        message: `Are you sure you want to delete student <strong>${studentName}</strong>? All their test attempts and assessment records will be removed.`,
                        confirmText: "Delete Account",
                        cancelText: "Cancel",
                        type: "danger"
                    });
                } else {
                    confirmed = confirm(`Delete student ${studentName}?`);
                }

                if (!confirmed) return;

                try {
                    const headers = getAuthHeaders();
                    const res = await fetch(`/api/admin/students/${studentId}`, {
                        method: "DELETE",
                        headers: headers
                    });

                    if (!res.ok) throw new Error("Failed to delete student");

                    if (window.AppToast) {
                        window.AppToast.success(`Student ${studentName} deleted successfully`);
                    }
                    loadStudents();
                } catch (e) {
                    if (window.AppToast) {
                        window.AppToast.error(e.message || "Could not delete student");
                    }
                }
            });

            return card;
        }

        function showLoading() {
            if (!container) return;
            if (emptyState) emptyState.hidden = true;
            container.innerHTML = `
                <div class="loading">
                    <i class="bi bi-arrow-repeat"></i> Loading students...
                </div>
            `;
        }

        function setText(id, value) {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value ?? 0;
            }
        }

        function escapeHtml(value) {
            const div = document.createElement("div");
            div.textContent = value ?? "";
            return div.innerHTML;
        }
    }
);