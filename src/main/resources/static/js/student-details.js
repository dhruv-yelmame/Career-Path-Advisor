document.addEventListener("DOMContentLoaded", () => {

    const params = new URLSearchParams(window.location.search);
    const studentId = params.get("id");

    if (!studentId) {
        if (window.AppToast) {
            window.AppToast.error("Student ID is missing.");
        }
        setTimeout(() => {
            window.location.href = "students.html";
        }, 1500);
        return;
    }

    loadStudentData();

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

    async function loadStudentData() {
        try {
            await Promise.all([
                loadStudentProfile(),
                loadStudentResults()
            ]);
        } catch (error) {
            console.error("Error loading student details:", error);
        }
    }

    async function loadStudentProfile() {
        const profileContainer = document.getElementById("studentProfile");

        try {
            const response = await fetch(`/api/admin/students/${encodeURIComponent(studentId)}`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error("Unable to load student profile.");
            }

            const student = await response.json();
            renderProfile(student);

            setText("testsAttempted", student.testsAttempted ?? 0);
            setText("testsCompleted", student.testsCompleted ?? 0);

        } catch (error) {
            console.error(error);
            if (profileContainer) {
                profileContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="bi bi-exclamation-triangle"></i>
                        <h3>Unable to load student profile</h3>
                        <p>${escapeHtml(error.message)}</p>
                    </div>
                `;
            }
        }
    }

    function renderProfile(student) {
        const profileContainer = document.getElementById("studentProfile");
        if (!profileContainer) return;

        const name = student.name || "Student";
        const email = student.email || student.maskedEmail || "-";
        const mobile = student.mobile || "Not provided";
        const course = student.course || "General Studies";
        const percentage = student.percentage ? `${student.percentage}%` : "N/A";
        const latestRec = student.latestRecommendation || "Not yet assessed";

        profileContainer.innerHTML = `
            <div style="display: flex; gap: 20px; align-items: center; flex-wrap: wrap;">
                <div class="profile-circle" style="width: 64px; height: 64px; font-size: 1.8rem; background: #edf4ff; color: #1268f3; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700;">
                    ${escapeHtml(name.charAt(0).toUpperCase())}
                </div>
                <div style="flex: 1; min-width: 240px;">
                    <h2 style="font-size: 1.5rem; margin-bottom: 4px;">${escapeHtml(name)}</h2>
                    <p style="color: #64748b; font-size: 0.95rem; margin-bottom: 10px;">
                        <i class="bi bi-envelope"></i> ${escapeHtml(email)} &bull; <i class="bi bi-telephone"></i> ${escapeHtml(mobile)}
                    </p>
                    <div style="display: flex; gap: 12px; flex-wrap: wrap; font-size: 0.875rem;">
                        <span style="background: #f1f5f9; padding: 4px 10px; border-radius: 6px;">
                            <strong>Course:</strong> ${escapeHtml(course)}
                        </span>
                        <span style="background: #f1f5f9; padding: 4px 10px; border-radius: 6px;">
                            <strong>Academic Score:</strong> ${escapeHtml(percentage)}
                        </span>
                        <span style="background: #e0e7ff; color: #4361ee; padding: 4px 10px; border-radius: 6px; font-weight: 600;">
                            <i class="bi bi-award"></i> ${escapeHtml(latestRec)}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }

    async function loadStudentResults() {
        const historyContainer = document.getElementById("studentTestHistory");
        const emptyHistory = document.getElementById("emptyTestHistory");
        const careerContainer = document.getElementById("studentCareerResults");
        const emptyCareer = document.getElementById("emptyCareerResults");

        try {
            const response = await fetch(`/api/student/results/student/${encodeURIComponent(studentId)}`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error("Unable to load student results.");
            }

            const data = await response.json();
            const results = Array.isArray(data) ? data : (data?.content || []);

            setText("careerResultCount", results.length);

            // Calculate best score
            if (results.length > 0) {
                const best = Math.max(...results.map(r => Number(r.totalScore || r.score || 0)));
                setText("bestScore", Number.isFinite(best) ? best : 0);
            } else {
                setText("bestScore", 0);
            }

            // Render Test History
            if (historyContainer) {
                historyContainer.innerHTML = "";
                if (results.length === 0) {
                    if (emptyHistory) emptyHistory.hidden = false;
                } else {
                    if (emptyHistory) emptyHistory.hidden = true;
                    results.forEach(res => {
                        const item = document.createElement("div");
                        item.className = "student-card";
                        item.style.marginBottom = "10px";
                        item.innerHTML = `
                            <div style="flex: 1;">
                                <strong>${escapeHtml(res.testName || "Assessment Test")}</strong>
                                <p style="font-size: 0.85rem; color: #64748b; margin-top: 4px;">
                                    Completed: ${formatDate(res.completedAt)} &bull; Recommended: <span style="color: #4361ee; font-weight: 600;">${escapeHtml(res.recommendedCareer || "None")}</span>
                                </p>
                            </div>
                            <div style="text-align: right;">
                                <strong style="font-size: 1.3rem; color: #1268f3;">${res.totalScore ?? res.score ?? 0}</strong>
                                <span style="display: block; font-size: 0.75rem; color: #64748b;">Score</span>
                            </div>
                        `;
                        historyContainer.appendChild(item);
                    });
                }
            }

            // Render Career Results
            if (careerContainer) {
                careerContainer.innerHTML = "";
                if (results.length === 0) {
                    if (emptyCareer) emptyCareer.hidden = false;
                } else {
                    if (emptyCareer) emptyCareer.hidden = true;
                    results.forEach(res => {
                        const card = document.createElement("div");
                        card.className = "panel";
                        card.style.borderLeft = "4px solid #1268f3";
                        card.style.marginBottom = "12px";
                        card.innerHTML = `
                            <h3 style="color: #1268f3; margin-bottom: 6px;">
                                <i class="bi bi-award"></i> ${escapeHtml(res.recommendedCareer || "Career Match")}
                            </h3>
                            <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 8px;">
                                Category: <strong>${escapeHtml(res.category || "General")}</strong> &bull; Total Score: <strong>${res.totalScore ?? res.score ?? 0}</strong>
                            </p>
                            <p style="font-size: 0.875rem;">
                                ${escapeHtml(res.description || res.careerDescription || "Career recommendation determined based on assessment score.")}
                            </p>
                        `;
                        careerContainer.appendChild(card);
                    });
                }
            }

        } catch (error) {
            console.error(error);
            if (historyContainer) {
                historyContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="bi bi-exclamation-triangle"></i>
                        <p>${escapeHtml(error.message)}</p>
                    </div>
                `;
            }
            if (careerContainer) {
                careerContainer.innerHTML = "";
            }
        }
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
});