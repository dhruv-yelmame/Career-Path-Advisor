package com.career.service.impl;

import com.career.config.CacheConfig;
import com.career.dto.*;
import com.career.entity.*;
import com.career.exception.BadRequestException;
import com.career.exception.ResourceNotFoundException;
import com.career.exception.UnauthorizedException;
import com.career.repository.*;
import com.career.service.EmailService;
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
    private final EmailService emailService;

    public TestAttemptServiceImpl(TestRepository testRepository,
                                  TestQuestionRepository testQuestionRepository,
                                  TestAttemptRepository testAttemptRepository,
                                  UserRepository userRepository,
                                  QuestionOptionRepository questionOptionRepository,
                                  AssessmentResultRepository assessmentResultRepository,
                                  AssessmentAnswerRepository assessmentAnswerRepository,
                                  CareerPathRepository careerPathRepository,
                                  EmailService emailService) {
        this.testRepository = testRepository;
        this.testQuestionRepository = testQuestionRepository;
        this.testAttemptRepository = testAttemptRepository;
        this.userRepository = userRepository;
        this.questionOptionRepository = questionOptionRepository;
        this.assessmentResultRepository = assessmentResultRepository;
        this.assessmentAnswerRepository = assessmentAnswerRepository;
        this.careerPathRepository = careerPathRepository;
        this.emailService = emailService;
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

        if (test.getStartTime() != null && now.isBefore(test.getStartTime())) {
            throw new BadRequestException("This test has not started yet");
        }

        Optional<TestAttempt> latestAttemptOpt = testAttemptRepository.findTopByStudentIdAndTestIdOrderByStartedAtDesc(studentId, testId);
        TestAttempt attemptToUse = null;
        LocalDateTime startedAt = now;
        LocalDateTime expiresAt = now.plusMinutes(test.getTimeLimitMinutes());

        if (latestAttemptOpt.isPresent()) {
            TestAttempt last = latestAttemptOpt.get();
            if (last.getStatus() == AttemptStatus.IN_PROGRESS) {
                LocalDateTime deadline = last.getStartedAt().plusMinutes(test.getTimeLimitMinutes());
                if (now.isBefore(deadline)) {
                    // Resume existing in-progress attempt
                    attemptToUse = last;
                    startedAt = last.getStartedAt();
                    expiresAt = deadline;
                } else {
                    last.setStatus(AttemptStatus.AUTO_SUBMITTED);
                    testAttemptRepository.save(last);
                }
            } else if (last.getStartedAt().isAfter(now.minusHours(24))) {
                throw new BadRequestException("You have already completed this assessment. You can re-attempt it after 24 hours.");
            }
        }

        List<TestQuestion> testQuestions = testQuestionRepository.findByTestIdOrderByQuestionOrderAsc(testId);
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
                    .questionType(q.getQuestionType())
                    .options(optionResponses)
                    .build());
        }

        log.info("Test attempt ID: {} ready. Expires at: {}", attemptToUse.getId(), expiresAt);

        return StartTestResponse.builder()
                .attemptId(attemptToUse.getId())
                .testId(test.getId())
                .testName(test.getTestName())
                .timeLimitMinutes(test.getTimeLimitMinutes())
                .startedAt(startedAt)
                .expiresAt(expiresAt)
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
        Optional<TestAttempt> latest = testAttemptRepository.findTopByStudentIdAndTestIdOrderByStartedAtDesc(studentId, testId);
        if (latest.isEmpty()) {
            return true;
        }
        TestAttempt last = latest.get();
        if (last.getStatus() == AttemptStatus.IN_PROGRESS) {
            return true; // Can resume in-progress attempt
        }
        LocalDateTime last24Hours = LocalDateTime.now().minusHours(24);
        return last.getStartedAt().isBefore(last24Hours);
    }

    @Override
    public long getRemainingSeconds(Long studentId, Long attemptId) {
        TestAttempt attempt = getAttempt(studentId, attemptId);
        if (attempt.getStatus() != AttemptStatus.IN_PROGRESS) {
            return 0;
        }

        LocalDateTime deadline = attempt.getStartedAt().plusMinutes(attempt.getTest().getTimeLimitMinutes());
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
        LocalDateTime deadline = attempt.getStartedAt().plusMinutes(test.getTimeLimitMinutes());
        boolean timeExpired = now.isAfter(deadline);

        List<TestQuestion> testQuestions = testQuestionRepository.findByTestIdOrderByQuestionOrderAsc(test.getId());
        if (testQuestions.isEmpty()) {
            throw new BadRequestException("Test has no questions");
        }

        Map<Long, Question> allowedQuestions = testQuestions.stream()
                .collect(Collectors.toMap(tq -> tq.getQuestion().getId(), TestQuestion::getQuestion));

        Map<String, Integer> categoryScores = new HashMap<>();
        int interestScore = 0;
        int knowledgeScore = 0;
        List<AssessmentAnswer> selectedAnswers = new ArrayList<>();

        if (answers != null) {
            for (AssessmentAnswerRequest ansReq : answers) {
                if (ansReq.getOptionId() == null) continue;

                Question question = allowedQuestions.get(ansReq.getQuestionId());
                if (question == null) {
                    throw new BadRequestException("Question ID " + ansReq.getQuestionId() + " does not belong to this test");
                }

                QuestionOption option = questionOptionRepository.findById(ansReq.getOptionId())
                        .orElseThrow(() -> new ResourceNotFoundException("Option not found with ID: " + ansReq.getOptionId()));

                if (!option.getQuestion().getId().equals(question.getId())) {
                    throw new BadRequestException("Invalid option selected for question ID " + question.getId());
                }

                int score = option.getScore() != null ? option.getScore() : 0;
                String category = option.getCategory() != null ? option.getCategory().trim().toUpperCase() : "";

                if (question.getQuestionType() == QuestionType.INTEREST) {
                    interestScore += score;
                    if (!category.isEmpty()) {
                        categoryScores.put(category, categoryScores.getOrDefault(category, 0) + score);
                    }
                } else if (question.getQuestionType() == QuestionType.CORRECT_ANSWER) {
                    if (Boolean.TRUE.equals(option.getCorrectAnswer())) {
                        knowledgeScore += score;
                        if (!category.isEmpty()) {
                            categoryScores.put(category, categoryScores.getOrDefault(category, 0) + score);
                        }
                    }
                }

                AssessmentAnswer answer = AssessmentAnswer.builder()
                        .question(question)
                        .selectedOption(option)
                        .build();
                selectedAnswers.add(answer);
            }
        }

        String highestCategory = categoryScores.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);

        CareerPath careerPath;
        if (highestCategory != null) {
            careerPath = careerPathRepository.findByCategory(highestCategory)
                    .orElseGet(() -> careerPathRepository.findAll().stream().findFirst()
                            .orElseThrow(() -> new ResourceNotFoundException("No career paths found in database")));
        } else {
            careerPath = careerPathRepository.findAll().stream().findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("No career paths found in database"));
            highestCategory = careerPath.getCategory();
        }

        int totalScore = interestScore + knowledgeScore;

        AssessmentResult result = AssessmentResult.builder()
                .student(attempt.getStudent())
                .attempt(attempt)
                .recommendedCareer(careerPath)
                .category(highestCategory)
                .score(totalScore)
                .interestScore(interestScore)
                .knowledgeScore(knowledgeScore)
                .completedAt(now)
                .build();

        AssessmentResult savedResult = assessmentResultRepository.save(result);

        for (AssessmentAnswer answer : selectedAnswers) {
            answer.setResult(savedResult);
            assessmentAnswerRepository.save(answer);
        }

        attempt.setScore(totalScore);
        attempt.setSubmittedAt(now);
        attempt.setStatus(timeExpired ? AttemptStatus.AUTO_SUBMITTED : AttemptStatus.COMPLETED);
        testAttemptRepository.save(attempt);

        log.info("Test attempt ID {} evaluated. Recommended career: {}", attemptId, careerPath.getCareerName());

        try {
            emailService.sendTestResultEmail(
                    attempt.getStudent().getEmail(),
                    attempt.getStudent().getName(),
                    test.getTestName(),
                    careerPath.getCareerName(),
                    totalScore,
                    careerPath.getDescription()
            );
        } catch (Exception e) {
            log.warn("Could not dispatch result email: {}", e.getMessage());
        }

        return AssessmentResultResponse.builder()
                .resultId(savedResult.getId())
                .attemptId(attempt.getId())
                .testId(test.getId())
                .testName(test.getTestName())
                .recommendedCareer(careerPath.getCareerName())
                .category(careerPath.getCategory())
                .interestScore(interestScore)
                .knowledgeScore(knowledgeScore)
                .totalScore(totalScore)
                .description(careerPath.getDescription())
                .skills(careerPath.getSkills())
                .education(careerPath.getEducation())
                .salaryRange(careerPath.getSalaryRange())
                .completedAt(now)
                .build();
    }

    @Override
    @Transactional
    public AssessmentResultResponse autoSubmitTest(Long studentId, Long attemptId) {
        log.info("Auto-submitting test attempt ID: {} for student ID: {}", attemptId, studentId);
        TestAttempt attempt = getAttempt(studentId, attemptId);

        if (attempt.getStatus() != AttemptStatus.IN_PROGRESS) {
            throw new BadRequestException("Test attempt is already submitted");
        }

        return submitTest(studentId, attemptId, new ArrayList<>());
    }
}