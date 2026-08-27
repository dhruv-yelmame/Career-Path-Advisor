document.addEventListener("DOMContentLoaded", function () {

    // =====================================================
    // SIDEBAR CONTAINER
    // =====================================================

    const sidebarContainer =
        document.getElementById("adminSidebarContainer");

    if (sidebarContainer) {

        sidebarContainer.innerHTML = `

            <aside
                class="sidebar"
                id="sidebar">

                <!-- LOGO -->

                <div class="logo">

                    <span class="logo-icon">
                        ◈
                    </span>

                    <span>
                        Career Path Adviser
                    </span>

                </div>


                <!-- ADMIN PROFILE -->

                <div class="admin-profile">

                    <div class="profile-circle">

                        <i class="bi bi-person"></i>

                    </div>

                    <div>

                        <strong id="adminName">
                            Career Admin
                        </strong>

                        <span>
                            Administrator
                        </span>

                    </div>

                </div>


                <!-- MENU -->

                <nav class="menu">

                    <a
                        href="admin-dashboard.html"
                        data-page="admin-dashboard.html">

                        <i class="bi bi-grid"></i>

                        <span>
                            Dashboard
                        </span>

                    </a>


                    <a
                        href="add-question.html"
                        data-page="add-question.html">

                        <i class="bi bi-plus-circle"></i>

                        <span>
                            Add Question
                        </span>

                    </a>


                    <a
                        href="view-question.html"
                        data-page="view-question.html">

                        <i class="bi bi-question-circle"></i>

                        <span>
                            Questions
                        </span>

                    </a>


                    <a
                        href="create-test.html"
                        data-page="create-test.html">

                        <i class="bi bi-file-earmark-plus"></i>

                        <span>
                            Create Test
                        </span>

                    </a>


                    <a
                        href="view-tests.html"
                        data-page="view-tests.html">

                        <i class="bi bi-file-earmark-text"></i>

                        <span>
                            View Tests
                        </span>

                    </a>


                    <a
                        href="career-paths.html"
                        data-page="career-paths.html">

                        <i class="bi bi-signpost-split"></i>

                        <span>
                            Career Paths
                        </span>

                    </a>


                    <a
                        href="students.html"
                        data-page="students.html">

                        <i class="bi bi-people"></i>

                        <span>
                            Students
                        </span>

                    </a>


                    <a
                        href="results.html"
                        data-page="results.html">
                        <i class="bi bi-bar-chart"></i>
                        <span>Results</span>
                    </a>

                    <a
                        href="admin-profile.html"
                        data-page="admin-profile.html">
                        <i class="bi bi-person-badge"></i>
                        <span>Admin Profile</span>
                    </a>

                    <!-- LOGOUT -->

                    <a
                        href="#"
                        id="adminLogout"
                        class="logout">

                        <i class="bi bi-box-arrow-right"></i>

                        <span>
                            Logout
                        </span>

                    </a>

                </nav>

            </aside>


            <!-- MOBILE OVERLAY -->

            <div
                id="sidebarOverlay"
                class="sidebar-overlay">
            </div>

        `;
    }


    // =====================================================
    // TOPBAR CONTAINER
    // =====================================================

    const topbarContainer =
        document.getElementById("adminTopbarContainer");

    if (topbarContainer) {

        const pageName =
            getPageName();

        topbarContainer.innerHTML = `

            <header class="topbar">

                <div class="topbar-left">

                    <button
                        type="button"
                        id="menuBtn"
                        class="menu-btn">

                        <i class="bi bi-list"></i>

                    </button>

                    <h4>
                        ${pageName}
                    </h4>

                </div>


                <div class="topbar-right">

                    <span id="topAdminName">
                        Career Admin
                    </span>

                </div>

            </header>

        `;
    }


    // =====================================================
    // ACTIVE MENU
    // =====================================================

    setActiveMenu();


    // =====================================================
    // ADMIN NAME
    // =====================================================

    loadAdminName();


    // =====================================================
    // MOBILE SIDEBAR
    // =====================================================

    setupMobileSidebar();


    // =====================================================
    // LOGOUT
    // =====================================================

    setupLogout();

});


// =========================================================
// GET CURRENT PAGE NAME
// =========================================================

function getCurrentPage() {

    let page =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();

    if (!page) {
        page = "admin-dashboard.html";
    }

    return page;
}


