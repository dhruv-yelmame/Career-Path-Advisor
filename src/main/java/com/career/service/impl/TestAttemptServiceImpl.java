package com.career.service.impl;

import com.career.config.CacheConfig;
import com.career.dto.*;
import com.career.entity.*;
import com.career.exception.BadRequestException;
import com.career.exception.ResourceNotFoundException;
import com.career.exception.UnauthorizedException;
import com.career.repository.*;
import com.career.service.TestAttemptService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TestAttemptServiceImpl implements TestAttemptService {

    private static final Logger log = LoggerFactory.getLogger(TestAttemptServiceImpl.class);

    private final TestRepository testRepository;
    private final TestQuestionRepository testQuestionRepository;
    private final TestAttemptRepository testAttemptRepository;
    private final UserRepository userRepository;
    private final QuestionOptionRepository questionOptionRepository;
    private final AssessmentResultRepository assessmentResultRepository;
    private final AssessmentAnswerRepository assessmentAnswerRepository;
    private final CareerPathRepository careerPathRepository;
    private final com.career.service.CareerAllocationService careerAllocationService;

    public TestAttemptServiceImpl(TestRepository testRepository,
                                  TestQuestionRepository testQuestionRepository,
                                  TestAttemptRepository testAttemptRepository,
                                  UserRepository userRepository,
                                  QuestionOptionRepository questionOptionRepository,
                                  AssessmentResultRepository assessmentResultRepository,
                                  AssessmentAnswerRepository assessmentAnswerRepository,
                                  CareerPathRepository careerPathRepository,
                                  com.career.service.CareerAllocationService careerAllocationService) {
        this.testRepository = testRepository;
        this.testQuestionRepository = testQuestionRepository;
        this.testAttemptRepository = testAttemptRepository;
        this.userRepository = userRepository;
        this.questionOptionRepository = questionOptionRepository;
        this.assessmentResultRepository = assessmentResultRepository;
        this.assessmentAnswerRepository = assessmentAnswerRepository;
        this.careerPathRepository = careerPathRepository;
        this.careerAllocationService = careerAllocationService;
    }

    @Override
    @Transactional
    public StartTestResponse startTest(Long studentId, Long testId) {
        log.info("Starting test ID: {} for student ID: {}", testId, studentId);

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with ID: " + studentId));

        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Test not found with ID: " + testId));

        if (!Boolean.TRUE.equals(test.getActive())) {
            log.warn("Attempt to start inactive test ID: {}", testId);
            throw new BadRequestException("This test is currently inactive");
        }

        LocalDateTime now = LocalDateTime.now();

        int timeLimit = (test.getTimeLimitMinutes() != null && test.getTimeLimitMinutes() > 0)
                ? test.getTimeLimitMinutes()
                : 15;

        Optional<TestAttempt> latestAttemptOpt = testAttemptRepository.findTopByStudentIdAndTestIdOrderByStartedAtDesc(studentId, testId);
        TestAttempt attemptToUse = null;
        LocalDateTime startedAt = now;
        LocalDateTime expiresAt = now.plusMinutes(timeLimit);

        if (latestAttemptOpt.isPresent()) {
            TestAttempt last = latestAttemptOpt.get();
            if (last.getStatus() == AttemptStatus.IN_PROGRESS) {
                LocalDateTime deadline = last.getStartedAt().plusMinutes(timeLimit);
                if (now.isBefore(deadline)) {
                    // Resume existing in-progress attempt
                    attemptToUse = last;
                    startedAt = last.getStartedAt();
                    expiresAt = deadline;
                } else {
                    last.setStatus(AttemptStatus.AUTO_SUBMITTED);
                    testAttemptRepository.save(last);
                    // Expired attempt marked auto-submitted; student can start a new attempt
                }
            }
            // Completed or auto-submitted attempts allow student to retake the test
        }

        List<TestQuestion> testQuestions = new ArrayList<>(testQuestionRepository.findByTestIdOrderByQuestionOrderAsc(testId));
        if (testQuestions.isEmpty()) {
            throw new BadRequestException("This test contains no questions. Please contact the administrator.");
        }

        if (attemptToUse == null) {
            TestAttempt newAttempt = TestAttempt.builder()
                    .student(student)
                    .test(test)
                    .startedAt(now)
                    .status(AttemptStatus.IN_PROGRESS)
                    .score(0)
                    .build();
            attemptToUse = testAttemptRepository.save(newAttempt);
        }

        if (Boolean.TRUE.equals(test.getRandomQuestions())) {
            Collections.shuffle(testQuestions, new java.util.Random(attemptToUse.getId()));
        }

        int order = 1;
        List<StudentQuestionResponse> questionResponses = new ArrayList<>();

        for (TestQuestion tq : testQuestions) {
            Question q = tq.getQuestion();
            List<QuestionOption> options = q.getOptions() != null && !q.getOptions().isEmpty()
                    ? q.getOptions()
                    : questionOptionRepository.findByQuestionId(q.getId());

            List<StudentOptionResponse> optionResponses = options.stream()
                    .map(opt -> StudentOptionResponse.builder()
                            .id(opt.getId())
                            .optionText(opt.getOptionText())
                            .build())
                    .collect(Collectors.toList());

            questionResponses.add(StudentQuestionResponse.builder()
                    .id(q.getId())
                    .questionOrder(order++)
                    .questionText(q.getQuestionText())
                    .marks(q.getMarks() != null ? q.getMarks() : 10)
                    .category(q.getCategory())
                    .options(optionResponses)
                    .build());
        }

        long remainingSecs = Math.max(0, Duration.between(now, expiresAt).getSeconds());
        if (remainingSecs <= 0 && attemptToUse.getStatus() == AttemptStatus.IN_PROGRESS) {
            remainingSecs = timeLimit * 60L;
        }

        log.info("Test attempt ID: {} ready. Expires at: {}, remainingSeconds: {}", attemptToUse.getId(), expiresAt, remainingSecs);

        return StartTestResponse.builder()
                .attemptId(attemptToUse.getId())
                .testId(test.getId())
                .testName(test.getTestName())
                .timeLimitMinutes(timeLimit)
                .startedAt(startedAt)
                .expiresAt(expiresAt)
                .remainingSeconds(remainingSecs)
                .questions(questionResponses)
                .build();
    }

    @Override
    public TestAttempt getAttempt(Long studentId, Long attemptId) {
        TestAttempt attempt = testAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Test attempt not found with ID: " + attemptId));

        if (!attempt.getStudent().getId().equals(studentId)) {
            log.warn("Unauthorized attempt access: Student {} trying to access attempt {}", studentId, attemptId);
            throw new UnauthorizedException("You are not authorized to access this test attempt");
        }

        return attempt;
    }

    @Override
    public boolean canAttemptTest(Long studentId, Long testId) {
        Test test = testRepository.findById(testId).orElse(null);
        if (test == null || !Boolean.TRUE.equals(test.getActive())) {
            return false;
        }
        return true;
    }

    @Override
    public long getRemainingSeconds(Long studentId, Long attemptId) {
        TestAttempt attempt = getAttempt(studentId, attemptId);
        if (attempt.getStatus() != AttemptStatus.IN_PROGRESS) {
            return 0;
        }

        int timeLimit = (attempt.getTest().getTimeLimitMinutes() != null && attempt.getTest().getTimeLimitMinutes() > 0)
                ? attempt.getTest().getTimeLimitMinutes()
                : 15;
        LocalDateTime deadline = attempt.getStartedAt().plusMinutes(timeLimit);
        long seconds = Duration.between(LocalDateTime.now(), deadline).getSeconds();
        return Math.max(seconds, 0);
    }

    @Override
    @Transactional
    @CacheEvict(value = CacheConfig.CACHE_DASHBOARD_STATS, allEntries = true)
    public AssessmentResultResponse submitTest(Long studentId, Long attemptId, List<AssessmentAnswerRequest> answers) {
        log.info("Submitting test attempt ID: {} for student ID: {}", attemptId, studentId);
        TestAttempt attempt = getAttempt(studentId, attemptId);

        if (attempt.getStatus() != AttemptStatus.IN_PROGRESS) {
            throw new BadRequestException("This test attempt has already been submitted");
        }

        LocalDateTime now = LocalDateTime.now();
        Test test = attempt.getTest();
        int timeLimit = (test.getTimeLimitMinutes() != null && test.getTimeLimitMinutes() > 0)
                ? test.getTimeLimitMinutes()
                : 15;
        LocalDateTime deadline = attempt.getStartedAt().plusMinutes(timeLimit);
        boolean timeExpired = now.isAfter(deadline.plusMinutes(1));

        List<TestQuestion> testQuestions = testQuestionRepository.findByTestIdOrderByQuestionOrderAsc(test.getId());
        if (testQuestions.isEmpty()) {
            throw new BadRequestException("Test has no questions");
        }

        List<Question> questions = testQuestions.stream()
                .map(TestQuestion::getQuestion)
                .collect(Collectors.toList());

        CareerAllocationResult allocationResult = careerAllocationService.evaluateAndAllocate(questions, answers);

        CareerPath careerPath = allocationResult.getRecommendedCareer();
        String highestCategory = allocationResult.getHighestCategory();

        // Only search category fallback if student achieved a non-zero score
        if (allocationResult.getObtainedScore() > 0) {
            if (careerPath == null && highestCategory != null && !highestCategory.isBlank() && !"GENERAL".equalsIgnoreCase(highestCategory)) {
                String norm = highestCategory.trim().toUpperCase().replace(" ", "_").replace("-", "_");
                careerPath = careerPathRepository.findByCategory(norm).orElse(null);
            }

            if (careerPath != null && (highestCategory == null || highestCategory.isBlank() || "GENERAL".equalsIgnoreCase(highestCategory))) {
                highestCategory = careerPath.getCategory();
            }
        } else {
            careerPath = null;
            highestCategory = null;
        }

        int matchScore = (int) Math.round(
                (allocationResult.getCareerMatchPercentage() > 0)
                        ? allocationResult.getCareerMatchPercentage()
                        : allocationResult.getPercentage()
        );

        AssessmentResult result = AssessmentResult.builder()
                .student(attempt.getStudent())
                .attempt(attempt)
                .recommendedCareer(careerPath)
                .category(highestCategory != null ? highestCategory : (careerPath != null ? careerPath.getCategory() : ""))
                .score(matchScore)
                .interestScore(allocationResult.getCorrectAnswers())
                .knowledgeScore(allocationResult.getObtainedScore())
                .completedAt(now)
                .build();

        AssessmentResult savedResult = assessmentResultRepository.save(result);

        for (AssessmentAnswer answer : allocationResult.getEvaluatedAnswers()) {
            answer.setResult(savedResult);
            assessmentAnswerRepository.save(answer);
        }

        attempt.setScore(matchScore);
        attempt.setSubmittedAt(now);
        attempt.setStatus(timeExpired ? AttemptStatus.AUTO_SUBMITTED : AttemptStatus.COMPLETED);
        testAttemptRepository.save(attempt);

        log.info("Test attempt ID {} evaluated. Recommended career: {}", attemptId, careerPath != null ? careerPath.getCareerName() : "None");


        CareerPathResponse careerResponse = careerPath != null ? CareerPathResponse.builder()
                .id(careerPath.getId())
                .careerName(careerPath.getCareerName())
                .category(careerPath.getCategory())
                .description(careerPath.getDescription())
                .skills(careerPath.getSkills())
                .education(careerPath.getEducation())
                .salaryRange(careerPath.getSalaryRange())
                .build() : null;

        return AssessmentResultResponse.builder()
                .resultId(savedResult.getId())
                .attemptId(attempt.getId())
                .testId(test.getId())
                .testName(test.getTestName())
                .obtainedScore(allocationResult.getObtainedScore())
                .maximumScore(allocationResult.getMaximumScore())
                .percentage((double) matchScore)
                .totalQuestions(allocationResult.getTotalQuestions())
                .attemptedQuestions(allocationResult.getAttemptedQuestions())
                .correctAnswers(allocationResult.getCorrectAnswers())
                .wrongAnswers(allocationResult.getWrongAnswers())
                .unansweredQuestions(allocationResult.getUnansweredQuestions())
                .highestCategory(highestCategory)
                .recommendedCareer(careerResponse)
                .categoryPerformance(allocationResult.getCategoryPerformance())
                .category(highestCategory)
                .interestScore(allocationResult.getCorrectAnswers())
                .knowledgeScore(allocationResult.getObtainedScore())
                .totalScore(matchScore)
                .description(careerPath != null ? careerPath.getDescription() : "")
                .skills(careerPath != null ? careerPath.getSkills() : "")
                .education(careerPath != null ? careerPath.getEducation() : "")
                .salaryRange(careerPath != null ? careerPath.getSalaryRange() : "")
                .completedAt(now)
                .build();
    }

    @Override
    @Transactional
    public AssessmentResultResponse autoSubmitTest(Long studentId, Long attemptId) {
        return autoSubmitTest(studentId, attemptId, Collections.emptyList());
    }

    @Override
    @Transactional
    public AssessmentResultResponse autoSubmitTest(Long studentId, Long attemptId, List<AssessmentAnswerRequest> answers) {
        log.info("Auto-submitting test attempt ID: {} for student ID: {} with {} answered questions",
                attemptId, studentId, answers != null ? answers.size() : 0);
        TestAttempt attempt = getAttempt(studentId, attemptId);

        if (attempt.getStatus() != AttemptStatus.IN_PROGRESS) {
            throw new BadRequestException("Test attempt is already submitted");
        }

        List<AssessmentAnswerRequest> finalAnswers = answers != null ? answers : Collections.emptyList();
        return submitTest(studentId, attemptId, finalAnswers);
    }
}