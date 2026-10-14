/**
 * Career Path Adviser - Personalized Student Learning Roadmap Script
 * Exclusively displays the student's personal assessed career recommendation roadmap.
 * Removes multi-track selector, track-wise overviews, and focus buttons.
 */

document.addEventListener("DOMContentLoaded", async function () {
    "use strict";

    // DOM Elements
    const recommendedCareerCard = document.getElementById("recommendedCareerCard");
    const recCategoryBadge = document.getElementById("recCategoryBadge");
    const recCareerName = document.getElementById("recCareerName");
    const recCareerDesc = document.getElementById("recCareerDesc");
    const recEducation = document.getElementById("recEducation");
    const recSalary = document.getElementById("recSalary");
    const recSkillsWrap = document.getElementById("recSkillsWrap");
    const roadmapFilterCard = document.getElementById("roadmapFilterCard");
    const roadmapSearch = document.getElementById("roadmapSearch");
    const resetFiltersBtn = document.getElementById("resetFiltersBtn");
    const roadmapContainer = document.getElementById("roadmapContainer");
    const noRecommendationState = document.getElementById("noRecommendationState");
    const searchEmptyState = document.getElementById("searchEmptyState");
    const emptyResetBtn = document.getElementById("emptyResetBtn");

    // State
    let allCareerPaths = [];
    let allDbResources = [];
    let trackCatalog = new Map(); // key: normalized track name -> track object
    let searchQuery = "";
    let recommendedTrack = null;
    let recommendedTrackData = null;

    // 1. Initialize
    await initializeRoadmap();

    // 2. Event Listeners
    roadmapSearch?.addEventListener("input", function () {
        searchQuery = (this.value || "").trim().toLowerCase();
        renderRecommendedRoadmap();
    });

    resetFiltersBtn?.addEventListener("click", resetSearch);
    emptyResetBtn?.addEventListener("click", resetSearch);

    function resetSearch() {
        searchQuery = "";
        if (roadmapSearch) roadmapSearch.value = "";
        renderRecommendedRoadmap();
    }

    // ==========================================
    // INITIALIZATION & DATA FETCHING
    // ==========================================
    async function initializeRoadmap() {
        const token = localStorage.getItem("token") || localStorage.getItem("studentToken");
        const headers = {
            "Accept": "application/json",
            ...(token ? { "Authorization": "Bearer " + token } : {})
        };

        // Determine recommended track from user session / profile
        await loadRecommendedTrack(headers);

        // Fetch Career Paths & Resources in parallel
        try {
            const [careersRes, resourcesRes] = await Promise.all([
                fetch("/api/student/career-paths", { headers }).catch(() => null),
                fetch("/api/student/resources", { headers }).catch(() => null)
            ]);

            if (careersRes && careersRes.ok) {
                const data = await careersRes.json();
                allCareerPaths = Array.isArray(data) ? data : (data.content || []);
            }

            if (resourcesRes && resourcesRes.ok) {
                const data = await resourcesRes.json();
                allDbResources = Array.isArray(data) ? data : (data.content || []);
            }
        } catch (e) {
            console.warn("Could not load backend roadmap data:", e);
        }

        // Build composite Track Catalog
        buildTrackCatalog();

        // Process recommendation
        const heroTitle = document.getElementById("heroTitle");
        const heroDesc = document.getElementById("heroDesc");
        const heroActionBtn = document.getElementById("heroActionBtn");

        if (!recommendedTrack) {
            // Student has not completed an assessment yet
            if (recommendedCareerCard) recommendedCareerCard.style.display = "none";
            if (roadmapFilterCard) roadmapFilterCard.style.display = "none";
            if (roadmapContainer) roadmapContainer.innerHTML = "";

            if (heroTitle) heroTitle.textContent = "Career Learning Roadmaps";
            if (heroDesc) heroDesc.textContent = "Take an assessment to generate your personalized trajectory, or explore curated roadmaps from top career disciplines below.";
            if (heroActionBtn) {
                heroActionBtn.href = "take-assessment.html";
                heroActionBtn.innerHTML = '<i class="bi bi-play-circle-fill"></i> Take Assessment';
            }

            const heroStatsPill = document.getElementById("heroStatsPill");
            if (heroStatsPill) {
                heroStatsPill.innerHTML = `
                    <span><i class="bi bi-compass" style="color: #60a5fa;"></i> Career Exploration</span>
                    <span>•</span>
                    <span><i class="bi bi-layers-fill" style="color: #a78bfa;"></i> 24 Career Disciplines</span>
                    <span>•</span>
                    <span><i class="bi bi-stars" style="color: #34d399;"></i> Complete Assessment for Personal Roadmap</span>
                `;
            }

            if (noRecommendationState) {
                // Populate sample preview tracks so page is never a dead end
                const sampleTracks = Array.from(trackCatalog.values()).slice(0, 3);
                const sampleCardsHtml = sampleTracks.map(t => `
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; text-align: left; display: flex; flex-direction: column; justify-content: space-between;">
                        <div>
                            <span class="badge" style="background: #eff6ff; color: #2563eb; font-size: 11px; font-weight: 700; margin-bottom: 8px;">${escapeHtml(formatCategory(t.category))}</span>
                            <h4 style="font-size: 15px; font-weight: 800; color: #0f172a; margin: 0 0 6px 0;">${escapeHtml(t.name)}</h4>
                            <p style="font-size: 12.5px; color: #64748b; line-height: 1.45; margin: 0 0 12px 0;">${escapeHtml(t.desc)}</p>
                        </div>
                        <a href="learning-roadmap.html?track=${encodeURIComponent(t.name)}" class="btn btn-outline-secondary" style="font-size: 12px; padding: 6px 12px; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
                            <span>Preview Roadmap</span> <i class="bi bi-arrow-right"></i>
                        </a>
                    </div>
                `).join("");

                noRecommendationState.innerHTML = `
                    <div style="width: 60px; height: 60px; border-radius: 50%; background: #eff6ff; color: #2563eb; display: inline-flex; align-items: center; justify-content: center; font-size: 26px; margin-bottom: 14px;">
                        <i class="bi bi-compass"></i>
                    </div>
                    <h3 style="font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">No Assessment Completed Yet</h3>
                    <p style="font-size: 13.5px; color: #64748b; max-width: 540px; margin: 0 auto 24px auto; line-height: 1.55;">
                        Your learning roadmap is custom-tailored based on your career assessment results. Complete an assessment to unlock your official recommendation, or preview popular pathways below.
                    </p>

                    ${sampleTracks.length > 0 ? `
                        <div style="border-top: 1px solid #f1f5f9; padding-top: 24px; text-align: left;">
                            <h4 style="font-size: 14px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 14px; text-align: center;">
                                Or Explore Popular Learning Pathways
                            </h4>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px;">
                                ${sampleCardsHtml}
                            </div>
                        </div>
                    ` : ''}
                `;
                noRecommendationState.style.display = "block";
            }
            return;
        }

        // Locate or build recommended track data
        const matchedKey = findMatchingTrackKey(recommendedTrack);
        if (matchedKey && trackCatalog.has(matchedKey)) {
            recommendedTrackData = trackCatalog.get(matchedKey);
        } else {
            // Create dynamic track data object
            recommendedTrackData = {
                name: recommendedTrack,
                category: "GENERAL",
                desc: `Specialized learning pathway tailored to your recommended career in ${recommendedTrack}.`,
                skills: "Domain Fundamentals, Professional Methodologies, Core Tools",
                education: "Bachelor's Degree or Relevant Technical Field",
                salary: "Competitive Market Tier",
                resources: []
            };

            const norm = normalizeTrackName(recommendedTrack);
            allDbResources.forEach(res => {
                const resTrack = normalizeTrackName(res.courseTrack || "");
                if (resTrack && (resTrack.includes(norm) || norm.includes(resTrack))) {
                    recommendedTrackData.resources.push(res);
                }
            });
        }

        // Populate Recommended Career Header Card
        if (noRecommendationState) noRecommendationState.style.display = "none";
        if (recommendedCareerCard) {
            recommendedCareerCard.style.display = "block";
            if (recCategoryBadge) recCategoryBadge.textContent = formatCategory(recommendedTrackData.category);
            if (recCareerName) recCareerName.textContent = recommendedTrackData.name;
            if (recCareerDesc) recCareerDesc.textContent = recommendedTrackData.desc;
            if (recEducation) recEducation.innerHTML = `<i class="bi bi-mortarboard" style="color: #2563eb;"></i> <strong>Required Education:</strong> ${escapeHtml(recommendedTrackData.education || "Bachelor's Degree")}`;
            if (recSalary) recSalary.innerHTML = `<i class="bi bi-cash-stack" style="color: #059669;"></i> <strong>Compensation:</strong> ${escapeHtml(formatCompensation(recommendedTrackData.salary))}`;
            if (recSkillsWrap) {
                const skillsList = (recommendedTrackData.skills || "").split(",").map(s => s.trim()).filter(Boolean);
                recSkillsWrap.innerHTML = skillsList.map(s => `<span class="skill-tag">${escapeHtml(s)}</span>`).join("");
            }
        }

        if (roadmapFilterCard) roadmapFilterCard.style.display = "block";

        renderRecommendedRoadmap();
    }

    async function loadRecommendedTrack(headers) {
        // 1. Check URL parameters (?track= or ?career=)
        const urlParams = new URLSearchParams(window.location.search);
        const paramTrack = urlParams.get("track") || urlParams.get("career");
        if (paramTrack && paramTrack.trim()) {
            recommendedTrack = paramTrack.trim();
            return;
        }

        // 2. Fetch authenticated results: /api/student/results/my-results
        try {
            let res = await fetch("/api/student/results/my-results", { headers });
            if (!res.ok) {
                const sId = getStudentId();
                if (sId) {
                    res = await fetch(`/api/student/results/student/${sId}`, { headers });
                }
            }
            if (res && res.ok) {
                const list = await res.json();
                const array = Array.isArray(list) ? list : (list.content || []);
                if (array.length > 0) {
                    // Helper to extract career name from an assessment result if valid and score > 0
                    const extractCareer = (item) => {
                        const score = Number(item.score ?? item.totalScore ?? item.obtainedScore ?? 0);
                        if (score <= 0) return null;
                        let c = null;
                        if (item.recommendedCareer) {
                            if (typeof item.recommendedCareer === 'object') {
                                c = item.recommendedCareer.careerName || item.recommendedCareer.name;
                            } else if (typeof item.recommendedCareer === 'string') {
                                c = item.recommendedCareer;
                            }
                        }
                        if (!c) {
                            c = item.careerName || item.highestCategory;
                        }
                        if (c && c.trim() && c !== "Not yet assessed" && c !== "PENDING" && c !== "Career Not Found") {
                            return c.trim();
                        }
                        return null;
                    };

                    // Check latest result first; if latest has 0 marks, look for last non-zero result
                    let chosenCareer = extractCareer(array[0]);
                    if (!chosenCareer) {
                        for (let i = 1; i < array.length; i++) {
                            const prevCareer = extractCareer(array[i]);
                            if (prevCareer) {
                                chosenCareer = prevCareer;
                                break;
                            }
                        }
                    }

                    if (chosenCareer) {
                        recommendedTrack = chosenCareer;
                        return;
                    }
                }
            }
        } catch (e) {
            console.warn("Could not fetch student results:", e);
        }

        // 3. Fallback: Check profile
        try {
            const res = await fetch("/api/student/profile", { headers });
            if (res.ok) {
                const profile = await res.json();
                if (profile.latestRecommendation &&
                    profile.latestRecommendation.trim() &&
                    profile.latestRecommendation !== "Not yet assessed" &&
                    profile.latestRecommendation !== "PENDING") {
                    recommendedTrack = profile.latestRecommendation.trim();
                    return;
                }
            }
        } catch (e) {
            console.warn("Could not fetch student profile:", e);
        }
    }

    // ==========================================
    // TRACK CATALOG BUILDER
    // ==========================================
    function buildTrackCatalog() {
        trackCatalog.clear();

        // 1. Seed standard admin tracks (All 24 career disciplines)
        const standardAdminTracks = [
            {
                name: "Software Engineer",
                category: "SOFTWARE_ENGINEERING",
                desc: "Designs, develops, tests, and maintains scalable software applications, enterprise backends, and microservices.",
                skills: "Java, Python, System Design, Algorithms, SQL, Git, REST APIs, Microservices",
                education: "B.Tech / B.E in Computer Science, Software Engineering, or Information Technology",
                salary: "$75,000 - $160,000 / annum (₹6 - ₹28 LPA)"
            },
            {
                name: "Data Scientist & ML Engineer",
                category: "DATA_SCIENCE",
                desc: "Extracts actionable business insights and builds predictive machine learning and deep learning models from complex datasets.",
                skills: "Python, R, TensorFlow, PyTorch, SQL, Pandas, NumPy, Scikit-Learn, Tableau",
                education: "Degree in Data Science, Statistics, Mathematics, or Computer Science",
                salary: "$80,000 - $170,000 / annum (₹7 - ₹32 LPA)"
            },
            {
                name: "Cybersecurity Analyst & Ethical Hacker",
                category: "CYBER_SECURITY",
                desc: "Defends critical infrastructure, networks, and software applications against cyber attacks, threats, and security vulnerabilities.",
                skills: "Network Security, Ethical Hacking, SIEM, Cryptography, Penetration Testing, Linux, Firewalls",
                education: "Degree in Cyber Security, Information Technology, or certifications (CEH, CISSP, CompTIA Security+)",
                salary: "$70,000 - $150,000 / annum (₹6 - ₹25 LPA)"
            },
            {
                name: "Cloud Solutions Architect & DevOps",
                category: "CLOUD_COMPUTING",
                desc: "Designs, builds, and orchestrates highly available, automated, and scalable cloud architectures and CI/CD deployment pipelines.",
                skills: "AWS, Microsoft Azure, GCP, Docker, Kubernetes, Terraform, CI/CD, Linux, Ansible",
                education: "Degree in Computer Science or Cloud certifications (AWS Solutions Architect, CKA, Azure Expert)",
                salary: "$85,000 - $180,000 / annum (₹8 - ₹35 LPA)"
            },
            {
                name: "UI/UX & Digital Product Designer",
                category: "UI_UX_DESIGN",
                desc: "Crafts intuitive, accessible, and aesthetically pleasing user journeys, wireframes, and design systems for web and mobile products.",
                skills: "Figma, Adobe XD, Wireframing, User Research, Prototyping, Usability Testing, Design Systems",
                education: "Degree in Design, Interaction Design, Human-Computer Interaction, or Multimedia",
                salary: "$65,000 - $135,000 / annum (₹5 - ₹20 LPA)"
            },
            {
                name: "Robotics & Artificial Intelligence Engineer",
                category: "ROBOTICS_AI",
                desc: "Designs autonomous intelligent systems, robotic process automation, computer vision, and neural network algorithms.",
                skills: "C++, Python, ROS (Robot Operating System), Computer Vision, OpenCV, NLP, Kinematics, Control Systems",
                education: "Degree in Robotics, Mechatronics, Artificial Intelligence, or Electrical Engineering",
                salary: "$85,000 - $175,000 / annum (₹8 - ₹32 LPA)"
            },
            {
                name: "Full Stack Web Developer",
                category: "WEB_DEVELOPMENT",
                desc: "Builds complete end-to-end responsive web applications from interactive user interfaces to high-performance database engines.",
                skills: "JavaScript, TypeScript, React, Node.js, Spring Boot, PostgreSQL, MongoDB, HTML5/CSS3",
                education: "B.Tech / BCA / MCA or Full Stack Web Development Certifications",
                salary: "$65,000 - $140,000 / annum (₹5 - ₹24 LPA)"
            },
            {
                name: "Mobile App Developer (iOS & Android)",
                category: "MOBILE_DEVELOPMENT",
                desc: "Develops high-performance native and cross-platform mobile experiences for iOS and Android ecosystems.",
                skills: "Flutter, React Native, Swift, Kotlin, Java, Mobile UI, SQLite, Firebase, App Store Deployment",
                education: "Degree in Computer Science, Software Engineering, or Mobile Development",
                salary: "$70,000 - $145,000 / annum (₹5.5 - ₹24 LPA)"
            },
            {
                name: "Blockchain & Web3 Developer",
                category: "BLOCKCHAIN",
                desc: "Builds decentralized applications (dApps), smart contracts, and cryptographic protocols on distributed ledger networks.",
                skills: "Solidity, Rust, Ethereum, Smart Contracts, Web3.js, Ethers.js, Cryptography, Hyperledger",
                education: "Degree in Computer Science, Cryptography, or Blockchain Engineering",
                salary: "$85,000 - $185,000 / annum (₹8 - ₹36 LPA)"
            },
            {
                name: "Technical Product Manager",
                category: "PRODUCT_MANAGEMENT",
                desc: "Guides product strategy, roadmaps, sprint execution, and feature development by bridging tech, design, and business.",
                skills: "Product Roadmap, Agile/Scrum, User Stories, Data Analytics, JIRA, Stakeholder Management, A/B Testing",
                education: "MBA or Bachelor's in Computer Science / Engineering with Product Management focus",
                salary: "$90,000 - $190,000 / annum (₹10 - ₹40 LPA)"
            },
            {
                name: "DevOps & Site Reliability Engineer",
                category: "DEVOPS_ENGINEERING",
                desc: "Automates CI/CD deployment pipelines, container orchestration, infrastructure as code, and observability systems.",
                skills: "CI/CD, Kubernetes, Docker, Prometheus, Grafana, Terraform, Linux Shell, Python, Incident Management",
                education: "Degree in Computer Science, Systems Engineering, or equivalent experience",
                salary: "$80,000 - $175,000 / annum (₹7.5 - ₹30 LPA)"
            },
            {
                name: "AI & Machine Learning Engineer",
                category: "AI_MACHINE_LEARNING",
                desc: "Architects and trains deep learning neural networks, natural language processing models, and enterprise predictive systems.",
                skills: "PyTorch, TensorFlow, LLMs, HuggingFace, CUDA, Python, Vector DBs, LangChain, RAG Pipelines",
                education: "Degree in Computer Science, AI, Mathematics, or Data Science",
                salary: "$90,000 - $195,000 / annum (₹9 - ₹38 LPA)"
            },
            {
                name: "Business Intelligence & Analytics Consultant",
                category: "BUSINESS_INTELLIGENCE",
                desc: "Transforms raw corporate datasets into strategic executive intelligence dashboards, data models, and KPI metrics.",
                skills: "SQL, Power BI, Tableau, DAX, Data Modeling, Excel, ETL, Snowflake, Business Acumen",
                education: "Degree in Business Analytics, Information Systems, Statistics, or Economics",
                salary: "$65,000 - $140,000 / annum (₹5.5 - ₹22 LPA)"
            },
            {
                name: "Game Engine & Graphics Developer",
                category: "GAME_DEVELOPMENT",
                desc: "Creates immersive interactive video games, 3D simulations, real-time physics engines, and GPU graphics shaders.",
                skills: "Unity, Unreal Engine, C#, C++, 3D Modeling, Blender, Shaders, Game Physics, AR/VR",
                education: "Degree in Game Design, Computer Science, Animation, or Interactive Media",
                salary: "$65,000 - $145,000 / annum (₹5 - ₹22 LPA)"
            },
            {
                name: "Management Consultant & Strategist",
                category: "BUSINESS_MANAGEMENT",
                desc: "Advises enterprise executives on corporate growth, operating models, organizational transformation, and market expansion.",
                skills: "Business Strategy, Financial Modeling, Market Research, Problem Solving, PowerPoint, Leadership",
                education: "MBA or Master in Business Administration, Economics, or Management",
                salary: "$85,000 - $180,000 / annum (₹9 - ₹35 LPA)"
            },
            {
                name: "Digital Marketing & Growth Strategist",
                category: "MARKETING",
                desc: "Drives customer acquisition, search engine visibility, paid media optimization, and multi-channel conversion funnels.",
                skills: "SEO, SEM, Google Ads, Content Strategy, Social Media Marketing, Analytics, Funnel Optimization",
                education: "Degree in Marketing, Communications, Business, or Digital Strategy",
                salary: "$55,000 - $125,000 / annum (₹4.5 - ₹18 LPA)"
            },
            {
                name: "Financial Analyst & Investment Banker",
                category: "FINANCE",
                desc: "Conducts corporate valuation, equity research, financial modeling, portfolio risk management, and capital allocation.",
                skills: "Financial Modeling, Valuation, DCF, Excel, Equity Research, Accounting, Risk Management, CFA",
                education: "Degree in Finance, Accounting, Economics, or CFA / CA Certification",
                salary: "$75,000 - $170,000 / annum (₹7 - ₹30 LPA)"
            },
            {
                name: "Biomedical & Healthcare Informatician",
                category: "HEALTHCARE",
                desc: "Bridges medical technology and clinical informatics to manage EHR systems, genomic data, and medical analytics.",
                skills: "Health Informatics, Clinical Data, Bioinformatics, Python, Biostatistics, EHR Systems, HIPAA",
                education: "Degree in Health Informatics, Biomedical Science, Medicine, or Bioengineering",
                salary: "$70,000 - $155,000 / annum (₹6 - ₹26 LPA)"
            },
            {
                name: "Personal & Leadership Development Coach",
                category: "PERSONAL",
                desc: "Empowers executives and students with communication mastery, emotional intelligence, and leadership competencies.",
                skills: "Executive Coaching, Public Speaking, Conflict Resolution, EQ, Career Guidance, Mentorship",
                education: "Degree in Psychology, Human Resources, Organizational Behavior, or ICF Certification",
                salary: "$50,000 - $120,000 / annum (₹4 - ₹16 LPA)"
            },
            {
                name: "IoT & Embedded Systems Engineer",
                category: "IOT_EMBEDDED",
                desc: "Designs and develops smart connected hardware, microcontroller firmware, IoT sensor networks, and edge computing devices.",
                skills: "C, C++, Embedded Linux, RTOS, ARM, Raspberry Pi, Arduino, MQTT, BLE, Zigbee, PCB Design",
                education: "B.Tech / B.E in Electronics & Communication, Electrical Engineering, or Computer Science",
                salary: "$70,000 - $155,000 / annum (₹6 - ₹25 LPA)"
            },
            {
                name: "QA & Test Automation Engineer",
                category: "QA_AUTOMATION",
                desc: "Designs automated testing suites, continuous quality assurance pipelines, performance testing, and bug tracking systems.",
                skills: "Selenium, Cypress, Playwright, JUnit, TestNG, Postman, JMeter, CI/CD, Java, Python",
                education: "B.Tech / BCA / MCA / Computer Science or ISTQB Certification",
                salary: "$60,000 - $130,000 / annum (₹4.5 - ₹18 LPA)"
            },
            {
                name: "Data Engineer & Big Data Architect",
                category: "BIG_DATA",
                desc: "Builds and orchestrates large-scale distributed data pipelines, ETL workflows, data lakes, and stream processing engines.",
                skills: "Apache Spark, Hadoop, Kafka, Airflow, Snowflake, Databricks, SQL, Python, Scala, AWS Redshift",
                education: "Degree in Computer Science, Data Engineering, or Information Systems",
                salary: "$80,000 - $175,000 / annum (₹7.5 - ₹32 LPA)"
            },
            {
                name: "HR & Talent Acquisition Strategist",
                category: "HUMAN_RESOURCES",
                desc: "Drives corporate talent sourcing, employee lifecycle management, organizational culture, and HR analytics.",
                skills: "Technical Recruiting, HR Analytics, Talent Management, Performance Appraisal, Workday, Employee Relations",
                education: "MBA in Human Resources or Degree in Psychology / Business Administration",
                salary: "$50,000 - $115,000 / annum (₹4 - ₹15 LPA)"
            },
            {
                name: "Network Engineer & Infrastructure Administrator",
                category: "NETWORK_ENGINEERING",
                desc: "Designs, deploys, and secures enterprise network architectures, routing protocols, firewalls, and data center connectivity.",
                skills: "Cisco CCNA/CCNP, TCP/IP, BGP/OSPF, Routing & Switching, Firewalls, VPN, DNS, Wireshark, Network Security, SD-WAN",
                education: "B.Tech / B.E in Computer Science, Information Technology, Electronics, or Cisco Certifications",
                salary: "$70,000 - $150,000 / annum (₹6 - ₹26 LPA)"
            }
        ];

        standardAdminTracks.forEach(t => {
            trackCatalog.set(normalizeTrackName(t.name), {
                ...t,
                resources: []
            });
        });

        // 2. Incorporate Career Paths from database
        allCareerPaths.forEach(cp => {
            const normKey = normalizeTrackName(cp.careerName);
            if (trackCatalog.has(normKey)) {
                const existing = trackCatalog.get(normKey);
                existing.desc = cp.description || existing.desc;
                existing.skills = cp.skills || existing.skills;
                existing.education = cp.education || existing.education;
                existing.salary = cp.salaryRange || existing.salary;
                existing.category = cp.category || existing.category;
            } else {
                trackCatalog.set(normKey, {
                    name: cp.careerName,
                    category: cp.category || "GENERAL",
                    desc: cp.description || "Comprehensive career pathway and professional aptitude specialization.",
                    skills: cp.skills || "Core Technical Competencies, Professional Tools, Domain Methodologies",
                    education: cp.education || "Bachelor's Degree in Computer Science, Engineering, or relevant domain",
                    salary: cp.salaryRange || "Industry Standard Competitive Compensation",
                    resources: []
                });
            }
        });

        // 3. Distribute database resources into matching tracks
        allDbResources.forEach(res => {
            const trackKey = normalizeTrackName(res.courseTrack || "");
            if (trackCatalog.has(trackKey)) {
                trackCatalog.get(trackKey).resources.push(res);
            } else {
                let matched = false;
                for (const [key, trackObj] of trackCatalog.entries()) {
                    if (key.includes(trackKey) || trackKey.includes(key)) {
                        trackObj.resources.push(res);
                        matched = true;
                        break;
                    }
                }
                if (!matched && res.courseTrack) {
                    trackCatalog.set(trackKey, {
                        name: res.courseTrack,
                        category: res.category || "GENERAL",
                        desc: `Curated learning resources and industry roadmap for ${res.courseTrack}.`,
                        skills: "Core Domain Tools, Applied Practices, Modern Engineering Standards",
                        education: "Professional degree or verified industry certifications",
                        salary: "Competitive Compensation Range",
                        resources: [res]
                    });
                }
            }
        });
    }

    function normalizeTrackName(str) {
        if (!str) return "";
        return str.toLowerCase()
            .replace(/[&/\\#,+()$~%.'":*?<>{}]/g, "")
            .replace(/\s+/g, " ")
            .trim();
    }

    function findMatchingTrackKey(input) {
        if (!input) return null;
        const norm = normalizeTrackName(input);
        if (trackCatalog.has(norm)) return norm;

        // Exact name case-insensitive
        for (const [key, obj] of trackCatalog.entries()) {
            if (obj.name.toLowerCase() === input.toLowerCase()) return key;
        }

        // Category matching (e.g. DATA_SCIENCE -> Data Scientist)
        const upperInput = input.toUpperCase().replace(/\s+/g, "_");
        for (const [key, obj] of trackCatalog.entries()) {
            if (obj.category && obj.category.toUpperCase() === upperInput) return key;
        }

        // Substring match
        for (const [key, obj] of trackCatalog.entries()) {
            if (key.includes(norm) || norm.includes(key)) return key;
        }

        // Multi-word keyword match
        const words = norm.split(" ").filter(w => w.length > 2);
        for (const word of words) {
            for (const [key, obj] of trackCatalog.entries()) {
                if (key.includes(word)) return key;
            }
        }

        return null;
    }

    // ==========================================
    // RENDER RECOMMENDED ROADMAP
    // ==========================================
    function renderRecommendedRoadmap() {
        if (!roadmapContainer || !recommendedTrackData) return;

        const stages = categorizeStages(recommendedTrackData);

        let bItems = stages.beginner;
        let iItems = stages.intermediate;
        let aItems = stages.advanced;

        if (searchQuery) {
            const filterItem = (r) => {
                const pool = ((r.title || "") + " " + (r.description || "") + " " + (r.category || "") + " " + (r.resourceType || "")).toLowerCase();
                return pool.includes(searchQuery);
            };
            bItems = bItems.filter(filterItem);
            iItems = iItems.filter(filterItem);
            aItems = aItems.filter(filterItem);
        }

        const totalItems = bItems.length + iItems.length + aItems.length;

        if (totalItems === 0) {
            roadmapContainer.innerHTML = "";
            if (searchEmptyState) searchEmptyState.style.display = "block";
            return;
        }

        if (searchEmptyState) searchEmptyState.style.display = "none";

        let html = '<div class="track-stages-container" style="margin-top: 10px;">';
        if (bItems.length > 0) {
            html += renderStageSection("1", "Stage 01: Foundations & Core Principles", "Introductory syntax, core concepts, algorithmic fundamentals, and prerequisite tools.", "beginner", bItems);
        }
        if (iItems.length > 0) {
            html += renderStageSection("2", "Stage 02: Applied Frameworks & Architecture", "Industry frameworks, database persistence, component design, and hands-on portfolio projects.", "intermediate", iItems);
        }
        if (aItems.length > 0) {
            html += renderStageSection("3", "Stage 03: Production Systems & Cloud Mastery", "Enterprise architecture, deployment pipelines, performance optimization, and distributed scalability.", "advanced", aItems);
        }
        html += '</div>';

        roadmapContainer.innerHTML = html;
    }

    // ==========================================
    // STAGE CATEGORIZATION & ENRICHMENT
    // ==========================================
    function categorizeStages(track) {
        const stages = {
            beginner: [],
            intermediate: [],
            advanced: []
        };

        // Distribute real resources from database
        track.resources.forEach(r => {
            const s = String(r.stage || "").toLowerCase();
            if (s.includes("intermediate") || s.includes("02") || s.includes("stage 2") || s === "2") {
                stages.intermediate.push(r);
            } else if (s.includes("advanced") || s.includes("03") || s.includes("stage 3") || s === "3") {
                stages.advanced.push(r);
            } else {
                stages.beginner.push(r);
            }
        });

        // Ensure every stage has curated milestones & resources
        enrichStageIfEmpty(stages.beginner, track, "1", "Foundations & Core Principles");
        enrichStageIfEmpty(stages.intermediate, track, "2", "Applied Frameworks & Practice");
        enrichStageIfEmpty(stages.advanced, track, "3", "Production Systems & Specialization");

        return stages;
    }

    function enrichStageIfEmpty(stageList, track, stageNum, defaultTitle) {
        if (stageList.length > 0) return;

        const skills = (track.skills || "Core Principles, Modern Frameworks, Cloud Architecture")
            .split(",")
            .map(s => s.trim())
            .filter(Boolean);

        if (stageNum === "1") {
            const skill = skills[0] || "Foundational Theory";
            stageList.push({
                title: `${skill} - Fundamentals & Core Concepts`,
                category: "Official Docs & Guides",
                resourceType: "Documentation",
                description: `Comprehensive starter guide covering essential syntax, architecture principles, and core paradigms for ${track.name}.`,
                resourceUrl: `https://www.google.com/search?q=${encodeURIComponent(track.name + " " + skill + " tutorial documentation")}`,
                stage: "Stage 01"
            });
            if (skills.length > 1) {
                stageList.push({
                    title: `${skills[1]} - Hands-on Interactive Practice`,
                    category: "Hands-on Practice",
                    resourceType: "Interactive",
                    description: `Practical exercises and guided labs to build muscle memory in ${skills[1]} and core development tools.`,
                    resourceUrl: `https://github.com/topics/${encodeURIComponent(skills[1].toLowerCase().replace(/\s+/g, "-"))}`,
                    stage: "Stage 01"
                });
            }
        } else if (stageNum === "2") {
            const skill = skills[2] || skills[1] || "Frameworks & Architecture";
            stageList.push({
                title: `${skill} - Deep Dive & Applied Systems`,
                category: "Video Course",
                resourceType: "Course",
                description: `Industry-standard implementations, component design patterns, and enterprise testing practices in ${skill}.`,
                resourceUrl: `https://www.coursera.org/search?query=${encodeURIComponent(track.name + " " + skill)}`,
                stage: "Stage 02"
            });
            stageList.push({
                title: `Full-Cycle Portfolio Project: ${track.name}`,
                category: "Hands-on Practice",
                resourceType: "Practice",
                description: `End-to-end production-grade portfolio project demonstrating system architecture, database design, and unit testing.`,
                resourceUrl: `https://github.com/trending`,
                stage: "Stage 02"
            });
        } else {
            const skill = skills[skills.length - 1] || "System Architecture & High Availability";
            stageList.push({
                title: `${skill} & Enterprise System Design`,
                category: "Architecture & Design",
                resourceType: "Documentation",
                description: `Scalability patterns, distributed resilience, high-performance optimization, and production telemetry for senior ${track.name}s.`,
                resourceUrl: `https://github.com/donnemartin/system-design-primer`,
                stage: "Stage 03"
            });
            stageList.push({
                title: `Professional Industry Certification Roadmap`,
                category: "Books & Cheatsheets",
                resourceType: "Book",
                description: `Industry certification standards, mock scenarios, and architectural review questions for senior professional accreditation.`,
                resourceUrl: `https://roadmap.sh/`,
                stage: "Stage 03"
            });
        }
    }

    function renderStageSection(num, title, subtitle, stageClass, items) {
        return `
            <section class="roadmap-stage-section">
                <div class="roadmap-stage-header ${stageClass}">
                    <div class="roadmap-stage-num">${num}</div>
                    <div class="roadmap-stage-title">
                        <h2>${escapeHtml(title)}</h2>
                        <p>${escapeHtml(subtitle)}</p>
                    </div>
                </div>

                <div class="resources-grid">
                    ${items.map(res => renderResourceCard(res)).join("")}
                </div>
            </section>
        `;
    }

    function renderResourceCard(res) {
        const type = res.resourceType || "Course";
        let typeIcon = "bi-journal-bookmark";
        const tLower = type.toLowerCase();
        if (tLower === "video") typeIcon = "bi-play-circle";
        else if (tLower === "article") typeIcon = "bi-file-text";
        else if (tLower === "documentation") typeIcon = "bi-code-slash";
        else if (tLower === "practice" || tLower === "interactive") typeIcon = "bi-cpu";
        else if (tLower === "book") typeIcon = "bi-book";

        const url = res.resourceUrl || "#";

        return `
            <div class="resource-card">
                <div>
                    <div class="resource-card-top">
                        <span class="badge" style="background: #eff6ff; color: #2563eb; font-weight: 700; font-size: 11px;">
                            <i class="bi ${typeIcon}"></i> ${escapeHtml(type)}
                        </span>
                        <span style="font-size: 11px; font-weight: 600; color: #64748b; background: #f1f5f9; padding: 2px 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
                            ${escapeHtml(res.category || "Core Module")}
                        </span>
                    </div>

                    <h3>${escapeHtml(res.title || "Learning Module")}</h3>
                    <p>${escapeHtml(res.description || "Comprehensive hands-on study materials and industry documentation.")}</p>
                </div>

                <div class="resource-card-footer">
                    <span style="font-size: 11.5px; color: #059669; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
                        <i class="bi bi-patch-check-fill"></i> Verified Curated
                    </span>
                    <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="btn-access">
                        Access Resource <i class="bi bi-arrow-up-right"></i>
                    </a>
                </div>
            </div>
        `;
    }

    // ==========================================
    // UTILITIES
    // ==========================================
    function formatCategory(cat) {
        if (!cat) return "General Track";
        return String(cat).replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    }

    function formatCompensation(salary) {
        if (!salary || typeof salary !== "string") return "₹6,00,000 - ₹25,00,000 / annum";
        let cleaned = salary
            .replace(/[\uFFFD\u0080-\u009F]/g, "")
            .replace(/\?{2,}/g, "₹")
            .replace(/\?(\s*\d)/g, "₹$1")
            .replace(/(\bLPA\b|\bannum\b|\byr\b)\s*\?/gi, "$1")
            .replace(/\?+/g, "₹")
            .trim();
        return cleaned || "₹6,00,000 - ₹25,00,000 / annum";
    }

    function getStudentId() {
        const studentUser = localStorage.getItem("studentUser") || localStorage.getItem("user");
        if (studentUser) {
            try {
                const parsed = JSON.parse(studentUser);
                if (parsed.id || parsed.userId) return parsed.id || parsed.userId;
            } catch (e) {}
        }
        return localStorage.getItem("studentId") || localStorage.getItem("userId") || null;
    }

    function escapeHtml(str) {
        if (!str) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});
