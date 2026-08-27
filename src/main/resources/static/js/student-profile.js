document.addEventListener("DOMContentLoaded", () => {

    const sidebar = document.getElementById("studentSidebar");
    const menuBtn = document.getElementById("studentMenuBtn");
    const logoutBtn = document.getElementById("studentLogout");

    const profileForm = document.getElementById("studentProfileForm");
    const passwordForm = document.getElementById("studentPasswordForm");
    const saveProfileBtn = document.getElementById("saveProfileBtn");
    const updatePasswordBtn = document.getElementById("updatePasswordBtn");

    const nameInput = document.getElementById("studentNameInput");
    const emailInput = document.getElementById("studentEmailInput");
    const mobileInput = document.getElementById("studentMobileInput");
    const courseInput = document.getElementById("studentCourseInput");
    const percentageInput = document.getElementById("studentPercentageInput");

    const heroName = document.getElementById("heroStudentName");
    const heroEmail = document.getElementById("heroStudentEmail");
    const heroCourseBadge = document.getElementById("heroCourseBadge");
    const sidebarName = document.getElementById("studentName");
    const sidebarEmail = document.getElementById("studentEmail");

    if (menuBtn && sidebar) {
        menuBtn.addEventListener("click", () => sidebar.classList.toggle("open"));
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.removeItem("studentToken");
            localStorage.removeItem("token");
            window.location.href = "/student-login.html";
        });
    }

    loadProfile();
    setupPasswordToggles();

    profileForm?.addEventListener("submit", handleSaveProfile);
    passwordForm?.addEventListener("submit", handleUpdatePassword);

    function getAuthHeaders() {
        const token = localStorage.getItem("studentToken") || localStorage.getItem("token");
        return {
            "Accept": "application/json",
            "Content-Type": "application/json",
            ...(token ? { "Authorization": "Bearer " + token } : {})
        };
    }

    async function loadProfile() {
        const cachedName = localStorage.getItem("studentName") || localStorage.getItem("name") || "Student";
        const cachedEmail = localStorage.getItem("studentEmail") || localStorage.getItem("email") || "student@example.com";

        if (nameInput) nameInput.value = cachedName;
        if (emailInput) emailInput.value = cachedEmail;
        updateUI(cachedName, cachedEmail, "");

        try {
            const response = await fetch("/api/student/profile", {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                if (nameInput) nameInput.value = data.name || cachedName;
                if (emailInput) emailInput.value = data.email || cachedEmail;
                if (mobileInput) mobileInput.value = data.mobile || "";
                if (courseInput) courseInput.value = data.course || "";
                if (percentageInput) percentageInput.value = data.percentage || "";

                updateUI(data.name || cachedName, data.email || cachedEmail, data.course);

                if (data.name) localStorage.setItem("studentName", data.name);
                if (data.email) localStorage.setItem("studentEmail", data.email);
            }
        } catch (error) {
            console.warn("Could not fetch remote student profile, using cached data:", error);
        }
    }

    function updateUI(name, email, course) {
        if (heroName) heroName.textContent = name;
        if (heroEmail) heroEmail.textContent = email;
        if (sidebarName) sidebarName.textContent = name;
        if (sidebarEmail) sidebarEmail.textContent = email;
        if (heroCourseBadge) heroCourseBadge.textContent = "Course: " + (course || "General");
    }

    async function handleSaveProfile(event) {
        event.preventDefault();

        const name = nameInput?.value?.trim();
        const email = emailInput?.value?.trim();
        const mobile = mobileInput?.value?.trim();
        const course = courseInput?.value?.trim();
        const percentage = percentageInput?.value?.trim();

        if (!name || !email) {
            if (window.AppToast) window.AppToast.error("Name and Email are required.");
            return;
        }

        if (saveProfileBtn) saveProfileBtn.disabled = true;

        try {
            const response = await fetch("/api/student/profile", {
                method: "PUT",
                headers: getAuthHeaders(),
                body: JSON.stringify({ name, email, mobile, course, percentage })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => null);
                throw new Error(errData?.message || "Failed to update profile.");
            }

            const updated = await response.json();

            localStorage.setItem("studentName", updated.name);
            localStorage.setItem("studentEmail", updated.email);
            updateUI(updated.name, updated.email, updated.course);

            if (window.AppToast) {
                window.AppToast.success("Profile updated successfully!");
            }

        } catch (error) {
            console.error("Save student profile error:", error);
            if (window.AppToast) {
                window.AppToast.error(error.message || "Unable to save profile.");
            }
        } finally {
            if (saveProfileBtn) saveProfileBtn.disabled = false;
        }
    }

    async function handleUpdatePassword(event) {
        event.preventDefault();

        const currentPassword = document.getElementById("studentCurrentPass")?.value;
        const newPassword = document.getElementById("studentNewPass")?.value;
        const confirmPassword = document.getElementById("studentConfirmPass")?.value;

        if (!currentPassword || !newPassword || !confirmPassword) {
            if (window.AppToast) window.AppToast.error("All password fields are required.");
            return;
        }

        if (newPassword.length < 6) {
            if (window.AppToast) window.AppToast.error("New password must be at least 6 characters.");
            return;
        }

        if (newPassword !== confirmPassword) {
            if (window.AppToast) window.AppToast.error("New password and confirm password do not match.");
            return;
        }

        if (updatePasswordBtn) updatePasswordBtn.disabled = true;

        try {
            const response = await fetch("/api/student/profile/password", {
                method: "PUT",
                headers: getAuthHeaders(),
                body: JSON.stringify({ currentPassword, newPassword })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => null);
                throw new Error(errData?.message || "Failed to change password.");
            }

            passwordForm.reset();

            if (window.AppToast) {
                window.AppToast.success("Password changed successfully!");
            }

        } catch (error) {
            console.error("Change password error:", error);
            if (window.AppToast) {
                window.AppToast.error(error.message || "Unable to change password.");
            }
        } finally {
            if (updatePasswordBtn) updatePasswordBtn.disabled = false;
        }
    }

    function setupPasswordToggles() {
        document.querySelectorAll(".toggle-password").forEach(btn => {
            btn.addEventListener("click", () => {
                const targetId = btn.getAttribute("data-target");
                const input = document.getElementById(targetId);
                const icon = btn.querySelector("i");

                if (!input) return;

                if (input.type === "password") {
                    input.type = "text";
                    if (icon) {
                        icon.classList.remove("bi-eye");
                        icon.classList.add("bi-eye-slash");
                    }
                } else {
                    input.type = "password";
                    if (icon) {
                        icon.classList.remove("bi-eye-slash");
                        icon.classList.add("bi-eye");
                    }
                }
            });
        });
    }
});
