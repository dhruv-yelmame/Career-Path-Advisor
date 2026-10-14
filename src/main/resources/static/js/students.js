document.addEventListener(
    "DOMContentLoaded",
    function () {

        const container = document.getElementById("studentsContainer");
        const emptyState = document.getElementById("emptyStudents");
        const searchInput = document.getElementById("studentSearch");
        const paginationRow = document.getElementById("paginationRow");
        const paginationInfo = document.getElementById("paginationInfo");
        const paginationControls = document.getElementById("paginationControls");

        // Delete Modal Elements
        const deleteModal = document.getElementById("deleteStudentModal");
        const deleteStudentNameEl = document.getElementById("deleteStudentName");
        const confirmDeleteBtn = document.getElementById("confirmDeleteStudentBtn");
        const cancelDeleteBtn = document.getElementById("cancelDeleteStudentBtn");
        const closeDeleteBtn = document.getElementById("closeDeleteStudentModal");
        let currentDeleteStudentId = null;
        let currentDeleteStudentName = "";

        let students = [];
        let currentPage = 0;
        const pageSize = 6;

        loadStudents();

        searchInput?.addEventListener("input", function () {
            currentPage = 0;
            renderStudents();
        });

        function openDeleteModal(studentId, studentName) {
            currentDeleteStudentId = String(studentId);
            currentDeleteStudentName = studentName || "this student";
            if (deleteStudentNameEl) {
                deleteStudentNameEl.textContent = `"${currentDeleteStudentName}"`;
            }
            if (deleteModal) {
                deleteModal.classList.add("active");
                deleteModal.style.display = "flex";
            }
        }

        function closeDeleteModal() {
            currentDeleteStudentId = null;
            currentDeleteStudentName = "";
            if (deleteModal) {
                deleteModal.classList.remove("active");
                deleteModal.style.display = "none";
            }
            if (confirmDeleteBtn) {
                confirmDeleteBtn.disabled = false;
                confirmDeleteBtn.innerHTML = '<i class="bi bi-trash"></i> Confirm Delete';
            }
        }

        // Event delegation for delete buttons inside container
        container?.addEventListener("click", function (e) {
            const btn = e.target.closest(".delete-student-btn");
            if (btn) {
                e.preventDefault();
                e.stopPropagation();
                const studentId = btn.getAttribute("data-id") || btn.dataset.id;
                const studentName = btn.getAttribute("data-name") || btn.dataset.name;
                openDeleteModal(studentId, studentName);
            }
        });

        // Close modal handlers
        cancelDeleteBtn?.addEventListener("click", closeDeleteModal);
        closeDeleteBtn?.addEventListener("click", closeDeleteModal);
        deleteModal?.addEventListener("click", function (e) {
            if (e.target === deleteModal) closeDeleteModal();
        });
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && deleteModal?.classList.contains("active")) {
                closeDeleteModal();
            }
        });

        // Confirm delete action
        confirmDeleteBtn?.addEventListener("click", async function () {
            if (!currentDeleteStudentId) return;

            const studentId = currentDeleteStudentId;
            const studentName = currentDeleteStudentName;

            confirmDeleteBtn.disabled = true;
            confirmDeleteBtn.innerHTML = '<i class="bi bi-arrow-repeat" style="display:inline-block; animation:studentSpin 1s linear infinite;"></i> Deleting...';

            try {
                const headers = getAuthHeaders();
                if (!headers) {
                    closeDeleteModal();
                    return;
                }

                const res = await fetch(`/api/admin/students/${encodeURIComponent(studentId)}`, {
                    method: "DELETE",
                    headers: headers
                });

                if (!res.ok) {
                    let errMsg = "Failed to delete student (HTTP " + res.status + ")";
                    try {
                        const errData = await res.json();
                        if (errData && errData.message) errMsg = errData.message;
                    } catch (_) {
                        try {
                            const errText = await res.text();
                            if (errText) errMsg = errText;
                        } catch (__) {}
                    }
                    throw new Error(errMsg);
                }

                closeDeleteModal();

                if (window.AppToast) {
                    window.AppToast.success(`Student "${studentName}" deleted successfully`);
                }
                await loadStudents();
            } catch (e) {
                confirmDeleteBtn.disabled = false;
                confirmDeleteBtn.innerHTML = '<i class="bi bi-trash"></i> Confirm Delete';
                if (window.AppToast) {
                    window.AppToast.error(e.message || "Could not delete student");
                } else {
                    alert(e.message || "Could not delete student");
                }
            }
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
                const mobile = String(student.mobile || "").toLowerCase();

                return (!search || name.includes(search) || email.includes(search) || course.includes(search) || mobile.includes(search));
            });

            container.innerHTML = "";

            if (filtered.length === 0) {
                if (emptyState) emptyState.hidden = false;
                if (paginationRow) paginationRow.style.display = "none";
                return;
            }

            if (emptyState) emptyState.hidden = true;

            const totalPages = Math.ceil(filtered.length / pageSize);
            if (currentPage >= totalPages) {
                currentPage = Math.max(0, totalPages - 1);
            }

            const start = currentPage * pageSize;
            const end = Math.min(start + pageSize, filtered.length);
            const pageStudents = filtered.slice(start, end);

            pageStudents.forEach(function (student) {
                container.appendChild(createStudentCard(student));
            });

            renderPagination(currentPage, totalPages, filtered.length, start, end);
        }

        function renderPagination(page, totalPages, totalItems, start, end) {
            if (!paginationRow) return;

            if (totalItems === 0) {
                paginationRow.style.display = "none";
                return;
            }

            paginationRow.style.display = "flex";

            if (paginationInfo) {
                paginationInfo.textContent = `Showing ${start + 1} to ${end} of ${totalItems} students`;
            }

            if (!paginationControls) return;
            paginationControls.innerHTML = "";

            if (totalPages <= 1) {
                return;
            }

            // Previous Button
            const prevBtn = document.createElement("button");
            prevBtn.type = "button";
            prevBtn.className = "pagination-btn";
            prevBtn.innerHTML = '<i class="bi bi-chevron-left"></i>';
            prevBtn.disabled = page === 0;
            prevBtn.title = "Previous Page";
            prevBtn.addEventListener("click", () => {
                if (currentPage > 0) {
                    currentPage--;
                    renderStudents();
                    container.scrollIntoView({ behavior: "smooth", block: "nearest" });
                }
            });
            paginationControls.appendChild(prevBtn);

            // Page Buttons
            for (let i = 0; i < totalPages; i++) {
                const pageBtn = document.createElement("button");
                pageBtn.type = "button";
                pageBtn.className = `pagination-btn ${i === page ? "active" : ""}`;
                pageBtn.textContent = i + 1;
                pageBtn.addEventListener("click", () => {
                    currentPage = i;
                    renderStudents();
                    container.scrollIntoView({ behavior: "smooth", block: "nearest" });
                });
                paginationControls.appendChild(pageBtn);
            }

            // Next Button
            const nextBtn = document.createElement("button");
            nextBtn.type = "button";
            nextBtn.className = "pagination-btn";
            nextBtn.innerHTML = '<i class="bi bi-chevron-right"></i>';
            nextBtn.disabled = page >= totalPages - 1;
            nextBtn.title = "Next Page";
            nextBtn.addEventListener("click", () => {
                if (currentPage < totalPages - 1) {
                    currentPage++;
                    renderStudents();
                    container.scrollIntoView({ behavior: "smooth", block: "nearest" });
                }
            });
            paginationControls.appendChild(nextBtn);
        }

        function createStudentCard(student) {
            const card = document.createElement("div");
            card.className = "student-card";

            const id = student.id ?? student.userId ?? "";
            const name = student.name || "Unknown Student";
            const email = student.maskedEmail || student.email || "-";
            const mobile = student.mobile || "Not provided";
            const course = student.course || "General Studies";
            let recommendation = student.latestRecommendation || "Not assessed yet";
            if (recommendation.includes("_")) {
                recommendation = recommendation.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
            }

            card.innerHTML = `
                <div class="student-avatar">
                    <i class="bi bi-person"></i>
                </div>

                <div class="student-card-info">
                    <strong>${escapeHtml(name)}</strong>
                    <p>
                        <i class="bi bi-envelope"></i> ${escapeHtml(email)}
                    </p>

                    <div class="student-card-meta">
                        <span><i class="bi bi-telephone"></i> ${escapeHtml(String(mobile))}</span>
                        <span><i class="bi bi-book"></i> ${escapeHtml(String(course))}</span>
                        <span class="rec-badge">
                            <i class="bi bi-stars"></i> ${escapeHtml(recommendation)}
                        </span>
                    </div>
                </div>

                <div class="student-card-actions">
                    <a href="student-details.html?id=${encodeURIComponent(id)}" class="btn btn-secondary btn-sm" title="View details">
                        <i class="bi bi-eye"></i> View
                    </a>
                    <button type="button" class="btn btn-danger btn-sm delete-student-btn" data-id="${id}" data-name="${escapeHtml(name)}" title="Delete student">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            `;

            card.querySelector(".delete-student-btn")?.addEventListener("click", function () {
                const studentId = this.dataset.id;
                const studentName = this.dataset.name;
                openDeleteModal(studentId, studentName);
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