package com.career.config;

import com.career.entity.*;
import com.career.repository.CareerPathRepository;
import com.career.repository.QuestionRepository;
import com.career.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

@Configuration
public class DataInitializer {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    @Bean
    CommandLineRunner initializeData(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            CareerPathRepository careerPathRepository,
            QuestionRepository questionRepository,
            JdbcTemplate jdbcTemplate) {

        return args -> {
            // 0. Align database schema for legacy columns
            try {
                jdbcTemplate.execute("ALTER TABLE assessment_results MODIFY COLUMN recommended_career_id BIGINT NULL");
                log.info("Schema aligned: assessment_results.recommended_career_id is now nullable");
            } catch (Exception e) {
                log.debug("Schema alignment (assessment_results.recommended_career_id): {}", e.getMessage());
            }

            try {
                jdbcTemplate.execute("ALTER TABLE assessment_results MODIFY COLUMN career_path_id BIGINT NULL");
                log.info("Schema aligned: assessment_results.career_path_id is now nullable");
            } catch (Exception e) {
                log.debug("Schema alignment (assessment_results.career_path_id): {}", e.getMessage());
            }

            try {
                jdbcTemplate.execute("UPDATE assessment_results SET career_path_id = recommended_career_id WHERE career_path_id IS NULL AND recommended_career_id IS NOT NULL");
            } catch (Exception ignored) {}

            try {
                jdbcTemplate.execute("UPDATE assessment_results SET recommended_career_id = career_path_id WHERE recommended_career_id IS NULL AND career_path_id IS NOT NULL");
            } catch (Exception ignored) {}

            try {
                jdbcTemplate.execute("ALTER TABLE assessment_answers MODIFY COLUMN option_id BIGINT NULL");
                log.info("Schema aligned: assessment_answers.option_id is now nullable");
            } catch (Exception e) {
                log.debug("Schema alignment (assessment_answers.option_id): {}", e.getMessage());
            }

            try {
                jdbcTemplate.execute("ALTER TABLE assessment_answers MODIFY COLUMN selected_option_id BIGINT NULL");
                log.info("Schema aligned: assessment_answers.selected_option_id is now nullable");
            } catch (Exception e) {
                log.debug("Schema alignment (assessment_answers.selected_option_id): {}", e.getMessage());
            }

            try {
                jdbcTemplate.execute("UPDATE assessment_answers SET selected_option_id = option_id WHERE selected_option_id IS NULL AND option_id IS NOT NULL");
            } catch (Exception ignored) {}

            try {
                jdbcTemplate.execute("UPDATE assessment_answers SET option_id = selected_option_id WHERE option_id IS NULL AND selected_option_id IS NOT NULL");
            } catch (Exception ignored) {}

            try {
                jdbcTemplate.execute("ALTER TABLE test_attempt_answers MODIFY COLUMN option_id BIGINT NULL");
                log.info("Schema aligned: test_attempt_answers.option_id is now nullable");
            } catch (Exception e) {
                log.debug("Schema alignment (test_attempt_answers.option_id): {}", e.getMessage());
            }

            try {
                jdbcTemplate.execute("ALTER TABLE test_attempt_answers MODIFY COLUMN selected_option_id BIGINT NULL");
                log.info("Schema aligned: test_attempt_answers.selected_option_id is now nullable");
            } catch (Exception e) {
                log.debug("Schema alignment (test_attempt_answers.selected_option_id): {}", e.getMessage());
            }

            try {
                jdbcTemplate.execute("UPDATE test_attempt_answers SET selected_option_id = option_id WHERE selected_option_id IS NULL AND option_id IS NOT NULL");
            } catch (Exception ignored) {}

            try {
                jdbcTemplate.execute("UPDATE test_attempt_answers SET option_id = selected_option_id WHERE option_id IS NULL AND selected_option_id IS NOT NULL");
            } catch (Exception ignored) {}

            // 1. Initialize Admin Account
            String adminEmail = "admin@gmail.com";
            String adminPassword = "admin123";

            if (!userRepository.existsByEmail(adminEmail)) {
                User admin = User.builder()
                        .name("Career Admin")
                        .email(adminEmail)
                        .password(passwordEncoder.encode(adminPassword))
                        .role(Role.ADMIN)
                        .build();

                userRepository.save(admin);
                log.info("Default Admin account created: {}", adminEmail);
            }

            // 2. Initialize Comprehensive Career Paths (20 Domains)
            log.info("Checking and seeding default Career Paths...");

            List<CareerPath> defaultCareers = List.of(
                    CareerPath.builder()
                            .careerName("Software Engineer")
                            .category("SOFTWARE_ENGINEERING")
                            .description("Designs, develops, tests, and maintains scalable software applications, enterprise backends, and microservices.")
                            .skills("Java, Python, System Design, Algorithms, SQL, Git, REST APIs, Microservices")
                            .education("B.Tech / B.E in Computer Science, Software Engineering, or Information Technology")
                            .salaryRange("$75,000 - $160,000 / annum (₹6 - ₹28 LPA)")
                            .build(),

                    CareerPath.builder()
                            .careerName("Data Scientist & ML Engineer")
                            .category("DATA_SCIENCE")
                            .description("Extracts actionable business insights and builds predictive machine learning and deep learning models from complex datasets.")
                            .skills("Python, R, TensorFlow, PyTorch, SQL, Pandas, NumPy, Scikit-Learn, Tableau")
                            .education("Degree in Data Science, Statistics, Mathematics, or Computer Science")
                            .salaryRange("$80,000 - $170,000 / annum (₹7 - ₹32 LPA)")
                            .build(),

                    CareerPath.builder()
                            .careerName("Cybersecurity Analyst & Ethical Hacker")
                            .category("CYBER_SECURITY")
                            .description("Defends critical infrastructure, networks, and software applications against cyber attacks, threats, and security vulnerabilities.")
                            .skills("Network Security, Ethical Hacking, SIEM, Cryptography, Penetration Testing, Linux, Firewalls")
                            .education("Degree in Cyber Security, Information Technology, or certifications (CEH, CISSP, CompTIA Security+)")
                            .salaryRange("$70,000 - $150,000 / annum (₹6 - ₹25 LPA)")
                            .build(),

                    CareerPath.builder()
                            .careerName("Cloud Solutions Architect & DevOps")
                            .category("CLOUD_COMPUTING")
                            .description("Designs, builds, and orchestrates highly available, automated, and scalable cloud architectures and CI/CD deployment pipelines.")
                            .skills("AWS, Microsoft Azure, GCP, Docker, Kubernetes, Terraform, CI/CD, Linux, Ansible")
                            .education("Degree in Computer Science or Cloud certifications (AWS Solutions Architect, CKA, Azure Expert)")
                            .salaryRange("$85,000 - $180,000 / annum (₹8 - ₹35 LPA)")
                            .build(),

                    CareerPath.builder()
                            .careerName("UI/UX & Digital Product Designer")
                            .category("DESIGN")
                            .description("Crafts intuitive, accessible, and aesthetically pleasing user journeys, wireframes, and design systems for web and mobile products.")
                            .skills("Figma, Adobe XD, Wireframing, User Research, Prototyping, Usability Testing, Design Systems")
                            .education("Degree in Design, Interaction Design, Human-Computer Interaction, or Multimedia")
                            .salaryRange("$65,000 - $135,000 / annum (₹5 - ₹20 LPA)")
                            .build(),

                    CareerPath.builder()
                            .careerName("Robotics & Artificial Intelligence Engineer")
                            .category("ROBOTICS_AI")
                            .description("Designs autonomous intelligent systems, robotic process automation, computer vision, and neural network algorithms.")
                            .skills("C++, Python, ROS (Robot Operating System), Computer Vision, OpenCV, NLP, Kinematics, Control Systems")
                            .education("Degree in Robotics, Mechatronics, Artificial Intelligence, or Electrical Engineering")
                            .salaryRange("$85,000 - $175,000 / annum (₹8 - ₹32 LPA)")
                            .build(),

                    CareerPath.builder()
                            .careerName("Full Stack Web Developer")
                            .category("WEB_DEVELOPMENT")
                            .description("Builds complete end-to-end responsive web applications from interactive user interfaces to high-performance database engines.")
                            .skills("JavaScript, TypeScript, React, Node.js, Spring Boot, PostgreSQL, MongoDB, HTML5/CSS3")
                            .education("B.Tech / BCA / MCA or Full Stack Web Development Certifications")
                            .salaryRange("$65,000 - $140,000 / annum (₹5 - ₹24 LPA)")
                            .build(),

                    CareerPath.builder()
                            .careerName("Mobile App Developer (iOS & Android)")
                            .category("MOBILE_DEVELOPMENT")
                            .description("Develops high-performance native and cross-platform mobile experiences for iOS and Android ecosystems.")
                            .skills("Flutter, React Native, Swift, Kotlin, Java, Mobile UI, SQLite, Firebase, App Store Deployment")
                            .education("Degree in Computer Science, Software Engineering, or Mobile Development")
                            .salaryRange("$70,000 - $145,000 / annum (₹5.5 - ₹24 LPA)")
                            .build(),

                    CareerPath.builder()
                            .careerName("Blockchain & Web3 Developer")
                            .category("BLOCKCHAIN")
                            .description("Builds decentralized applications (dApps), smart contracts, and cryptographic protocols on distributed ledger networks.")
                            .skills("Solidity, Rust, Ethereum, Smart Contracts, Web3.js, Ethers.js, Cryptography, Hyperledger")
                            .education("Degree in Computer Science, Cryptography, or Blockchain Engineering")
                            .salaryRange("$85,000 - $185,000 / annum (₹8 - ₹36 LPA)")
                            .build(),

                    CareerPath.builder()
                            .careerName("Technical Product Manager")
                            .category("PRODUCT_MANAGEMENT")
                            .description("Guides product strategy, roadmaps, sprint execution, and feature development by bridging tech, design, and business.")
                            .skills("Product Roadmap, Agile/Scrum, User Stories, Data Analytics, JIRA, Stakeholder Management, A/B Testing")
                            .education("MBA or Bachelor's in Computer Science / Engineering with Product Management focus")
                            .salaryRange("$90,000 - $190,000 / annum (₹10 - ₹40 LPA)")
                            .build(),

                    CareerPath.builder()
                            .careerName("Game Developer & 3D Interactive Designer")
                            .category("GAME_DEVELOPMENT")
                            .description("Creates immersive interactive video games, virtual reality (VR) simulations, physics engines, and 3D gameplay mechanics.")
                            .skills("Unity, Unreal Engine, C#, C++, 3D Modeling, Blender, Shaders, Game Physics, AR/VR")
                            .education("Degree in Game Design, Computer Science, Animation, or Interactive Media")
                            .salaryRange("$65,000 - $145,000 / annum (₹5 - ₹22 LPA)")
                            .build(),

                    CareerPath.builder()
                            .careerName("Management Consultant & Strategist")
                            .category("BUSINESS_MANAGEMENT")
                            .description("Advises executives and enterprises on corporate growth, operational transformation, mergers, and strategic scaling.")
                            .skills("Business Strategy, Financial Modeling, Market Research, Problem Solving, PowerPoint, Leadership")
                            .education("MBA or Master's in Business Administration, Economics, or Management")
                            .salaryRange("$85,000 - $180,000 / annum (₹9 - ₹35 LPA)")
                            .build(),

                    CareerPath.builder()
                            .careerName("Digital Marketing & Growth Strategist")
                            .category("MARKETING")
                            .description("Drives digital acquisition, customer engagement, brand positioning, and performance marketing across global channels.")
                            .skills("SEO, SEM, Google Ads, Content Strategy, Social Media Marketing, Analytics, Funnel Optimization")
                            .education("Degree in Marketing, Communications, Business, or Digital Strategy")
                            .salaryRange("$55,000 - $125,000 / annum (₹4.5 - ₹18 LPA)")
                            .build(),

                    CareerPath.builder()
                            .careerName("Financial Analyst & Investment Banker")
                            .category("FINANCE")
                            .description("Evaluates financial statements, investment portfolios, equity valuations, and economic trends for capital growth.")
                            .skills("Financial Modeling, Valuation, DCF, Excel, Equity Research, Accounting, Risk Management, CFA")
                            .education("Degree in Finance, Accounting, Economics, or CFA / CA Certification")
                            .salaryRange("$75,000 - $170,000 / annum (₹7 - ₹30 LPA)")
                            .build(),

                    CareerPath.builder()
                            .careerName("Biomedical & Healthcare Informatician")
                            .category("HEALTHCARE")
                            .description("Applies data analytics, EHR integration, and computational biology to revolutionize healthcare delivery and diagnosis.")
                            .skills("Health Informatics, Clinical Data, Bioinformatics, Python, Biostatistics, EHR Systems, HIPAA")
                            .education("Degree in Health Informatics, Biomedical Science, Medicine, or Bioengineering")
                            .salaryRange("$70,000 - $155,000 / annum (₹6 - ₹26 LPA)")
                            .build(),

                    CareerPath.builder()
                            .careerName("Personal & Leadership Development Coach")
                            .category("PERSONAL")
                            .description("Empowers professionals and students with communication mastery, emotional intelligence, and leadership capabilities.")
                            .skills("Executive Coaching, Public Speaking, Conflict Resolution, EQ, Career Guidance, Mentorship")
                            .education("Degree in Psychology, Human Resources, Organizational Behavior, or ICF Certification")
                            .salaryRange("$50,000 - $120,000 / annum (₹4 - ₹16 LPA)")
                            .build(),

                    CareerPath.builder()
                            .careerName("IoT & Embedded Systems Engineer")
                            .category("IOT_EMBEDDED")
                            .description("Designs and develops smart connected hardware, microcontroller firmware, IoT sensor networks, and edge computing devices.")
                            .skills("C, C++, Embedded Linux, RTOS, ARM, Raspberry Pi, Arduino, MQTT, BLE, Zigbee, PCB Design")
                            .education("B.Tech / B.E in Electronics & Communication, Electrical Engineering, or Computer Science")
                            .salaryRange("$70,000 - $155,000 / annum (₹6 - ₹25 LPA)")
                            .build(),

                    CareerPath.builder()
                            .careerName("QA & Test Automation Engineer")
                            .category("QA_AUTOMATION")
                            .description("Designs robust automated testing suites, continuous quality assurance pipelines, performance testing, and bug tracking systems.")
                            .skills("Selenium, Cypress, Playwright, JUnit, TestNG, Postman, JMeter, CI/CD, Java, Python")
                            .education("B.Tech / BCA / MCA / Computer Science or ISTQB Certification")
                            .salaryRange("$60,000 - $130,000 / annum (₹4.5 - ₹18 LPA)")
                            .build(),

                    CareerPath.builder()
                            .careerName("Data Engineer & Big Data Architect")
                            .category("BIG_DATA")
                            .description("Builds and orchestrates large-scale data pipelines, ETL workflows, data lakes, and distributed data processing systems.")
                            .skills("Apache Spark, Hadoop, Kafka, Airflow, Snowflake, Databricks, SQL, Python, Scala, AWS Redshift")
                            .education("Degree in Computer Science, Data Engineering, or Information Systems")
                            .salaryRange("$80,000 - $175,000 / annum (₹7.5 - ₹32 LPA)")
                            .build(),

                    CareerPath.builder()
                            .careerName("HR & Talent Acquisition Strategist")
                            .category("HUMAN_RESOURCES")
                            .description("Drives corporate talent sourcing, employee lifecycle management, organizational culture, and HR analytics.")
                            .skills("Technical Recruiting, HR Analytics, Talent Management, Performance Appraisal, Workday, Employee Relations")
                            .education("MBA in Human Resources or Degree in Psychology / Business Administration")
                            .salaryRange("$50,000 - $115,000 / annum (₹4 - ₹15 LPA)")
                            .build()
            );

            for (CareerPath cp : defaultCareers) {
                if (!careerPathRepository.existsByCategory(cp.getCategory())) {
                    careerPathRepository.save(cp);
                    log.info("Seeded Career Path: {} ({})", cp.getCareerName(), cp.getCategory());
                }
            }
            log.info("Total Career Paths available in database: {}", careerPathRepository.count());

            // 3. Initialize Sample Questions if empty
            if (questionRepository.count() == 0) {
                log.info("Seeding initial Assessment Questions...");

                Question q1 = Question.builder()
                        .questionText("Which activity do you enjoy the most during your free time?")
                        .questionType(QuestionType.INTEREST)
                        .active(true)
                        .build();

                QuestionOption opt1a = QuestionOption.builder()
                        .optionText("Building apps, solving logic puzzles, and coding")
                        .category("SOFTWARE_ENGINEERING")
                        .score(5)
                        .question(q1)
                        .build();

                QuestionOption opt1b = QuestionOption.builder()
                        .optionText("Analyzing data patterns, numbers, and statistical trends")
                        .category("DATA_SCIENCE")
                        .score(5)
                        .question(q1)
                        .build();

                QuestionOption opt1c = QuestionOption.builder()
                        .optionText("Exploring computer network vulnerabilities and security protocols")
                        .category("CYBER_SECURITY")
                        .score(5)
                        .question(q1)
                        .build();

                QuestionOption opt1d = QuestionOption.builder()
                        .optionText("Designing visually aesthetic graphics, layouts, and user journeys")
                        .category("DESIGN")
                        .score(5)
                        .question(q1)
                        .build();

                q1.setOptions(List.of(opt1a, opt1b, opt1c, opt1d));

                Question q2 = Question.builder()
                        .questionText("What is the time complexity of binary search on a sorted array?")
                        .questionType(QuestionType.CORRECT_ANSWER)
                        .active(true)
                        .build();

                QuestionOption opt2a = QuestionOption.builder()
                        .optionText("O(1)")
                        .category("SOFTWARE_ENGINEERING")
                        .score(0)
                        .correctAnswer(false)
                        .question(q2)
                        .build();

                QuestionOption opt2b = QuestionOption.builder()
                        .optionText("O(log n)")
                        .category("SOFTWARE_ENGINEERING")
                        .score(10)
                        .correctAnswer(true)
                        .question(q2)
                        .build();

                QuestionOption opt2c = QuestionOption.builder()
                        .optionText("O(n)")
                        .category("SOFTWARE_ENGINEERING")
                        .score(0)
                        .correctAnswer(false)
                        .question(q2)
                        .build();

                QuestionOption opt2d = QuestionOption.builder()
                        .optionText("O(n^2)")
                        .category("SOFTWARE_ENGINEERING")
                        .score(0)
                        .correctAnswer(false)
                        .question(q2)
                        .build();

                q2.setOptions(List.of(opt2a, opt2b, opt2c, opt2d));

                questionRepository.saveAll(List.of(q1, q2));
                log.info("Seeded sample assessment questions.");
            }
        };
    }
}