// =========================================================
// GET PAGE TITLE
// =========================================================

function getPageName() {

    const page =
        getCurrentPage();

    const pageNames = {

        "admin-dashboard.html":
            "Admin Dashboard",

        "add-question.html":
            "Add Question",

        "view-question.html":
            "Question Bank",

        "create-test.html":
            "Create Test",

        "view-tests.html":
            "View Tests",

        "test-details.html":
            "Test Details",

        "career-paths.html":
            "Career Paths",

        "students.html":
            "Students",

        "student-details.html":
            "Student Details",

        "results.html":
            "Results",

        "admin-profile.html":
            "Admin Profile"

    };

    return pageNames[page] ||
        "Admin Dashboard";
}


// =========================================================
// ACTIVE MENU
// =========================================================

function setActiveMenu() {

    const currentPage =
        getCurrentPage();

    const menuItems =
        document.querySelectorAll(
            ".menu a[data-page]"
        );

    menuItems.forEach(function (item) {

        const page =
            item.getAttribute("data-page");

        item.classList.remove("active");

        if (page === currentPage) {

            item.classList.add("active");

        }

    });

}


// =========================================================
// ADMIN NAME
// =========================================================

function loadAdminName() {

    let name = null;

    try {

        name =
            localStorage.getItem("adminName") ||
            localStorage.getItem("userName");

        if (!name) {

            const adminUser =
                JSON.parse(
                    localStorage.getItem("adminUser") || "null"
                );

            const user =
                JSON.parse(
                    localStorage.getItem("user") || "null"
                );

            name = adminUser?.name || user?.name || user?.userName;

        }

    } catch (error) {

        console.error(
            "Unable to read admin user:",
            error
        );

    }

    if (!name) {

        name = "Career Admin";

    }


    const adminName =
        document.getElementById(
            "adminName"
        );

    const topAdminName =
        document.getElementById(
            "topAdminName"
        );


    if (adminName) {

        adminName.textContent =
            name;

    }


    if (topAdminName) {

        topAdminName.textContent =
            name;

    }

}


// =========================================================
// MOBILE SIDEBAR
// =========================================================

function setupMobileSidebar() {

    const menuBtn =
        document.getElementById(
            "menuBtn"
        );

    const sidebar =
        document.getElementById(
            "sidebar"
        );

    const overlay =
        document.getElementById(
            "sidebarOverlay"
        );


    if (!menuBtn || !sidebar) {

        return;

    }


    menuBtn.addEventListener(
        "click",
        function () {

            sidebar.classList.toggle(
                "sidebar-open"
            );

            overlay?.classList.toggle(
                "overlay-show"
            );

        }
    );


    overlay?.addEventListener(
        "click",
        function () {

            sidebar.classList.remove(
                "sidebar-open"
            );

            overlay.classList.remove(
                "overlay-show"
            );

        }
    );


    document
        .querySelectorAll(".menu a")
        .forEach(function (link) {

            link.addEventListener(
                "click",
                function () {

                    sidebar.classList.remove(
                        "sidebar-open"
                    );

                    overlay?.classList.remove(
                        "overlay-show"
                    );

                }
            );

        });

}


// =========================================================
// LOGOUT
// =========================================================

function setupLogout() {

    const logout =
        document.getElementById(
            "adminLogout"
        );


    if (!logout) {

        return;

    }


    logout.addEventListener(
        "click",
        function (event) {

            event.preventDefault();


            const confirmLogout =
                confirm(
                    "Are you sure you want to logout?"
                );


            if (!confirmLogout) {

                return;

            }


            // Clear all authentication data
            localStorage.removeItem("token");
            localStorage.removeItem("jwtToken");
            localStorage.removeItem("user");
            localStorage.removeItem("userId");
            localStorage.removeItem("userName");
            localStorage.removeItem("userEmail");
            localStorage.removeItem("userRole");

            localStorage.removeItem("adminToken");
            localStorage.removeItem("adminUser");
            localStorage.removeItem("adminId");
            localStorage.removeItem("adminName");
            localStorage.removeItem("adminEmail");
            localStorage.removeItem("adminRole");

            sessionStorage.clear();

            // Redirect
            window.location.replace("admin-login.html");

        }
    );

}