document.addEventListener("DOMContentLoaded", function () {

    "use strict";

    const sidebar =
        document.getElementById("sidebar");

    const menuBtn =
        document.getElementById("menuBtn");

    const overlay =
        document.getElementById("sidebarOverlay");


    if (!sidebar || !menuBtn) {
        return;
    }

    const adminProfileCard = sidebar.querySelector(".admin-profile");
    if (adminProfileCard) {
        adminProfileCard.addEventListener("click", function () {
            window.location.href = "admin-profile.html";
        });
    }


    // ==========================================
    // OPEN / CLOSE SIDEBAR
    // ==========================================

    menuBtn.addEventListener("click", function (event) {

        event.preventDefault();

        sidebar.classList.toggle("open");

        if (overlay) {
            overlay.classList.toggle(
                "active"
            );
        }

    });


    // ==========================================
    // OVERLAY CLICK
    // ==========================================

    if (overlay) {

        overlay.addEventListener(
            "click",
            closeSidebar
        );

    }


    // ==========================================
    // NAVIGATION CLICK
    // ==========================================

    const navLinks =
        sidebar.querySelectorAll(
            "a:not(.logout)"
        );


    navLinks.forEach(function (link) {

        link.addEventListener(
            "click",
            function () {

                closeSidebar();

            }
        );

    });


    // ==========================================
    // CLOSE SIDEBAR
    // ==========================================

    function closeSidebar() {

        sidebar.classList.remove(
            "open"
        );

        if (overlay) {

            overlay.classList.remove(
                "active"
            );

        }

    }


    // ==========================================
    // ESC KEY
    // ==========================================

    document.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Escape") {

                closeSidebar();

            }

        }
    );

});