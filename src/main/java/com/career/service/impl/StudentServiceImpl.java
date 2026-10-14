package com.career.service.impl;

import com.career.dto.DashboardStatsResponse;
import com.career.dto.PaginatedResponse;
import com.career.dto.StudentResponse;
import com.career.entity.AssessmentResult;
import com.career.entity.AttemptStatus;
import com.career.entity.Role;
import com.career.entity.User;
import com.career.exception.BadRequestException;
import com.career.exception.ResourceNotFoundException;
import com.career.repository.*;
import com.career.service.StudentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class StudentServiceImpl implements StudentService {

    private static final Logger log = LoggerFactory.getLogger(StudentServiceImpl.class);

    private final UserRepository userRepository;
    private final TestAttemptRepository testAttemptRepository;
    private final QuestionRepository questionRepository;
    private final TestRepository testRepository;
    private final CareerPathRepository careerPathRepository;
    private final AssessmentResultRepository assessmentResultRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    public StudentServiceImpl(UserRepository userRepository,
                              TestAttemptRepository testAttemptRepository,
                              QuestionRepository questionRepository,
                              TestRepository testRepository,
                              CareerPathRepository careerPathRepository,
                              AssessmentResultRepository assessmentResultRepository,
                              org.springframework.jdbc.core.JdbcTemplate jdbcTemplate) {
        this.userRepository = userRepository;
        this.testAttemptRepository = testAttemptRepository;
        this.questionRepository = questionRepository;
        this.testRepository = testRepository;
        this.careerPathRepository = careerPathRepository;
        this.assessmentResultRepository = assessmentResultRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public List<StudentResponse> getAllStudents() {
        log.debug("Fetching all students");
        return userRepository.findByRole(Role.STUDENT)
                .stream()
                .map(this::convertToStudentResponse)
                .collect(Collectors.toList());
    }

    @Override
    public PaginatedResponse<StudentResponse> getStudentsPaged(int page, int size, String search) {
        log.debug("Fetching paged students: page={}, size={}, search={}", page, size, search);
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<User> studentPage;

        if (search != null && !search.trim().isEmpty()) {
            studentPage = userRepository.searchStudents(search.trim(), pageable);
        } else {
            studentPage = userRepository.findByRolePaged(Role.STUDENT, pageable);
        }

        List<StudentResponse> studentResponses = studentPage.getContent()
                .stream()
                .map(this::convertToStudentResponse)
                .collect(Collectors.toList());

        return PaginatedResponse.<StudentResponse>builder()
                .content(studentResponses)
                .pageNumber(studentPage.getNumber())
                .pageSize(studentPage.getSize())
                .totalElements(studentPage.getTotalElements())
                .totalPages(studentPage.getTotalPages())
                .first(studentPage.isFirst())
                .last(studentPage.isLast())
                .build();
    }

    @Override
    public StudentResponse getStudentById(Long id) {
        log.debug("Fetching student with ID: {}", id);
        User student = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + id));

        if (student.getRole() != Role.STUDENT) {
            log.warn("User with ID {} is not a student", id);
            throw new BadRequestException("User with ID " + id + " is not a student");
        }

        return convertToStudentResponse(student);
    }

    @Override
    public long countStudents() {
        return userRepository.countByRole(Role.STUDENT);
    }

    @Override
    @Transactional
    public void deleteStudent(Long id) {
        log.info("Deleting student with ID: {}", id);
        User student = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + id));

        if (student.getRole() != Role.STUDENT) {
            throw new BadRequestException("User is not a student");
        }

        // 1. Delete assessment answers linked to the student's assessment results
        try {
            jdbcTemplate.update(
                    "DELETE FROM assessment_answers WHERE result_id IN (SELECT id FROM assessment_results WHERE student_id = ?)",
                    id
            );
        } catch (Exception e) {
            log.warn("Cleanup assessment_answers by student_id for student {}: {}", id, e.getMessage());
        }

        // 2. Delete assessment answers linked to student's test attempts (if any)
        try {
            jdbcTemplate.update(
                    "DELETE FROM assessment_answers WHERE result_id IN (SELECT id FROM assessment_results WHERE attempt_id IN (SELECT id FROM test_attempts WHERE student_id = ?))",
                    id
            );
        } catch (Exception e) {
            log.warn("Cleanup assessment_answers by attempt_id for student {}: {}", id, e.getMessage());
        }

        // 3. Delete assessment results for this student
        try {
            jdbcTemplate.update("DELETE FROM assessment_results WHERE student_id = ?", id);
        } catch (Exception e) {
            log.warn("Cleanup assessment_results by student_id for student {}: {}", id, e.getMessage());
        }

        // 4. Delete assessment results linked to student's test attempts
        try {
            jdbcTemplate.update("DELETE FROM assessment_results WHERE attempt_id IN (SELECT id FROM test_attempts WHERE student_id = ?)", id);
        } catch (Exception e) {
            log.warn("Cleanup assessment_results by attempt_id for student {}: {}", id, e.getMessage());
        }

        // 5. Delete test attempts for this student
        try {
            jdbcTemplate.update("DELETE FROM test_attempts WHERE student_id = ?", id);
        } catch (Exception e) {
            log.warn("Cleanup test_attempts for student {}: {}", id, e.getMessage());
        }

        // 6. Delete the student user record
        try {
            jdbcTemplate.update("DELETE FROM users WHERE id = ?", id);
        } catch (Exception e) {
            log.warn("Cleanup users via jdbcTemplate for student {}: {}, fallback to repository", id, e.getMessage());
            userRepository.delete(student);
        }

        log.info("Student {} and all associated records deleted successfully", id);
    }

    @Override
    public DashboardStatsResponse getDashboardStats() {
        long totalStudents = userRepository.countByRole(Role.STUDENT);
        long activeUsers = totalStudents;
        long totalQuestions = questionRepository.count();
        long totalTests = testRepository.count();
        long activeTests = testRepository.countByActiveTrue();
        long totalCareerPaths = careerPathRepository.count();
        long totalAttempts = testAttemptRepository.count();
        long completedAttempts = testAttemptRepository.countByStatus(AttemptStatus.COMPLETED)
                + testAttemptRepository.countByStatus(AttemptStatus.AUTO_SUBMITTED);

        long completedProfiles = userRepository.findByRole(Role.STUDENT).stream()
                .filter(u -> u.getCourse() != null && !u.getCourse().trim().isEmpty())
                .count();
        if (completedAttempts > completedProfiles) {
            completedProfiles = completedAttempts;
        }

        Map<String, Long> distribution = new java.util.LinkedHashMap<>();
        careerPathRepository.findAll().forEach(cp -> {
            long count = assessmentResultRepository.countByRecommendedCareerId(cp.getId());
            distribution.put(cp.getCareerName(), count);
        });

        return DashboardStatsResponse.builder()
                .totalStudents(totalStudents)
                .activeUsers(activeUsers)
                .completedProfiles(completedProfiles)
                .totalQuestions(totalQuestions)
                .totalTests(totalTests)
                .activeTests(activeTests)
                .totalCareerPaths(totalCareerPaths)
                .totalAttempts(totalAttempts)
                .completedAttempts(completedAttempts)
                .careerPathDistribution(distribution)
                .build();
    }

    private StudentResponse convertToStudentResponse(User student) {
        long totalAttempts = testAttemptRepository.countByStudentId(student.getId());
        long completed = testAttemptRepository.countByStudentIdAndStatus(student.getId(), AttemptStatus.COMPLETED)
                + testAttemptRepository.countByStudentIdAndStatus(student.getId(), AttemptStatus.AUTO_SUBMITTED);

        String latestCareer = "Not yet assessed";
        List<AssessmentResult> studentResults = assessmentResultRepository.findByStudentIdOrderByCompletedAtDesc(student.getId());

        if (studentResults != null && !studentResults.isEmpty()) {
            for (AssessmentResult r : studentResults) {
                // If student scored > 0 and had a career path
                if (r.getRecommendedCareer() != null && r.getRecommendedCareer().getCareerName() != null && !r.getRecommendedCareer().getCareerName().isBlank()) {
                    latestCareer = r.getRecommendedCareer().getCareerName();
                    break;
                }
                if (r.getCategory() != null && !r.getCategory().isBlank()) {
                    String cat = r.getCategory().trim().toUpperCase();
                    if ("DATA_SCIENCE".equals(cat)) { latestCareer = "Data Scientist & ML Engineer"; break; }
                    if ("AI_MACHINE_LEARNING".equals(cat)) { latestCareer = "AI & Machine Learning Engineer"; break; }
                    if ("SOFTWARE_ENGINEERING".equals(cat)) { latestCareer = "Software Engineer"; break; }
                    if ("WEB_DEVELOPMENT".equals(cat)) { latestCareer = "Full Stack Web Developer"; break; }
                    if ("CYBER_SECURITY".equals(cat)) { latestCareer = "Cybersecurity Analyst & Ethical Hacker"; break; }
                    if ("CLOUD_COMPUTING".equals(cat)) { latestCareer = "Cloud Solutions Architect & DevOps"; break; }
                    if ("DEVOPS_ENGINEERING".equals(cat)) { latestCareer = "DevOps Engineer"; break; }
                    if ("MOBILE_DEVELOPMENT".equals(cat)) { latestCareer = "Mobile Application Developer"; break; }
                    latestCareer = cat.replace("_", " ") + " Specialist";
                    break;
                }
            }

            if ("Not yet assessed".equals(latestCareer)) {
                latestCareer = "Career Not Found";
            }
        }

        return StudentResponse.builder()
                .id(student.getId())
                .name(student.getName())
                .email(student.getEmail())
                .maskedEmail(maskEmail(student.getEmail()))
                .role(student.getRole() != null ? student.getRole().name() : "STUDENT")
                .mobile(student.getMobile() != null ? maskPhone(student.getMobile()) : "Not provided")
                .course(student.getCourse() != null ? student.getCourse() : "BE")
                .education(student.getCourse() != null ? student.getCourse() : "BE")
                .testsAttempted(totalAttempts)
                .testsCompleted(completed)
                .latestRecommendation(latestCareer)
                .build();
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return email;
        int atIndex = email.indexOf('@');
        if (atIndex <= 2) return email;
        String prefix = email.substring(0, 2);
        String domain = email.substring(atIndex);
        return prefix + "****" + domain;
    }

    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 4) return phone;
        int len = phone.length();
        return "******" + phone.substring(len - 4);
    }
}