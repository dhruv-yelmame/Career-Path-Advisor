(function () {

    "use strict";

    // =========================================================
    // PAGE NAMES
    // =========================================================

    const ADMIN_LOGIN_PAGE = "/admin-login.html";
    const STUDENT_LOGIN_PAGE = "/student-login.html";
    const STUDENT_REGISTER_PAGE = "/student-register.html";


    // =========================================================
    // ADMIN PAGES
    // =========================================================

    const ADMIN_PAGES = [
        "admin-dashboard.html",
        "add-question.html",
        "view-question.html",
        "create-test.html",
        "view-tests.html",
        "test-details.html",
        "career-paths.html",
        "students.html",
        "view-students.html",
        "student-details.html",
        "results.html",
        "admin-profile.html"
    ];


    // =========================================================
    // STUDENT PAGES
    // =========================================================

    const STUDENT_PAGES = [
        "student-dashboard.html",
        "available-tests.html",
        "take-test.html",
        "student-test.html",
        "assessment-result.html",
        "result.html",
        "student-results.html",
        "career-paths-student.html",
        "student-profile.html"
    ];


    // =========================================================
    // INITIALIZE
    // =========================================================

    document.addEventListener(
        "DOMContentLoaded",
        initializeAuth
    );


    function initializeAuth() {

        const currentPage = getCurrentPage();


        // -----------------------------------------------------
        // ADMIN LOGIN
        // -----------------------------------------------------

        const adminLoginForm =
            document.getElementById("adminLoginForm");

        if (adminLoginForm) {

            adminLoginForm.addEventListener(
                "submit",
                handleAdminLogin
            );

        }


        // -----------------------------------------------------
        // STUDENT LOGIN
        // -----------------------------------------------------

        const loginForm =
            document.getElementById("loginForm");

        if (loginForm) {

            loginForm.addEventListener(
                "submit",
                handleStudentLogin
            );

        }


        // -----------------------------------------------------
        // STUDENT REGISTER
        // -----------------------------------------------------

        const registerForm =
            document.getElementById("registerForm");

        if (registerForm) {

            registerForm.addEventListener(
                "submit",
                handleRegister
            );

        }


        // -----------------------------------------------------
        // LOGOUT
        // -----------------------------------------------------

        setupLogout();


        // -----------------------------------------------------
        // PAGE PROTECTION
        // -----------------------------------------------------

        if (ADMIN_PAGES.includes(currentPage)) {

            protectAdminPage();

        }


        if (STUDENT_PAGES.includes(currentPage)) {

            protectStudentPage();

        }

    }


    // =========================================================
    // ADMIN LOGIN
    // =========================================================

    async function handleAdminLogin(event) {

        event.preventDefault();

        const email =
            document.getElementById("adminEmail")
                ?.value
                .trim()
                .toLowerCase();

        const password =
            document.getElementById("adminPassword")
                ?.value;

        const message =
            document.getElementById("adminMessage");

        const button =
            document.getElementById("adminLoginBtn");


        if (!email || !password) {

            showMessage(
                message,
                "Email and password are required.",
                "error"
            );

            return;
        }


        try {

            if (button) {

                button.disabled = true;

                button.innerHTML =
                    '<i class="bi bi-arrow-repeat"></i> Signing in...';

            }


            const response =
                await fetch(
                    "/api/auth/admin/login",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Accept":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                email: email,
                                password: password
                            })
                    }
                );


            const data =
                await readResponse(response);


            if (!response.ok) {

                throw new Error(
                    getErrorMessage(data)
                );

            }


            if (!data || !data.token) {

                throw new Error(
                    "JWT token was not returned by server."
                );

            }


            const role =
                String(
                    data.role || ""
                ).toUpperCase();


            if (role !== "ADMIN") {

                throw new Error(
                    "This account is not an admin account."
                );

            }


            // =================================================
            // CLEAR ONLY OLD ADMIN SESSION
            // =================================================

            clearAdminAuthentication();


            // =================================================
            // ADMIN USER
            // =================================================

            const adminUser = {

                userId:
                    data.userId ??
                    data.id ??
                    null,

                name:
                    data.name ||
                    "Admin",

                email:
                    data.email ||
                    email,

                role:
                    "ADMIN"

            };


            // =================================================
            // ADMIN STORAGE
            // =================================================

            localStorage.setItem(
                "adminToken",
                data.token
            );

            localStorage.setItem(
                "adminUser",
                JSON.stringify(adminUser)
            );

            localStorage.setItem(
                "adminId",
                String(
                    adminUser.userId ?? ""
                )
            );

            localStorage.setItem(
                "adminName",
                adminUser.name
            );

            localStorage.setItem(
                "adminEmail",
                adminUser.email
            );

            localStorage.setItem(
                "adminRole",
                "ADMIN"
            );


            // Compatibility
            localStorage.setItem(
                "token",
                data.token
            );

            localStorage.setItem(
                "user",
                JSON.stringify(adminUser)
            );

            localStorage.setItem(
                "userId",
                String(
                    adminUser.userId ?? ""
                )
            );

            localStorage.setItem(
                "role",
                "ADMIN"
            );


            // Remove previous logout event
            localStorage.removeItem(
                "admin-logout-event"
            );


            showMessage(
                message,
                "Admin login successful.",
                "success"
            );


            setTimeout(
                function () {

                    window.location.replace(
                        ADMIN_LOGIN_PAGE
                            .replace(
                                "admin-login.html",
                                "admin-dashboard.html"
                            )
                    );

                },
                400
            );


        } catch (error) {

            console.error(
                "Admin login error:",
                error
            );


            showMessage(
                message,
                error.message ||
                "Unable to login.",
                "error"
            );


        } finally {

            if (button) {

                button.disabled = false;

                button.innerHTML =
                    '<i class="bi bi-box-arrow-in-right"></i><span>Admin Login</span>';

            }

        }

    }


    // =========================================================
    // STUDENT LOGIN
    // =========================================================

    async function handleStudentLogin(event) {

        event.preventDefault();


        const email =
            document.getElementById("email")
                ?.value
                .trim()
                .toLowerCase();


        const password =
            document.getElementById("password")
                ?.value;


        const message =
            document.getElementById("loginMessage");


        const button =
            document.getElementById("loginBtn");


        if (!email || !password) {

            showMessage(
                message,
                "Email and password are required.",
                "error"
            );

            return;

        }


        try {

            if (button) {

                button.disabled = true;

                button.innerHTML =
                    '<i class="bi bi-arrow-repeat"></i> Signing in...';

            }


            // =================================================
            // LOGIN API
            // =================================================

            const response =
                await fetch(
                    "/api/auth/login",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Accept":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                email: email,
                                password: password
                            })
                    }
                );


            const data =
                await readResponse(response);


            console.log(
                "STUDENT LOGIN STATUS:",
                response.status
            );

            console.log(
                "STUDENT LOGIN RESPONSE:",
                data
            );


            if (!response.ok) {

                throw new Error(
                    getErrorMessage(data)
                );

            }


            if (!data || !data.token) {

                throw new Error(
                    "JWT token was not returned by server."
                );

            }


            // =================================================
            // CHECK ROLE
            // =================================================

            const role =
                String(
                    data.role || ""
                ).toUpperCase();


            if (role !== "STUDENT") {

                throw new Error(
                    "This account is not a student account."
                );

            }


            // =================================================
            // IMPORTANT
            // CLEAR ONLY STUDENT SESSION
            // =================================================

            clearStudentAuthentication();


            // =================================================
            // STUDENT USER
            // =================================================

            const studentUser = {

                userId:
                    data.userId ??
                    data.id ??
                    null,

                name:
                    data.name ||
                    "Student",

                email:
                    data.email ||
                    email,

                role:
                    "STUDENT"

            };


            console.log(
                "STUDENT USER:",
                studentUser
            );


            // =================================================
            // STUDENT TOKEN
            // =================================================

            localStorage.setItem(
                "studentToken",
                data.token
            );


            // =================================================
            // STUDENT USER
            // =================================================

            localStorage.setItem(
                "studentUser",
                JSON.stringify(studentUser)
            );


            localStorage.setItem(
                "studentId",
                String(
                    studentUser.userId ?? ""
                )
            );


            localStorage.setItem(
                "studentName",
                studentUser.name
            );


            localStorage.setItem(
                "studentEmail",
                studentUser.email
            );


            localStorage.setItem(
                "studentRole",
                "STUDENT"
            );


            // =================================================
            // COMPATIBILITY
            // =================================================

            localStorage.setItem(
                "token",
                data.token
            );


            localStorage.setItem(
                "user",
                JSON.stringify(studentUser)
            );


            localStorage.setItem(
                "userId",
                String(
                    studentUser.userId ?? ""
                )
            );


            localStorage.setItem(
                "name",
                studentUser.name
            );


            localStorage.setItem(
                "role",
                "STUDENT"
            );


            // =================================================
            // REMOVE OLD LOGOUT EVENT
            // =================================================

            localStorage.removeItem(
                "student-logout-event"
            );


            // =================================================
            // VERIFY STORAGE
            // =================================================

            console.log(
                "studentToken exists:",
                !!localStorage.getItem("studentToken")
            );

            console.log(
                "studentUser:",
                localStorage.getItem("studentUser")
            );

            console.log(
                "studentId:",
                localStorage.getItem("studentId")
            );

            console.log(
                "role:",
                localStorage.getItem("role")
            );


            showMessage(
                message,
                "Login successful. Redirecting...",
                "success"
            );


            // =================================================
            // REDIRECT
            // =================================================

            setTimeout(
                function () {

                    window.location.replace(
                        "/student-dashboard.html"
                    );

                },
                400
            );


        } catch (error) {

            console.error(
                "Student login error:",
                error
            );


            showMessage(
                message,
                error.message ||
                "Unable to login.",
                "error"
            );


        } finally {

            if (button) {

                button.disabled = false;

                button.innerHTML =
                    '<i class="bi bi-box-arrow-in-right"></i><span>Student Login</span>';

            }

        }

    }


    // =========================================================
    // STUDENT REGISTER
    // =========================================================

    async function handleRegister(event) {

        event.preventDefault();


        const name =
            document.getElementById("name")
                ?.value
                .trim();


        const email =
            document.getElementById("email")
                ?.value
                .trim()
                .toLowerCase();


        const password =
            document.getElementById("password")
                ?.value;


        const message =
            document.getElementById("registerMessage") ||
            document.getElementById("message");


        const button =
            document.getElementById("registerBtn");


        if (!name || !email || !password) {

            showMessage(
                message,
                "Please fill all required fields.",
                "error"
            );

            return;

        }


        if (password.length < 6) {

            showMessage(
                message,
                "Password must contain at least 6 characters.",
                "error"
            );

            return;

        }


        try {

            if (button) {

                button.disabled = true;

                button.innerHTML =
                    '<i class="bi bi-arrow-repeat"></i> Creating Account...';

            }


            const response =
                await fetch(
                    "/api/auth/register",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Accept":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                name: name,
                                email: email,
                                password: password
                            })
                    }
                );


            const data =
                await readResponse(response);


            if (!response.ok) {

                throw new Error(
                    getErrorMessage(data)
                );

            }


            showMessage(
                message,
                typeof data === "string"
                    ? data
                    : data?.message ||
                      "Registration successful. Please login.",
                "success"
            );


            setTimeout(
                function () {

                    window.location.replace(
                        STUDENT_LOGIN_PAGE
                    );

                },
                800
            );


        } catch (error) {

            console.error(
                "Registration error:",
                error
            );


            showMessage(
                message,
                error.message ||
                "Unable to register.",
                "error"
            );


        } finally {

            if (button) {

                button.disabled = false;

                button.innerHTML =
                    '<i class="bi bi-person-plus"></i><span>Create Account</span>';

            }

        }

    }


    // =========================================================
    // LOGOUT SETUP
    // =========================================================

    function setupLogout() {

        const buttons =
            document.querySelectorAll(
                "#logout, .logout, #logoutBtn, #studentLogout"
            );


        buttons.forEach(
            function (button) {

                if (
                    button.dataset.logoutReady ===
                    "true"
                ) {

                    return;

                }


                button.dataset.logoutReady =
                    "true";


                button.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();

                        event.stopPropagation();

                        logout();

                    }
                );

            }
        );

    }


    // =========================================================
    // LOGOUT
    // =========================================================

    function logout() {

        const role =
            getCurrentRole();


        const eventId =
            Date.now() +
            "-" +
            Math.random()
                .toString(36)
                .substring(2);


        // =====================================================
        // ADMIN
        // =====================================================

        if (role === "ADMIN") {

            localStorage.setItem(
                "admin-logout-event",
                eventId
            );


            clearAdminAuthentication();


            window.location.replace(
                ADMIN_LOGIN_PAGE
            );

            return;

        }


        // =====================================================
        // STUDENT
        // =====================================================

        if (role === "STUDENT") {

            localStorage.setItem(
                "student-logout-event",
                eventId
            );


            clearStudentAuthentication();


            window.location.replace(
                STUDENT_LOGIN_PAGE
            );

            return;

        }


        // =====================================================
        // UNKNOWN
        // =====================================================

        clearCompatibilityAuthentication();


        window.location.replace(
            STUDENT_LOGIN_PAGE
        );

    }


    // =========================================================
    // CROSS TAB LOGOUT
    // =========================================================

    window.addEventListener(
        "storage",
        function (event) {

            const page =
                getCurrentPage();


            // ADMIN LOGOUT

            if (
                event.key ===
                "admin-logout-event"
            ) {

                if (
                    ADMIN_PAGES.includes(page)
                ) {

                    clearAdminAuthentication();

                    window.location.replace(
                        ADMIN_LOGIN_PAGE
                    );

                }

                return;

            }


            // STUDENT LOGOUT

            if (
                event.key ===
                "student-logout-event"
            ) {

                if (
                    STUDENT_PAGES.includes(page)
                ) {

                    clearStudentAuthentication();

                    window.location.replace(
                        STUDENT_LOGIN_PAGE
                    );

                }

            }

        }
    );


    // =========================================================
    // ADMIN PAGE PROTECTION
    // =========================================================

    function protectAdminPage() {

        const token =
            localStorage.getItem(
                "adminToken"
            );


        const user =
            getAdminUser();


        if (!token || !user) {

            window.location.replace(
                ADMIN_LOGIN_PAGE
            );

            return;

        }


        if (
            String(user.role)
                .toUpperCase() !==
            "ADMIN"
        ) {

            clearAdminAuthentication();

            window.location.replace(
                ADMIN_LOGIN_PAGE
            );

        }

    }


    // =========================================================
    // STUDENT PAGE PROTECTION
    // =========================================================

    function protectStudentPage() {

        const token =
            localStorage.getItem(
                "studentToken"
            );


        const user =
            getStudentUser();


        console.log(
            "STUDENT PAGE AUTH CHECK"
        );

        console.log(
            "studentToken:",
            !!token
        );

        console.log(
            "studentUser:",
            user
        );


        if (!token || !user) {

            console.error(
                "Student authentication missing."
            );

            window.location.replace(
                STUDENT_LOGIN_PAGE
            );

            return;

        }


        if (
            String(user.role)
                .toUpperCase() !==
            "STUDENT"
        ) {

            console.error(
                "Invalid student role:",
                user.role
            );

            clearStudentAuthentication();

            window.location.replace(
                STUDENT_LOGIN_PAGE
            );

            return;

        }

    }


    // =========================================================
    // ADMIN USER
    // =========================================================

    function getAdminUser() {

        const value =
            localStorage.getItem(
                "adminUser"
            );


        if (value) {

            try {

                return JSON.parse(value);

            } catch (e) {

                return null;

            }

        }


        return null;

    }


    // =========================================================
    // STUDENT USER
    // =========================================================

    function getStudentUser() {

        const value =
            localStorage.getItem(
                "studentUser"
            );


        if (value) {

            try {

                return JSON.parse(value);

            } catch (e) {

                console.error(
                    "Invalid studentUser:",
                    e
                );

                return null;

            }

        }


        // Compatibility fallback

        const compatibilityUser =
            localStorage.getItem(
                "user"
            );


        if (!compatibilityUser) {

            return null;

        }


        try {

            const user =
                JSON.parse(
                    compatibilityUser
                );


            if (
                String(user.role)
                    .toUpperCase() ===
                "STUDENT"
            ) {

                return user;

            }

        } catch (e) {

            console.error(
                "Invalid compatibility user:",
                e
            );

        }


        return null;

    }


    // =========================================================
    // CURRENT ROLE
    // =========================================================

    function getCurrentRole() {

        const page =
            getCurrentPage();


        if (
            ADMIN_PAGES.includes(page)
        ) {

            return "ADMIN";

        }


        if (
            STUDENT_PAGES.includes(page)
        ) {

            return "STUDENT";

        }


        return String(
            localStorage.getItem(
                "role"
            ) || ""
        ).toUpperCase();

    }


    // =========================================================
    // TOKEN
    // =========================================================

    function getToken() {

        const role =
            getCurrentRole();


        if (role === "ADMIN") {

            return (
                localStorage.getItem(
                    "adminToken"
                ) ||
                localStorage.getItem(
                    "token"
                )
            );

        }


        if (role === "STUDENT") {

            return (
                localStorage.getItem(
                    "studentToken"
                ) ||
                localStorage.getItem(
                    "token"
                )
            );

        }


        return localStorage.getItem(
            "token"
        );

    }


    // =========================================================
    // AUTH HEADERS
    // =========================================================

    function authHeaders() {

        const token =
            getToken();


        const headers = {

            "Accept":
                "application/json"

        };


        if (token) {

            headers[
                "Authorization"
            ] =
                "Bearer " + token;

        }


        return headers;

    }


    // =========================================================
    // CLEAR ADMIN
    // =========================================================

    function clearAdminAuthentication() {

        localStorage.removeItem(
            "adminToken"
        );

        localStorage.removeItem(
            "adminUser"
        );

        localStorage.removeItem(
            "adminId"
        );

        localStorage.removeItem(
            "adminName"
        );

        localStorage.removeItem(
            "adminEmail"
        );

        localStorage.removeItem(
            "adminRole"
        );


        if (
            String(
                localStorage.getItem("role")
            ).toUpperCase() ===
            "ADMIN"
        ) {

            localStorage.removeItem(
                "token"
            );

            localStorage.removeItem(
                "user"
            );

            localStorage.removeItem(
                "userId"
            );

            localStorage.removeItem(
                "name"
            );

            localStorage.removeItem(
                "role"
            );

        }

    }


    // =========================================================
    // CLEAR STUDENT
    // =========================================================

    function clearStudentAuthentication() {

        localStorage.removeItem(
            "studentToken"
        );

        localStorage.removeItem(
            "studentUser"
        );

        localStorage.removeItem(
            "studentId"
        );

        localStorage.removeItem(
            "studentName"
        );

        localStorage.removeItem(
            "studentEmail"
        );

        localStorage.removeItem(
            "studentRole"
        );


        if (
            String(
                localStorage.getItem("role")
            ).toUpperCase() ===
            "STUDENT"
        ) {

            localStorage.removeItem(
                "token"
            );

            localStorage.removeItem(
                "user"
            );

            localStorage.removeItem(
                "userId"
            );

            localStorage.removeItem(
                "name"
            );

            localStorage.removeItem(
                "role"
            );

        }

    }


    // =========================================================
    // CLEAR COMPATIBILITY
    // =========================================================

    function clearCompatibilityAuthentication() {

        localStorage.removeItem(
            "token"
        );

        localStorage.removeItem(
            "user"
        );

        localStorage.removeItem(
            "userId"
        );

        localStorage.removeItem(
            "name"
        );

        localStorage.removeItem(
            "role"
        );

    }


    // =========================================================
    // RESPONSE
    // =========================================================

    async function readResponse(response) {

        const text =
            await response.text();


        if (!text) {

            return {};

        }


        try {

            return JSON.parse(text);

        } catch {

            return text;

        }

    }


    // =========================================================
    // ERROR
    // =========================================================

    function getErrorMessage(data) {

        if (
            typeof data ===
            "string"
        ) {

            return data;

        }


        if (data?.message) {

            return data.message;

        }


        if (data?.error) {

            return data.error;

        }


        return "Authentication failed.";

    }


    // =========================================================
    // MESSAGE
    // =========================================================

    function showMessage(
        element,
        message,
        type
    ) {

        if (window.AppToast) {
            if (type === "success") {
                window.AppToast.success(message);
            } else {
                window.AppToast.error(message);
            }
        }

        if (!element) {

            return;

        }


        element.textContent =
            message;


        element.className =
            type === "success"
                ? "auth-message success-message"
                : "auth-message error-message";

    }


    // =========================================================
    // PAGE
    // =========================================================

    function getCurrentPage() {

        return window.location
            .pathname
            .split("/")
            .pop()
            .toLowerCase();

    }


    // =========================================================
    // PUBLIC FUNCTIONS
    // =========================================================

    window.getToken =
        getToken;


    window.authHeaders =
        authHeaders;


    window.logout =
        logout;


})();