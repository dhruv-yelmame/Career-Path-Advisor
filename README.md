# CareerPathAdviser – Career Recommendation and Assessment Platform

CareerPathAdviser is a full-stack web application built using Spring Boot, Java, MySQL, and modern web technologies. It helps students identify suitable career paths through online assessments, score calculation, and personalized career recommendations.

## 1. Problem Statement

Students often find it difficult to choose the right career based on their skills and interests. Traditional career guidance can be time-consuming and subjective.

CareerPathAdviser provides an automated platform where students can take assessments, view their results, and explore suitable career options.

## 2. Main Users

| User    | Responsibilities                                                       |
| ------- | ---------------------------------------------------------------------- |
| Student | Register, take tests, view scores, and explore career recommendations. |
| Admin   | Manage questions, tests, career paths, and student records.            |

## 3. Technology Stack

| Component         | Technologies                     |
| ----------------- | -------------------------------- |
| Frontend          | HTML, CSS, JavaScript, Bootstrap |
| Backend           | Java, Spring Boot, Spring MVC    |
| Security          | Spring Security, JWT, BCrypt     |
| Database          | MySQL, H2                        |
| Data Access       | Spring Data JPA, Hibernate       |
| API Documentation | OpenAPI, Swagger                 |
| Testing           | JUnit 5, Mockito                 |
| Logging           | SLF4J, Logback                   |
| Build Tool        | Maven                            |

## 4. System Architecture

The application follows a three-tier architecture.

| Layer              | Purpose                                                                   |
| ------------------ | ------------------------------------------------------------------------- |
| Presentation Layer | Displays student and admin pages.                                         |
| Business Layer     | Handles authentication, assessments, scoring, and career recommendations. |
| Data Layer         | Stores and retrieves data using Spring Data JPA and MySQL.                |

## 5. Main Features

### Student Portal

- Secure registration and login.
- Dashboard displaying available tests and previous results.
- Timed assessments with a countdown timer.
- Question navigation and answer selection.
- Automatic submission when the timer expires.
- Automatic score calculation.
- Personalized career recommendations.
- Email notifications for registration and assessment results.

### Admin Dashboard

- View total students, tests, questions, and career paths.
- Create, update, and manage tests.
- Add, edit, and delete questions.
- Import multiple questions in a batch.
- Manage career paths, required skills, education, and salary ranges.
- View student records and assessment results.
- Activate or deactivate tests.

## 6. Security and Performance

| Feature                   | Implementation                                |
| ------------------------- | --------------------------------------------- |
| Password Security         | BCrypt password hashing                       |
| Authentication            | JWT-based authentication                      |
| Authorization             | Spring Security roles and access rules        |
| Input Validation          | Jakarta Bean Validation                       |
| Error Handling            | Custom exceptions and `@RestControllerAdvice` |
| Data Privacy              | Masking sensitive student information         |
| Caching                   | Spring Cache                                  |
| Pagination                | Spring Data JPA `Pageable`                    |
| Logging                   | SLF4J and Logback                             |
| Environment Configuration | Development and production profiles           |

## 7. Database Design

The main database tables are:

| Table                  | Purpose                                        |
| ---------------------- | ---------------------------------------------- |
| `users`                | Stores student and user information.           |
| `tests`                | Stores test details and settings.              |
| `questions`            | Stores assessment questions.                   |
| `question_options`     | Stores answer options and scores.              |
| `career_paths`         | Stores career information and required skills. |
| `test_attempts`        | Tracks student test attempts.                  |
| `test_attempt_answers` | Stores answers submitted during tests.         |
| `assessment_results`   | Stores scores and career recommendations.      |
| `test_questions`       | Connects tests with questions.                 |

## 8. REST API Endpoints

| Module         | Main Endpoints                          | Purpose                      |
| -------------- | --------------------------------------- | ---------------------------- |
| Authentication | `/api/auth/register`, `/api/auth/login` | Register and log in.         |
| Questions      | `/api/admin/questions`                  | Manage assessment questions. |
| Tests          | `/api/admin/tests`                      | Create and manage tests.     |
| Career Paths   | `/api/admin/career-paths`               | Manage career profiles.      |
| Students       | `/api/admin/students`                   | Manage student records.      |
| Student Tests  | `/api/student/tests`                    | View and attempt tests.      |
| Results        | `/api/student/results`                  | View assessment results.     |

API documentation is available through Swagger at `http://localhost:8080/swagger-ui.html`, when the application is running and Swagger is configured.

## 9. Git Workflow

| Branch                 | Purpose                      |
| ---------------------- | ---------------------------- |
| `main`                 | Stable application code.     |
| `develop`              | Integration of new features. |
| `feature/feature-name` | Development of new features. |
| `bugfix/issue-name`    | Fixing bugs.                 |
| `refactor/scope`       | Improving existing code.     |

Example commit messages:

- `feat(auth): add JWT authentication`
- `fix(timer): correct countdown calculation`
- `test(service): add assessment tests`
- `docs(readme): update project documentation`

## 10. Challenges and Solutions

| Challenge                     | Solution                                                    |
| ----------------------------- | ----------------------------------------------------------- |
| Password security             | Used BCrypt hashing.                                        |
| Unauthorized API access       | Implemented JWT authentication and Spring Security.         |
| Timer manipulation            | Calculated remaining time on the server.                    |
| Duplicate registrations       | Added duplicate email validation.                           |
| Deleting referenced questions | Managed dependent records before deletion.                  |
| Repeated database queries     | Used caching for frequently accessed data.                  |
| Browser popup interruptions   | Created custom toast notifications and confirmation modals. |

## 11. Future Enhancements

1. **AI Career Guidance:** Generate personalized career advice using an AI API.
2. **Resume Matching:** Match student resumes with relevant job opportunities.
3. **Online Proctoring:** Add features to help monitor assessments.
4. **Microservices:** Separate authentication, assessment, notification, and analytics into independent services.

## Conclusion

CareerPathAdviser simplifies career exploration by combining online assessments, automatic scoring, and career recommendations in one platform. It provides students with career insights and gives administrators tools to manage assessments and student records.
