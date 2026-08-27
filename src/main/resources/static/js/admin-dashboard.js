document.addEventListener(
    "DOMContentLoaded",
    function () {

        "use strict";

        const refreshButton =
            document.getElementById(
                "refreshDashboard"
            );

        // ==========================================
        // INITIAL LOAD
        // ==========================================

        loadAdminUser();

        loadDashboard();

        // ==========================================
        // REFRESH EVENT
        // ==========================================

        refreshButton?.addEventListener(
            "click",
            function () {
                loadDashboard();
            }
        );

        // ==========================================
        // ADMIN USER INITIALIZATION
        // ==========================================

        function loadAdminUser() {
            let user = null;

            const adminUser =
                localStorage.getItem(
                    "adminUser"
                );

            if (adminUser) {
                try {
                    user = JSON.parse(adminUser);
                } catch (error) {
                    console.error("Invalid adminUser in localStorage:", error);
                }
            }

            if (!user) {
                const storedUser =
                    localStorage.getItem("user");

                if (storedUser) {
                    try {
                        user = JSON.parse(storedUser);
                    } catch (error) {
                        console.error("Invalid user in localStorage:", error);
                    }
                }
            }

            const storedName =
                localStorage.getItem("adminName") ||
                localStorage.getItem("userName") ||
                user?.name ||
                "Career Admin";

            setText("adminName", storedName);
            setText("topbarAdminName", storedName);
            setText("welcomeName", storedName);
        }

        // ==========================================
        // LOAD DASHBOARD METRICS
        // ==========================================

        async function loadDashboard() {
            setDashboardLoading(true);

            try {
                const headers = getAuthHeaders();
                if (!headers) {
                    setDashboardLoading(false);
                    return;
                }

                // First attempt: Dedicated dashboard-stats endpoint
                let statsLoaded = false;
                try {
                    const statsResponse = await fetch("/api/admin/students/dashboard-stats", {
                        method: "GET",
                        headers: headers
                    });

                    if (statsResponse.ok) {
                        const statsData = await statsResponse.json();

                        const totalQuestions = statsData.totalQuestions ?? 0;
                        const totalTests = statsData.totalTests ?? 0;
                        const activeTests = statsData.activeTests ?? 0;
                        const totalStudents = statsData.totalStudents ?? 0;

                        applyDashboardMetrics(totalStudents, totalQuestions, totalTests, activeTests);
                        statsLoaded = true;
                    }
                } catch (err) {
                    console.warn("Primary dashboard-stats endpoint failed, attempting fallback:", err);
                }

                // Fallback: Individual endpoints
                if (!statsLoaded) {
                    const [questions, tests, students] = await Promise.all([
                        getQuestions(headers),
                        getTests(headers),
                        getStudents(headers)
                    ]);

                    const activeCount = tests.filter(test => {
                        return (
                            test.active === true ||
                            test.active === 1 ||
                            test.active === "1" ||
                            test.active === "true"
                        );
                    }).length;

                    applyDashboardMetrics(students.length, questions.length, tests.length, activeCount);
                }

            } catch (error) {
                console.error("Dashboard metrics error:", error);
                if (window.AppToast) {
                    window.AppToast.error("Failed to load dashboard metrics. Please refresh.");
                }
            } finally {
                setDashboardLoading(false);
            }
        }

        function applyDashboardMetrics(totalStudents, totalQuestions, totalTests, activeTests) {
            setNumber("totalStudents", totalStudents);
            setNumber("totalQuestions", totalQuestions);
            setNumber("totalTests", totalTests);
            setNumber("activeTests", activeTests);

            setNumber("overviewStudents", totalStudents);
            setNumber("overviewQuestions", totalQuestions);
            setNumber("overviewTests", totalTests);
            setNumber("overviewActiveTests", activeTests);
        }

        // ==========================================
        // FALLBACK API FETCHERS
        // ==========================================

        async function getQuestions(headers) {
            try {
                const response = await fetch("/api/admin/questions", {
                    method: "GET",
                    headers: headers
                });

                if (!response.ok) return [];
                const data = await response.json();
                return Array.isArray(data) ? data : (data?.content || []);
            } catch {
                return [];
            }
        }

        async function getTests(headers) {
            try {
                const response = await fetch("/api/admin/tests", {
                    method: "GET",
                    headers: headers
                });

                if (!response.ok) return [];
                const data = await response.json();
                return Array.isArray(data) ? data : (data?.content || []);
            } catch {
                return [];
            }
        }

        async function getStudents(headers) {
            try {
                const response = await fetch("/api/admin/students", {
                    method: "GET",
                    headers: headers
                });

                if (!response.ok) return [];
                const data = await response.json();
                return Array.isArray(data) ? data : (data?.content || []);
            } catch {
                return [];
            }
        }

        // ==========================================
        // AUTH HEADERS
        // ==========================================

        function getAuthHeaders() {
            if (typeof window.authHeaders === "function") {
                return window.authHeaders();
            }

            const token =
                localStorage.getItem("adminToken") ||
                localStorage.getItem("token");

            if (!token) {
                return {
                    "Accept": "application/json"
                };
            }

            return {
                "Authorization": "Bearer " + token,
                "Accept": "application/json"
            };
        }

        // ==========================================
        // DASHBOARD LOADING STATE
        // ==========================================

        function setDashboardLoading(loading) {
            const btn = document.getElementById("refreshDashboard");
            if (!btn) return;

            if (loading) {
                btn.disabled = true;
                btn.innerHTML = `<i class="bi bi-arrow-repeat"></i> Loading...`;
            } else {
                btn.disabled = false;
                btn.innerHTML = `<i class="bi bi-arrow-clockwise"></i> Refresh`;
            }
        }

        // ==========================================
        // DOM HELPERS
        // ==========================================

        function setText(id, value) {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value ?? "";
            }
        }

        function setNumber(id, value) {
            const element = document.getElementById(id);
            if (!element) return;

            const number = Number(value);
            element.textContent = Number.isFinite(number) ? number : 0;
        }

    }
);