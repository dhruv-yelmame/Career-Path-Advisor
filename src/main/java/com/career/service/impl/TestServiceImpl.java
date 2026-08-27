package com.career.service.impl;

import com.career.config.CacheConfig;
import com.career.dto.PaginatedResponse;
import com.career.dto.TestQuestionResponse;
import com.career.dto.TestRequest;
import com.career.dto.TestResponse;
import com.career.entity.Question;
import com.career.entity.Test;
import com.career.entity.TestQuestion;
import com.career.exception.BadRequestException;
import com.career.exception.ResourceNotFoundException;
import com.career.repository.QuestionRepository;
import com.career.repository.TestAttemptRepository;
import com.career.repository.TestQuestionRepository;
import com.career.repository.TestRepository;
import com.career.service.TestService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TestServiceImpl implements TestService {

    private static final Logger log = LoggerFactory.getLogger(TestServiceImpl.class);

    private final TestRepository testRepository;
    private final TestQuestionRepository testQuestionRepository;
    private final QuestionRepository questionRepository;
    private final TestAttemptRepository testAttemptRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    public TestServiceImpl(TestRepository testRepository,
                           TestQuestionRepository testQuestionRepository,
                           QuestionRepository questionRepository,
                           TestAttemptRepository testAttemptRepository,
                           org.springframework.jdbc.core.JdbcTemplate jdbcTemplate) {
        this.testRepository = testRepository;
        this.testQuestionRepository = testQuestionRepository;
        this.questionRepository = questionRepository;
        this.testAttemptRepository = testAttemptRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    @Transactional
    @CacheEvict(value = CacheConfig.CACHE_TESTS, allEntries = true)
    public Test createTest(TestRequest request) {
        log.info("Creating test: {}", request.getTestName());
        validateTestRequest(request);

        Test test = Test.builder()
                .testName(request.getTestName().trim())
                .description(request.getDescription() != null ? request.getDescription().trim() : "")
                .questionCount(request.getQuestionCount())
                .timeLimitMinutes(request.getTimeLimitMinutes())
                .active(request.getActive() != null ? request.getActive() : true)
                .randomQuestions(request.getRandomQuestions() != null ? request.getRandomQuestions() : false)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .build();

        Test savedTest = testRepository.save(test);
        saveTestQuestions(savedTest, request.getQuestionIds());
        log.info("Test created with ID: {}", savedTest.getId());
        return savedTest;
    }

    @Override
    @Cacheable(value = CacheConfig.CACHE_TESTS)
    public List<TestResponse> getAllTests() {
        log.debug("Fetching all tests from DB/Cache");
        return testRepository.findAll()
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public PaginatedResponse<TestResponse> getTestsPaged(int page, int size, String search) {
        log.debug("Fetching paged tests: page={}, size={}, search={}", page, size, search);
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<Test> testPage;

        if (search != null && !search.trim().isEmpty()) {
            testPage = testRepository.searchTests(search.trim(), pageable);
        } else {
            testPage = testRepository.findAll(pageable);
        }

        List<TestResponse> responses = testPage.getContent()
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());

        return PaginatedResponse.<TestResponse>builder()
                .content(responses)
                .pageNumber(testPage.getNumber())
                .pageSize(testPage.getSize())
                .totalElements(testPage.getTotalElements())
                .totalPages(testPage.getTotalPages())
                .first(testPage.isFirst())
                .last(testPage.isLast())
                .build();
    }

    @Override
    public Test getTestById(Long id) {
        log.debug("Fetching test by ID: {}", id);
        return testRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Test not found with id: " + id));
    }

    @Override
    @Transactional
    @CacheEvict(value = CacheConfig.CACHE_TESTS, allEntries = true)
    public Test updateTest(Long id, TestRequest request) {
        log.info("Updating test ID: {}", id);
        validateTestRequest(request);
        Test test = getTestById(id);

        test.setTestName(request.getTestName().trim());
        test.setDescription(request.getDescription() != null ? request.getDescription().trim() : "");
        test.setQuestionCount(request.getQuestionCount());
        test.setTimeLimitMinutes(request.getTimeLimitMinutes());

        if (request.getActive() != null) {
            test.setActive(request.getActive());
        }

        if (request.getRandomQuestions() != null) {
            test.setRandomQuestions(request.getRandomQuestions());
        }

        test.setStartTime(request.getStartTime());
        test.setEndTime(request.getEndTime());

        testQuestionRepository.deleteByTestId(id);
        testQuestionRepository.flush();

        saveTestQuestions(test, request.getQuestionIds());

        Test updated = testRepository.save(test);
        log.info("Test ID {} updated successfully", id);
        return updated;
    }

    @Override
    @Transactional
    @CacheEvict(value = CacheConfig.CACHE_TESTS, allEntries = true)
    public void deleteTest(Long id) {
        log.info("Deleting test ID: {}", id);
        Test test = getTestById(id);

        // 1. Clean up student answers, attempts, and results for this test
        try {
            jdbcTemplate.update(
                "DELETE aa FROM assessment_answers aa " +
                "JOIN assessment_results ar ON aa.result_id = ar.id " +
                "JOIN test_attempts ta ON ar.attempt_id = ta.id " +
                "WHERE ta.test_id = ?", id
            );

            jdbcTemplate.update(
                "DELETE taa FROM test_attempt_answers taa " +
                "JOIN test_attempts ta ON taa.attempt_id = ta.id " +
                "WHERE ta.test_id = ?", id
            );

            jdbcTemplate.update(
                "DELETE ar FROM assessment_results ar " +
                "JOIN test_attempts ta ON ar.attempt_id = ta.id " +
                "WHERE ta.test_id = ?", id
            );

            jdbcTemplate.update("DELETE FROM test_attempts WHERE test_id = ?", id);
        } catch (Exception e) {
            log.debug("Cleanup attempts for test {}: {}", id, e.getMessage());
        }

        // 2. Clean up test questions
        try {
            jdbcTemplate.update("DELETE FROM test_questions WHERE test_id = ?", id);
        } catch (Exception e) {
            testQuestionRepository.deleteByTestId(id);
        }

        // 3. Delete the test itself
        try {
            jdbcTemplate.update("DELETE FROM tests WHERE id = ?", id);
        } catch (Exception e) {
            testRepository.delete(test);
        }

        log.info("Test ID {} and all associated attempts/results deleted successfully", id);
    }

    @Override
    public List<TestQuestionResponse> getTestQuestions(Long testId) {
        getTestById(testId);
        return testQuestionRepository.findByTestIdOrderByQuestionOrderAsc(testId)
                .stream()
                .map(tq -> TestQuestionResponse.builder()
                        .questionId(tq.getQuestion().getId())
                        .questionOrder(tq.getQuestionOrder())
                        .questionText(tq.getQuestion().getQuestionText())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    @CacheEvict(value = CacheConfig.CACHE_TESTS, allEntries = true)
    public Test activateTest(Long testId) {
        log.info("Activating test ID: {}", testId);
        Test test = getTestById(testId);
        test.setActive(true);
        return testRepository.save(test);
    }

    @Override
    @Transactional
    @CacheEvict(value = CacheConfig.CACHE_TESTS, allEntries = true)
    public Test deactivateTest(Long testId) {
        log.info("Deactivating test ID: {}", testId);
        Test test = getTestById(testId);
        test.setActive(false);
        return testRepository.save(test);
    }

    @Override
    public TestResponse convertToResponse(Test test) {
        long count = 0L;
        try {
            count = testAttemptRepository.countByTestId(test.getId());
        } catch (Exception ignored) {
        }

        return TestResponse.builder()
                .id(test.getId())
                .testName(test.getTestName())
                .description(test.getDescription())
                .questionCount(test.getQuestionCount())
                .timeLimitMinutes(test.getTimeLimitMinutes())
                .active(test.getActive())
                .randomQuestions(test.getRandomQuestions())
                .startTime(test.getStartTime())
                .endTime(test.getEndTime())
                .createdAt(test.getCreatedAt())
                .studentCount(count)
                .build();
    }

    private void validateTestRequest(TestRequest request) {
        if (request == null) {
            throw new BadRequestException("Test request is required");
        }
        if (request.getTestName() == null || request.getTestName().trim().isEmpty()) {
            throw new BadRequestException("Test name is required");
        }
        if (request.getQuestionCount() == null || request.getQuestionCount() <= 0) {
            throw new BadRequestException("Question count must be greater than 0");
        }
        if (request.getTimeLimitMinutes() == null || request.getTimeLimitMinutes() <= 0) {
            throw new BadRequestException("Time limit must be greater than 0");
        }
        if (request.getQuestionIds() == null || request.getQuestionIds().isEmpty()) {
            throw new BadRequestException("Please select questions for the test");
        }
        if (request.getQuestionCount() != request.getQuestionIds().size()) {
            throw new BadRequestException("Selected questions (" + request.getQuestionIds().size() +
                    ") must match question count (" + request.getQuestionCount() + ")");
        }
        if (request.getStartTime() != null && request.getEndTime() != null &&
                request.getStartTime().isAfter(request.getEndTime())) {
            throw new BadRequestException("Start time must be before end time");
        }
    }

    private void saveTestQuestions(Test test, List<Long> questionIds) {
        List<TestQuestion> testQuestions = new ArrayList<>();
        int order = 1;

        for (Long questionId : questionIds) {
            Question question = questionRepository.findById(questionId)
                    .orElseThrow(() -> new ResourceNotFoundException("Question not found with id: " + questionId));

            TestQuestion testQuestion = TestQuestion.builder()
                    .test(test)
                    .question(question)
                    .questionOrder(order++)
                    .build();

            testQuestions.add(testQuestion);
        }

        testQuestionRepository.saveAll(testQuestions);
    }
}