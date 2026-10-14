/**
 * Career Path Adviser - Unified Student Common Helper
 * Handles sidebar toggles, student identity synchronization, active link highlights, and logout across all student pages.
 */
(function () {
    document.addEventListener("DOMContentLoaded", () => {
        setupStudentSidebar();
        setupStudentIdentity();
        highlightActiveMenu();
        window.addEventListener("hashchange", highlightActiveMenu);
    });

    function setupStudentSidebar() {
        const sidebar = document.getElementById("studentSidebar");
        const menuBtn = document.getElementById("studentMenuBtn");
        const overlay = document.getElementById("studentSidebarOverlay");
        const logoutBtn = document.getElementById("studentLogout");

        if (menuBtn && sidebar) {
            menuBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                sidebar.classList.toggle("open");
                if (overlay) overlay.classList.toggle("active");
            });

            if (overlay) {
                overlay.addEventListener("click", () => {
                    sidebar.classList.remove("open");
                    overlay.classList.remove("active");
                });
            }

            // Close sidebar when clicking outside on mobile
            document.addEventListener("click", (e) => {
                if (window.innerWidth <= 992 && sidebar.classList.contains("open")) {
                    if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
                        sidebar.classList.remove("open");
                        if (overlay) overlay.classList.remove("active");
                    }
                }
            });
        }

        const logoutElements = document.querySelectorAll("#studentLogout, #logoutBtn, .student-logout, .student-menu a.logout");
        logoutElements.forEach(btn => {
            if (!btn.dataset.logoutBound) {
                btn.dataset.logoutBound = "true";
                btn.addEventListener("click", handleStudentLogout);
            }
        });
    }

    function handleStudentLogout(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        localStorage.removeItem("studentToken");
        localStorage.removeItem("token");
        localStorage.removeItem("studentUser");
        localStorage.removeItem("user");
        localStorage.removeItem("studentId");
        localStorage.removeItem("userId");
        localStorage.removeItem("studentName");
        localStorage.removeItem("studentEmail");
        localStorage.removeItem("studentRole");
        localStorage.removeItem("role");
        sessionStorage.clear();
        window.location.href = "/student-login.html";
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
                if (profile.id) {
                    localStorage.setItem("studentId", String(profile.id));
                }
            }
        } catch (e) {
            console.debug("Offline or local profile fallback");
        }
    }

    function setStudentTexts(name, email) {
        const nameEls = document.querySelectorAll("#studentName, #sidebarStudentName, #topStudentName, #welcomeStudentName, #heroStudentName, #topbarName");
        nameEls.forEach(el => { if (el) el.textContent = name; });

        const emailEls = document.querySelectorAll("#studentEmail, #sidebarStudentEmail, #heroStudentEmail");
        emailEls.forEach(el => { if (el) el.textContent = email; });

        // Update avatar letter across all avatar circles
        const avatarEls = document.querySelectorAll(".student-avatar, #sidebarAvatar, #topAvatarLetter, #topbarAvatar");
        avatarEls.forEach(av => {
            if (av && name && name.trim().length > 0) {
                const firstLetter = name.trim().charAt(0).toUpperCase();
                av.textContent = firstLetter;
            }
        });
    }

    function highlightActiveMenu() {
        const currentPath = window.location.pathname.split("/").pop() || "student-dashboard.html";
        const hash = window.location.hash.toLowerCase();
        const search = window.location.search.toLowerCase();
        const menuLinks = document.querySelectorAll(".student-menu a:not(.logout)");

        // Determine the logical active section
        let activeKey = "dashboard";

        if (currentPath === "student-dashboard.html" || currentPath === "" || currentPath === "index.html") {
            activeKey = "dashboard";
        } else if (currentPath === "student-profile.html") {
            activeKey = "profile";
        } else if (currentPath === "take-assessment.html" || currentPath === "student-test.html" || currentPath === "available-tests.html") {
            activeKey = "assessment";
        } else if (currentPath === "student-results.html" || currentPath === "result.html") {
            activeKey = "results";
        } else if (currentPath === "career-paths-student.html") {
            activeKey = "recommendation";
        } else if (currentPath === "learning-roadmap.html") {
            activeKey = "roadmap";
        }

        menuLinks.forEach(link => {
            const href = link.getAttribute("href") || "";
            let match = false;

            switch (activeKey) {
                case "dashboard":
                    match = href.includes("student-dashboard.html");
                    break;
                case "profile":
                    match = href.includes("student-profile.html");
                    break;
                case "assessment":
                    match = href.includes("take-assessment.html") || href.includes("available-tests.html");
                    break;
                case "results":
                    match = href.includes("student-results.html");
                    break;
                case "recommendation":
                    match = href.includes("career-paths-student.html");
                    break;
                case "roadmap":
                    match = href.includes("learning-roadmap.html");
                    break;
                default:
                    match = href.includes(currentPath);
            }

            if (match) {
                link.classList.add("active");
            } else {
                link.classList.remove("active");
            }
        });
    }

    // Expose helpers globally if needed
    window.highlightActiveMenu = highlightActiveMenu;
    window.setStudentTexts = setStudentTexts;
    window.handleStudentLogout = handleStudentLogout;
})();
