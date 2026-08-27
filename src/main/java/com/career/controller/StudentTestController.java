package com.career.controller;

import com.career.dto.*;
import com.career.entity.QuestionOption;
import com.career.entity.TestAttempt;
import com.career.entity.TestQuestion;
import com.career.entity.User;
import com.career.repository.QuestionOptionRepository;
import com.career.repository.TestAttemptRepository;
import com.career.repository.TestQuestionRepository;
import com.career.repository.UserRepository;
import com.career.service.TestAttemptService;
import com.career.service.TestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/student/tests")
@CrossOrigin(origins = "*")
@Tag(name = "Student - Test Taking", description = "Endpoints for students to start, take, and submit timed assessments")
@SecurityRequirement(name = "Bearer Authentication")
public class StudentTestController {

    private static final Logger log = LoggerFactory.getLogger(StudentTestController.class);

    private final TestService testService;
    private final TestAttemptService testAttemptService;
    private final TestQuestionRepository testQuestionRepository;
    private final QuestionOptionRepository questionOptionRepository;
    private final TestAttemptRepository testAttemptRepository;
    private final UserRepository userRepository;

    public StudentTestController(TestService testService,
                                 TestAttemptService testAttemptService,
                                 TestQuestionRepository testQuestionRepository,
                                 QuestionOptionRepository questionOptionRepository,
                                 TestAttemptRepository testAttemptRepository,
                                 UserRepository userRepository) {
        this.testService = testService;
        this.testAttemptService = testAttemptService;
        this.testQuestionRepository = testQuestionRepository;
        this.questionOptionRepository = questionOptionRepository;
        this.testAttemptRepository = testAttemptRepository;
        this.userRepository = userRepository;
    }

