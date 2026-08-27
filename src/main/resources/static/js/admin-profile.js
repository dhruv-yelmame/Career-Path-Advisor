document.addEventListener("DOMContentLoaded", () => {

    const profileForm = document.getElementById("profileForm");
    const passwordForm = document.getElementById("passwordForm");
    const saveProfileBtn = document.getElementById("saveProfileBtn");
    const updatePasswordBtn = document.getElementById("updatePasswordBtn");

    const nameInput = document.getElementById("adminNameInput");
    const emailInput = document.getElementById("adminEmailInput");
    const mobileInput = document.getElementById("adminMobileInput");

    const heroName = document.getElementById("heroAdminName");
    const heroEmail = document.getElementById("heroAdminEmail");
    const sidebarName = document.getElementById("sidebarAdminName");

    loadProfile();
    setupPasswordToggles();

    profileForm?.addEventListener("submit", handleSaveProfile);
    passwordForm?.addEventListener("submit", handleUpdatePassword);

    function getAuthHeaders() {
        const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
        return {
            "Accept": "application/json",
            "Content-Type": "application/json",
            ...(token ? { "Authorization": "Bearer " + token } : {})
        };
    }

    async function loadProfile() {
        // First populate from local storage for instant rendering
        const cachedName = localStorage.getItem("adminName") || localStorage.getItem("userName") || "Career Admin";
        const cachedEmail = localStorage.getItem("adminEmail") || localStorage.getItem("userEmail") || "admin@careerpath.com";

        if (nameInput) nameInput.value = cachedName;
        if (emailInput) emailInput.value = cachedEmail;
        updateUI(cachedName, cachedEmail);

        try {
            const response = await fetch("/api/admin/profile", {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                if (nameInput) nameInput.value = data.name || cachedName;
                if (emailInput) emailInput.value = data.email || cachedEmail;
                if (mobileInput) mobileInput.value = data.mobile || "";
                updateUI(data.name || cachedName, data.email || cachedEmail);

                // Update cache
                if (data.name) {
                    localStorage.setItem("adminName", data.name);
                    localStorage.setItem("userName", data.name);
                }
                if (data.email) {
                    localStorage.setItem("adminEmail", data.email);
                    localStorage.setItem("userEmail", data.email);
                }
            }
        } catch (error) {
            console.warn("Could not fetch remote profile, using cached data:", error);
        }
    }

    function updateUI(name, email) {
        if (heroName) heroName.textContent = name;
        if (heroEmail) heroEmail.textContent = email;
        if (sidebarName) sidebarName.textContent = name;
    }

    async function handleSaveProfile(event) {
        event.preventDefault();

        const name = nameInput?.value?.trim();
        const email = emailInput?.value?.trim();
        const mobile = mobileInput?.value?.trim();

        if (!name || !email) {
            if (window.AppToast) window.AppToast.error("Name and Email are required.");
            return;
        }

        if (saveProfileBtn) saveProfileBtn.disabled = true;

        try {
            const response = await fetch("/api/admin/profile", {
                method: "PUT",
                headers: getAuthHeaders(),
                body: JSON.stringify({ name, email, mobile })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => null);
                throw new Error(errData?.message || "Failed to update profile.");
            }

            const updated = await response.json();

            localStorage.setItem("adminName", updated.name);
            localStorage.setItem("userName", updated.name);
            localStorage.setItem("adminEmail", updated.email);
            localStorage.setItem("userEmail", updated.email);

            updateUI(updated.name, updated.email);

            if (window.AppToast) {
                window.AppToast.success("Admin profile updated successfully!");
            }

        } catch (error) {
            console.error("Save profile error:", error);
            if (window.AppToast) {
                window.AppToast.error(error.message || "Unable to save profile.");
            }
        } finally {
            if (saveProfileBtn) saveProfileBtn.disabled = false;
        }
    }

    async function handleUpdatePassword(event) {
        event.preventDefault();

        const currentPassword = document.getElementById("currentPasswordInput")?.value;
        const newPassword = document.getElementById("newPasswordInput")?.value;
        const confirmPassword = document.getElementById("confirmPasswordInput")?.value;

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
            const response = await fetch("/api/admin/profile/password", {
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
