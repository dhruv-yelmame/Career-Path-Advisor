/**
 * Career Path Adviser - Unified Student Common Helper
 * Handles sidebar toggles, student identity synchronization, active link highlights, and logout across all student pages.
 */
(function () {
    document.addEventListener("DOMContentLoaded", () => {
        setupStudentSidebar();
        setupStudentIdentity();
        highlightActiveMenu();
    });

    function setupStudentSidebar() {
        const sidebar = document.getElementById("studentSidebar");
        const menuBtn = document.getElementById("studentMenuBtn");
        const logoutBtn = document.getElementById("studentLogout");

        if (menuBtn && sidebar) {
            menuBtn.addEventListener("click", () => {
                sidebar.classList.toggle("open");
            });

            // Close sidebar when clicking outside on mobile
            document.addEventListener("click", (e) => {
                if (window.innerWidth <= 768 && sidebar.classList.contains("open")) {
                    if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
                        sidebar.classList.remove("open");
                    }
                }
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener("click", (e) => {
                e.preventDefault();
                localStorage.removeItem("studentToken");
                localStorage.removeItem("token");
                localStorage.removeItem("studentUser");
                localStorage.removeItem("user");
                sessionStorage.clear();
                window.location.href = "/student-login.html";
            });
        }
    }

    async function setupStudentIdentity() {
        const storedName = localStorage.getItem("studentName") || localStorage.getItem("name") || "Student";
        const storedEmail = localStorage.getItem("studentEmail") || localStorage.getItem("email") || "student@example.com";

        setStudentTexts(storedName, storedEmail);

        const token = localStorage.getItem("studentToken") || localStorage.getItem("token");
        if (!token) return;

        try {
            const response = await fetch("/api/student/profile", {
                headers: {
                    "Accept": "application/json",
                    "Authorization": "Bearer " + token
                }
            });

            if (response.ok) {
                const profile = await response.json();
                const name = profile.name || storedName;
                const email = profile.email || storedEmail;

                setStudentTexts(name, email);

                localStorage.setItem("studentName", name);
                localStorage.setItem("studentEmail", email);
            }
        } catch (e) {
            console.debug("Offline or local profile fallback");
        }
    }

    function setStudentTexts(name, email) {
        const nameEls = document.querySelectorAll("#studentName, #sidebarStudentName, #topStudentName, #welcomeStudentName, #heroStudentName");
        nameEls.forEach(el => { if (el) el.textContent = name; });

        const emailEls = document.querySelectorAll("#studentEmail, #sidebarStudentEmail, #heroStudentEmail");
        emailEls.forEach(el => { if (el) el.textContent = email; });

        // Update avatar letter
        const avatarEls = document.querySelectorAll(".student-avatar, #sidebarAvatar");
        avatarEls.forEach(av => {
            if (av && name && name.trim().length > 0) {
                const firstLetter = name.trim().charAt(0).toUpperCase();
                av.innerHTML = `<span style="font-weight: 700;">${firstLetter}</span>`;
            }
        });
    }

    function highlightActiveMenu() {
        const currentPath = window.location.pathname.split("/").pop() || "student-dashboard.html";
        const menuLinks = document.querySelectorAll(".student-menu a:not(.logout)");

        menuLinks.forEach(link => {
            const href = link.getAttribute("href");
            if (href && (href === currentPath || (currentPath === "" && href === "student-dashboard.html"))) {
                link.classList.add("active");
            } else if (href && !currentPath.includes(href)) {
                link.classList.remove("active");
            }
        });
    }
})();
