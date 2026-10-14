package com.career.constant;

public final class QueryConstants {

    private QueryConstants() {
        // Prevent instantiation
    }

    // ==========================================
    // USER & STUDENT QUERIES
    // ==========================================
    public static final String FIND_STUDENTS_BY_ROLE = "SELECT u FROM User u WHERE u.role = :role ORDER BY u.id DESC";
    public static final String COUNT_BY_ROLE = "SELECT COUNT(u) FROM User u WHERE u.role = :role";
    public static final String SEARCH_STUDENTS = "SELECT u FROM User u WHERE u.role = 'STUDENT' AND " +
            "(LOWER(u.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')))";
    public static final String UPDATE_USER_PASSWORD = "UPDATE User u SET u.password = :password WHERE u.id = :id";
    public static final String UPDATE_STUDENT_PROFILE = "UPDATE User u SET u.name = :name, u.mobile = :mobile, " +
            "u.course = :course WHERE u.id = :id";

    // ==========================================
    // QUESTION QUERIES
    // ==========================================
    public static final String SEARCH_QUESTIONS = "SELECT DISTINCT q FROM Question q LEFT JOIN q.options o WHERE " +
            "(:search IS NULL OR LOWER(q.questionText) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(o.category) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(o.optionText) LIKE LOWER(CONCAT('%', :search, '%')))";
    public static final String DELETE_QUESTION_FROM_TESTS = "DELETE FROM TestQuestion tq WHERE tq.question.id = :questionId";

    // ==========================================
    // TEST QUERIES
    // ==========================================
    public static final String FIND_ALL_ACTIVE_TESTS = "SELECT t FROM Test t WHERE t.active = true ORDER BY t.id DESC";
    public static final String SEARCH_TESTS = "SELECT t FROM Test t WHERE " +
            "(:search IS NULL OR LOWER(t.testName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(t.description) LIKE LOWER(CONCAT('%', :search, '%')))";
    public static final String UPDATE_TEST_ACTIVE_STATUS = "UPDATE Test t SET t.active = :active WHERE t.id = :id";
    public static final String DELETE_TEST_QUESTIONS_BY_TEST_ID = "DELETE FROM TestQuestion tq WHERE tq.test.id = :testId";
    public static final String COUNT_ATTEMPTS_BY_TEST_ID = "SELECT COUNT(a) FROM TestAttempt a WHERE a.test.id = :testId";

    // ==========================================
    // TEST ATTEMPT QUERIES
    // ==========================================
    public static final String UPDATE_TEST_ATTEMPT_STATUS = "UPDATE TestAttempt a SET a.status = :status, " +
            "a.submittedAt = :submittedAt, a.score = :score WHERE a.id = :id";

    // ==========================================
    // CAREER PATH QUERIES
    // ==========================================
    public static final String FIND_ALL_CAREER_PATHS_ORDERED = "SELECT c FROM CareerPath c ORDER BY c.careerName ASC";
    public static final String SEARCH_CAREER_PATHS = "SELECT c FROM CareerPath c WHERE " +
            "(:search IS NULL OR LOWER(c.careerName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(c.category) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(c.description) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(c.skills) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(c.education) LIKE LOWER(CONCAT('%', :search, '%')))";

    // ==========================================
    // ASSESSMENT & RESULT QUERIES
    // ==========================================
    public static final String FIND_RESULTS_BY_STUDENT = "SELECT r FROM AssessmentResult r WHERE r.student.id = :studentId ORDER BY r.completedAt DESC";
    public static final String FIND_ALL_RESULTS_WITH_DETAILS = "SELECT r FROM AssessmentResult r JOIN FETCH r.student JOIN FETCH r.recommendedCareer ORDER BY r.completedAt DESC";
    public static final String FIND_RESULTS_BY_TEST_AND_SEARCH = "SELECT r FROM AssessmentResult r " +
            "JOIN FETCH r.student s " +
            "LEFT JOIN FETCH r.recommendedCareer c " +
            "LEFT JOIN FETCH r.attempt a " +
            "LEFT JOIN FETCH a.test t " +
            "WHERE (:testId IS NULL OR (a IS NOT NULL AND t.id = :testId)) " +
            "AND (:search IS NULL OR LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "     OR LOWER(s.email) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "     OR (c IS NOT NULL AND LOWER(c.careerName) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "     OR (t IS NOT NULL AND LOWER(t.testName) LIKE LOWER(CONCAT('%', :search, '%')))) " +
            "ORDER BY r.completedAt DESC";
    public static final String COUNT_RESULTS_BY_TEST_AND_SEARCH = "SELECT COUNT(r) FROM AssessmentResult r " +
            "JOIN r.student s " +
            "LEFT JOIN r.recommendedCareer c " +
            "LEFT JOIN r.attempt a " +
            "LEFT JOIN a.test t " +
            "WHERE (:testId IS NULL OR (a IS NOT NULL AND t.id = :testId)) " +
            "AND (:search IS NULL OR LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "     OR LOWER(s.email) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "     OR (c IS NOT NULL AND LOWER(c.careerName) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "     OR (t IS NOT NULL AND LOWER(t.testName) LIKE LOWER(CONCAT('%', :search, '%'))))";
}
