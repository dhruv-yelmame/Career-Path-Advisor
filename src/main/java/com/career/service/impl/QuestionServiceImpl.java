package com.career.service.impl;

import com.career.config.CacheConfig;
import com.career.dto.*;
import com.career.entity.Question;
import com.career.entity.QuestionOption;
import com.career.exception.BadRequestException;
import com.career.exception.ResourceNotFoundException;
import com.career.repository.QuestionRepository;
import com.career.repository.TestRepository;
import com.career.service.QuestionService;
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
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class QuestionServiceImpl implements QuestionService {

    private static final Logger log = LoggerFactory.getLogger(QuestionServiceImpl.class);

    private final QuestionRepository questionRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;
    private final TestRepository testRepository;

    @org.springframework.beans.factory.annotation.Autowired
    public QuestionServiceImpl(QuestionRepository questionRepository,
                               org.springframework.jdbc.core.JdbcTemplate jdbcTemplate,
                               TestRepository testRepository) {
        this.questionRepository = questionRepository;
        this.jdbcTemplate = jdbcTemplate;
        this.testRepository = testRepository;
    }

    public QuestionServiceImpl(QuestionRepository questionRepository,
                               org.springframework.jdbc.core.JdbcTemplate jdbcTemplate) {
        this(questionRepository, jdbcTemplate, null);
    }

    @Override
    @Transactional
    @CacheEvict(value = {CacheConfig.CACHE_QUESTIONS, CacheConfig.CACHE_TESTS}, allEntries = true)
    public Question addQuestion(QuestionRequest request) {
        if (request == null) {
            throw new BadRequestException("Question request cannot be null");
        }
        log.info("Adding new question: {}", request.getQuestionText());
        validateQuestion(request);

        String questionCategory = resolveKeyword(request);
        int marks = request.getMarks() != null && request.getMarks() > 0 ? request.getMarks() : 10;
        com.career.entity.Test test = null;
        if (request.getTestId() != null && testRepository != null) {
            test = testRepository.findById(request.getTestId()).orElse(null);
        }

        Question question = Question.builder()
                .questionText(request.getQuestionText().trim())
                .category(questionCategory)
                .marks(marks)
                .test(test)
                .build();

        List<QuestionOption> options = createOptions(request.getOptions(), question, questionCategory, marks);
        question.setOptions(options);

        Question saved = questionRepository.save(question);
        log.info("Question saved with ID: {}", saved.getId());
        return saved;
    }

    @Override
    @Transactional
    @CacheEvict(value = {CacheConfig.CACHE_QUESTIONS, CacheConfig.CACHE_TESTS}, allEntries = true)
    public List<Question> addQuestionsBatch(List<QuestionRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            throw new BadRequestException("Batch question list cannot be empty");
        }
        log.info("Processing batch addition of {} questions", requests.size());

        List<Question> questionsToSave = requests.stream().map(req -> {
            if (req == null) {
                throw new BadRequestException("Question request in batch cannot be null");
            }
            validateQuestion(req);
            String questionCategory = resolveKeyword(req);
            int marks = req.getMarks() != null && req.getMarks() > 0 ? req.getMarks() : 10;
            com.career.entity.Test test = null;
            if (req.getTestId() != null && testRepository != null) {
                test = testRepository.findById(req.getTestId()).orElse(null);
            }

            Question question = Question.builder()
                    .questionText(req.getQuestionText().trim())
                    .category(questionCategory)
                    .marks(marks)
                    .test(test)
                    .build();

            List<QuestionOption> options = createOptions(req.getOptions(), question, questionCategory, marks);
            question.setOptions(options);
            return question;
        }).collect(Collectors.toList());

        List<Question> saved = questionRepository.saveAll(questionsToSave);
        log.info("Successfully saved {} questions in batch", saved.size());
        return saved;
    }

    @Override
    @Cacheable(value = CacheConfig.CACHE_QUESTIONS)
    public List<Question> getAllQuestions() {
        log.debug("Fetching all questions from DB/Cache");
        return questionRepository.findAll(Sort.by("id").descending());
    }

    @Override
    public PaginatedResponse<QuestionResponse> getQuestionsPaged(int page, int size, String search) {
        log.debug("Fetching paged questions: page={}, size={}, search={}", page, size, search);
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());

        String searchTerm = (search != null && !search.trim().isEmpty()) ? search.trim() : null;

        Page<Question> questionPage = questionRepository.searchQuestions(searchTerm, pageable);

        List<QuestionResponse> content = questionPage.getContent()
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());

        return PaginatedResponse.<QuestionResponse>builder()
                .content(content)
                .pageNumber(questionPage.getNumber())
                .pageSize(questionPage.getSize())
                .totalElements(questionPage.getTotalElements())
                .totalPages(questionPage.getTotalPages())
                .first(questionPage.isFirst())
                .last(questionPage.isLast())
                .build();
    }

    @Override
    public Question getQuestionById(Long id) {
        if (id == null) {
            throw new BadRequestException("Question ID cannot be null");
        }
        log.debug("Fetching question by ID: {}", id);
        return questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found with ID: " + id));
    }

    @Override
    @Transactional
    @CacheEvict(value = {CacheConfig.CACHE_QUESTIONS, CacheConfig.CACHE_TESTS}, allEntries = true)
    public Question updateQuestion(Long id, QuestionRequest request) {
        if (id == null) {
            throw new BadRequestException("Question ID cannot be null");
        }
        if (request == null) {
            throw new BadRequestException("Question request cannot be null");
        }
        log.info("Updating question ID: {}", id);
        Question existing = getQuestionById(id);
        validateQuestion(request);

        String questionCategory = resolveKeyword(request);
        int marks = request.getMarks() != null && request.getMarks() > 0 ? request.getMarks() : 10;

        existing.setQuestionText(request.getQuestionText().trim());
        existing.setCategory(questionCategory);
        existing.setMarks(marks);

        if (request.getTestId() != null && testRepository != null) {
            existing.setTest(testRepository.findById(request.getTestId()).orElse(null));
        }

        existing.getOptions().clear();
        List<QuestionOption> updatedOptions = createOptions(request.getOptions(), existing, questionCategory, marks);
        existing.getOptions().addAll(updatedOptions);

        Question saved = questionRepository.save(existing);
        log.info("Question ID {} updated successfully", id);
        return saved;
    }

    @Override
    @Transactional
    @CacheEvict(value = {CacheConfig.CACHE_QUESTIONS, CacheConfig.CACHE_TESTS}, allEntries = true)
    public void deleteQuestion(Long id) {
        if (id == null) {
            throw new BadRequestException("Question ID cannot be null");
        }
        log.info("Deleting question ID: {}", id);
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found with ID: " + id));

        // 1. Clean up student answers referencing this question or its options
        try {
            jdbcTemplate.update("DELETE FROM assessment_answers WHERE question_id = ?", id);
        } catch (Exception e) {
            log.debug("Cleanup answers for question {}: {}", id, e.getMessage());
        }

        // 2. Remove from test question associations
        try {
            jdbcTemplate.update("DELETE FROM test_questions WHERE question_id = ?", id);
        } catch (Exception e) {
            log.debug("Cleanup test_questions for question {}: {}", id, e.getMessage());
        }

        // 3. Remove question options
        try {
            jdbcTemplate.update("DELETE FROM question_options WHERE question_id = ?", id);
        } catch (Exception e) {
            log.debug("Cleanup question_options for question {}: {}", id, e.getMessage());
        }

        // 4. Delete the question itself
        try {
            jdbcTemplate.update("DELETE FROM questions WHERE id = ?", id);
        } catch (Exception e) {
            questionRepository.delete(question);
        }

        log.info("Question ID {} and all references deleted successfully", id);
    }

    @Override
    @Transactional
    @CacheEvict(value = {CacheConfig.CACHE_QUESTIONS, CacheConfig.CACHE_TESTS}, allEntries = true)
    public void deleteQuestionsBatch(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return;
        }
        log.info("Batch deleting {} questions", ids.size());
        for (Long id : ids) {
            if (id != null) {
                deleteQuestion(id);
            }
        }
    }

    @Override
    public QuestionResponse convertToResponse(Question question) {
        if (question == null) {
            return null;
        }

        List<QuestionOptionResponse> options = Optional.ofNullable(question.getOptions())
                .orElse(List.of())
                .stream()
                .map(opt -> QuestionOptionResponse.builder()
                        .id(opt.getId())
                        .optionText(opt.getOptionText())
                        .category(opt.getCategory())
                        .score(opt.getScore())
                        .build())
                .collect(Collectors.toList());

        String keyword = options.stream()
                .map(QuestionOptionResponse::getCategory)
                .filter(c -> c != null && !c.trim().isEmpty())
                .findFirst()
                .orElse("GENERAL");

        String category = question.getCategory() != null && !question.getCategory().trim().isEmpty()
                ? question.getCategory()
                : keyword;
        int marks = question.getMarks() != null ? question.getMarks() : 10;
        Long testId = question.getTest() != null ? question.getTest().getId() : null;
        String testName = question.getTest() != null ? question.getTest().getTestName() : null;

        return QuestionResponse.builder()
                .id(question.getId())
                .questionText(question.getQuestionText())
                .keyword(category)
                .category(category)
                .marks(marks)
                .testId(testId)
                .testName(testName)
                .options(options)
                .build();
    }

    private String resolveKeyword(QuestionRequest request) {
        if (request == null) {
            return "GENERAL";
        }
        if (request.getKeyword() != null && !request.getKeyword().trim().isEmpty() && !request.getKeyword().trim().equalsIgnoreCase("GENERAL")) {
            return request.getKeyword().trim().toUpperCase();
        }
        if (request.getCategory() != null && !request.getCategory().trim().isEmpty() && !request.getCategory().trim().equalsIgnoreCase("GENERAL")) {
            return request.getCategory().trim().toUpperCase();
        }
        if (request.getOptions() != null) {
            for (QuestionOptionRequest opt : request.getOptions()) {
                if (opt != null && opt.getCategory() != null && !opt.getCategory().trim().isEmpty() && !opt.getCategory().trim().equalsIgnoreCase("GENERAL")) {
                    return opt.getCategory().trim().toUpperCase();
                }
            }
        }
        if (request.getQuestionText() != null && !request.getQuestionText().isBlank()) {
            String detected = CareerAllocationServiceImpl.detectCategoryFromText(request.getQuestionText());
            if (detected != null && !"GENERAL".equalsIgnoreCase(detected)) {
                return detected;
            }
        }
        if (request.getKeyword() != null && !request.getKeyword().trim().isEmpty()) {
            return request.getKeyword().trim().toUpperCase();
        }
        if (request.getCategory() != null && !request.getCategory().trim().isEmpty()) {
            return request.getCategory().trim().toUpperCase();
        }
        return "GENERAL";
    }

    private void validateQuestion(QuestionRequest request) {
        if (request == null) {
            throw new BadRequestException("Question request cannot be null");
        }
        if (request.getQuestionText() == null || request.getQuestionText().trim().isEmpty()) {
            throw new BadRequestException("Question text is required");
        }
        if (request.getOptions() == null || request.getOptions().isEmpty()) {
            throw new BadRequestException("At least one option is required");
        }

        String fallbackKeyword = resolveKeyword(request);

        for (QuestionOptionRequest option : request.getOptions()) {
            if (option == null || option.getOptionText() == null || option.getOptionText().trim().isEmpty()) {
                throw new BadRequestException("Option text is required for each option");
            }
            if (option.getCategory() == null || option.getCategory().trim().isEmpty()) {
                option.setCategory(fallbackKeyword);
            }
            if (option.getScore() == null) {
                option.setScore(10);
            }
        }
    }

    private List<QuestionOption> createOptions(List<QuestionOptionRequest> requests,
                                               Question question,
                                               String questionKeyword,
                                               int questionMarks) {
        List<QuestionOption> options = new ArrayList<>();
        String fallbackCategory = (questionKeyword != null && !questionKeyword.trim().isEmpty())
                ? questionKeyword.trim().toUpperCase()
                : "GENERAL";

        for (QuestionOptionRequest req : requests) {
            String category = (questionKeyword != null && !questionKeyword.trim().isEmpty())
                    ? questionKeyword.trim().toUpperCase()
                    : (req.getCategory() != null && !req.getCategory().trim().isEmpty()
                            ? req.getCategory().trim().toUpperCase()
                            : fallbackCategory);

            int score = req.getScore() != null ? req.getScore() : questionMarks;

            QuestionOption option = QuestionOption.builder()
                    .optionText(req.getOptionText().trim())
                    .category(category)
                    .score(score)
                    .question(question)
                    .build();
            options.add(option);
        }
        return options;
    }
}