    private Long resolveStudentId(Long passedId) {
        if (passedId != null && passedId > 0) return passedId;
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null) {
            if (authentication.getPrincipal() instanceof User) {
                return ((User) authentication.getPrincipal()).getId();
            }
            String email = authentication.getName();
            if (email != null && !email.equalsIgnoreCase("anonymousUser")) {
                User student = userRepository.findByEmail(email).orElse(null);
                if (student != null) return student.getId();
            }
        }
        return passedId != null ? passedId : 1L;
    }

    @GetMapping
    @Operation(summary = "Get available tests", description = "Returns active tests available for students")
    public ResponseEntity<List<TestResponse>> getTests() {
        return ResponseEntity.ok(testService.getAllTests());
    }

    @GetMapping("/my-attempts")
    @Operation(summary = "Get list of test IDs completed by current student")
    public ResponseEntity<List<Long>> getMyCompletedTestIds() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null) {
            Long studentId = null;
            if (authentication.getPrincipal() instanceof User) {
                studentId = ((User) authentication.getPrincipal()).getId();
            } else {
                String email = authentication.getName();
                if (email != null && !email.equalsIgnoreCase("anonymousUser")) {
                    User student = userRepository.findByEmail(email).orElse(null);
                    if (student != null) studentId = student.getId();
                }
            }

            if (studentId != null) {
                List<Long> completedIds = testAttemptRepository.findByStudentIdOrderByStartedAtDesc(studentId)
                        .stream()
                        .map(ta -> ta.getTest().getId())
                        .distinct()
                        .collect(Collectors.toList());
                return ResponseEntity.ok(completedIds);
            }
        }
        return ResponseEntity.ok(List.of());
    }

    @PostMapping("/{testId}/start")
    @Operation(summary = "Start test attempt", description = "Initiates a timed test attempt for the student")
    public ResponseEntity<StartTestResponse> startTest(
            @PathVariable Long testId,
            @RequestParam(required = false) Long studentId) {
        Long finalStudentId = resolveStudentId(studentId);
        log.info("REST: Student {} starting test {}", finalStudentId, testId);
        StartTestResponse response = testAttemptService.startTest(finalStudentId, testId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{testId}/can-attempt")
    @Operation(summary = "Check test eligibility", description = "Verifies 24-hour retry restriction")
    public ResponseEntity<Boolean> canAttemptTest(
            @PathVariable Long testId,
            @RequestParam(required = false) Long studentId) {
        Long finalStudentId = resolveStudentId(studentId);
        return ResponseEntity.ok(testAttemptService.canAttemptTest(finalStudentId, testId));
    }

    @GetMapping("/attempt/{attemptId}")
    @Operation(summary = "Get current attempt details")
    public ResponseEntity<TestAttempt> getAttempt(
            @PathVariable Long attemptId,
            @RequestParam(required = false) Long studentId) {
        Long finalStudentId = resolveStudentId(studentId);
        return ResponseEntity.ok(testAttemptService.getAttempt(finalStudentId, attemptId));
    }

    @GetMapping("/attempt/{attemptId}/remaining-time")
    @Operation(summary = "Get remaining time in seconds")
    public ResponseEntity<Long> getRemainingTime(
            @PathVariable Long attemptId,
            @RequestParam(required = false) Long studentId) {
        Long finalStudentId = resolveStudentId(studentId);
        return ResponseEntity.ok(testAttemptService.getRemainingSeconds(finalStudentId, attemptId));
    }

    @GetMapping("/attempt/{attemptId}/questions")
    @Operation(summary = "Get attempt questions")
    public ResponseEntity<List<TestQuestionResponse>> getQuestions(
            @PathVariable Long attemptId,
            @RequestParam(required = false) Long studentId) {
        Long finalStudentId = resolveStudentId(studentId);
        TestAttempt attempt = testAttemptService.getAttempt(finalStudentId, attemptId);
        List<TestQuestion> testQuestions = testQuestionRepository
                .findByTestIdOrderByQuestionOrderAsc(attempt.getTest().getId());

        List<TestQuestionResponse> response = testQuestions.stream()
                .map(tq -> {
                    List<QuestionOption> options = (tq.getQuestion().getOptions() != null && !tq.getQuestion().getOptions().isEmpty())
                            ? tq.getQuestion().getOptions()
                            : questionOptionRepository.findByQuestionId(tq.getQuestion().getId());

                    List<TestOptionResponse> optDtos = options != null
                            ? options.stream()
                            .map(opt -> TestOptionResponse.builder()
                                    .id(opt.getId())
                                    .optionText(opt.getOptionText())
                                    .build())
                            .collect(Collectors.toList())
                            : List.of();

                    return TestQuestionResponse.builder()
                            .questionId(tq.getQuestion().getId())
                            .questionOrder(tq.getQuestionOrder())
                            .questionText(tq.getQuestion().getQuestionText())
                            .questionType(tq.getQuestion().getQuestionType() != null ? tq.getQuestion().getQuestionType().name() : "INTEREST")
                            .options(optDtos)
                            .build();
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/question/{questionId}/options")
    @Operation(summary = "Get question options for student")
    public ResponseEntity<List<TestOptionResponse>> getOptions(@PathVariable Long questionId) {
        List<QuestionOption> options = questionOptionRepository.findByQuestionId(questionId);
        List<TestOptionResponse> response = options.stream()
                .map(opt -> TestOptionResponse.builder()
                        .id(opt.getId())
                        .optionText(opt.getOptionText())
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/attempt/{attemptId}/submit")
    @Operation(summary = "Submit test", description = "Evaluates student answers, calculates scores, and returns career recommendation")
    public ResponseEntity<AssessmentResultResponse> submitTest(
            @PathVariable Long attemptId,
            @RequestParam(required = false) Long studentId,
            @RequestBody List<AssessmentAnswerRequest> answers) {
        Long finalStudentId = resolveStudentId(studentId);
        log.info("REST: Student {} submitting attempt {}", finalStudentId, attemptId);
        AssessmentResultResponse result = testAttemptService.submitTest(finalStudentId, attemptId, answers);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/attempt/{attemptId}/auto-submit")
    @Operation(summary = "Auto-submit test when timer expires")
    public ResponseEntity<AssessmentResultResponse> autoSubmitTest(
            @PathVariable Long attemptId,
            @RequestParam(required = false) Long studentId) {
        Long finalStudentId = resolveStudentId(studentId);
        log.info("REST: Auto-submitting attempt {} for student {}", attemptId, finalStudentId);
        AssessmentResultResponse result = testAttemptService.autoSubmitTest(finalStudentId, attemptId);
        return ResponseEntity.ok(result);
    }
}