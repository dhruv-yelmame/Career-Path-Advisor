package com.career.service.impl;

import com.career.config.CacheConfig;
import com.career.dto.PaginatedResponse;
import com.career.dto.QuestionOptionRequest;
import com.career.dto.QuestionOptionResponse;
import com.career.dto.QuestionRequest;
import com.career.dto.QuestionResponse;
import com.career.entity.Question;
import com.career.entity.QuestionOption;
import com.career.entity.QuestionType;
import com.career.exception.BadRequestException;
import com.career.exception.ResourceNotFoundException;
import com.career.repository.QuestionRepository;
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

    public QuestionServiceImpl(QuestionRepository questionRepository,
                               org.springframework.jdbc.core.JdbcTemplate jdbcTemplate) {
        this.questionRepository = questionRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    @Transactional
    @CacheEvict(value = {CacheConfig.CACHE_QUESTIONS, CacheConfig.CACHE_TESTS}, allEntries = true)
    public Question addQuestion(QuestionRequest request) {
        log.info("Adding new question: {}", request.getQuestionText());
        QuestionType questionType = parseQuestionType(request.getQuestionType());
        validateQuestion(request, questionType);

        Question question = Question.builder()
                .questionText(request.getQuestionText().trim())
                .questionType(questionType)
                .active(true)
                .build();

        List<QuestionOption> options = createOptions(request.getOptions(), question, questionType);
        question.setOptions(options);

        Question saved = questionRepository.save(question);
        log.info("Question saved with ID: {}", saved.getId());
        return saved;
    }

    @Override
    @Transactional
    @CacheEvict(value = {CacheConfig.CACHE_QUESTIONS, CacheConfig.CACHE_TESTS}, allEntries = true)
    public List<Question> addQuestionsBatch(List<QuestionRequest> requests) {
        log.info("Processing batch addition of {} questions", requests.size());
        if (requests == null || requests.isEmpty()) {
            throw new BadRequestException("Batch question list cannot be empty");
        }

        List<Question> questionsToSave = requests.stream().map(req -> {
            QuestionType qType = parseQuestionType(req.getQuestionType());
            validateQuestion(req, qType);
            Question question = Question.builder()
                    .questionText(req.getQuestionText().trim())
                    .questionType(qType)
                    .active(true)
                    .build();
            List<QuestionOption> options = createOptions(req.getOptions(), question, qType);
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
        return questionRepository.findAll();
    }

    @Override
    public PaginatedResponse<QuestionResponse> getQuestionsPaged(int page, int size, String search, String type) {
        log.debug("Fetching paged questions: page={}, size={}, search={}, type={}", page, size, search, type);
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());

        QuestionType questionType = null;
        if (type != null && !type.isBlank() && !type.equalsIgnoreCase("ALL")) {
            try {
                questionType = QuestionType.valueOf(type.trim().toUpperCase());
            } catch (IllegalArgumentException ignored) {
            }
        }

        Page<Question> questionPage;
        String searchTerm = (search != null && !search.trim().isEmpty()) ? search.trim() : null;

        if (searchTerm != null || questionType != null) {
            questionPage = questionRepository.searchQuestions(searchTerm, questionType, pageable);
        } else {
            questionPage = questionRepository.findAll(pageable);
        }

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
        log.debug("Fetching question by ID: {}", id);
        return questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found with ID: " + id));
    }

    @Override
    @Transactional
    @CacheEvict(value = {CacheConfig.CACHE_QUESTIONS, CacheConfig.CACHE_TESTS}, allEntries = true)
    public Question updateQuestion(Long id, QuestionRequest request) {
        log.info("Updating question ID: {}", id);
        Question existing = getQuestionById(id);
        QuestionType questionType = parseQuestionType(request.getQuestionType());
        validateQuestion(request, questionType);

        existing.setQuestionText(request.getQuestionText().trim());
        existing.setQuestionType(questionType);

        existing.getOptions().clear();
        List<QuestionOption> updatedOptions = createOptions(request.getOptions(), existing, questionType);
        existing.getOptions().addAll(updatedOptions);

        Question saved = questionRepository.save(existing);
        log.info("Question ID {} updated successfully", id);
        return saved;
    }

    @Override
    @Transactional
    @CacheEvict(value = {CacheConfig.CACHE_QUESTIONS, CacheConfig.CACHE_TESTS}, allEntries = true)
    public void deleteQuestion(Long id) {
        log.info("Deleting question ID: {}", id);
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found with ID: " + id));

        // 1. Clean up student answers referencing this question or its options
        try {
            jdbcTemplate.update("DELETE FROM assessment_answers WHERE question_id = ?", id);
            jdbcTemplate.update("DELETE FROM test_attempt_answers WHERE question_id = ?", id);
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
    public QuestionResponse convertToResponse(Question question) {
        List<QuestionOptionResponse> options = Optional.ofNullable(question.getOptions())
                .orElse(List.of())
                .stream()
                .map(opt -> QuestionOptionResponse.builder()
                        .id(opt.getId())
                        .optionText(opt.getOptionText())
                        .category(opt.getCategory())
                        .score(opt.getScore())
                        .correctAnswer(opt.getCorrectAnswer())
                        .build())
                .collect(Collectors.toList());

        return QuestionResponse.builder()
                .id(question.getId())
                .questionText(question.getQuestionText())
                .questionType(question.getQuestionType() != null ? question.getQuestionType().name() : null)
                .active(question.getActive())
                .options(options)
                .build();
    }

    private QuestionType parseQuestionType(String type) {
        if (type == null || type.trim().isEmpty()) {
            throw new BadRequestException("Question type is required");
        }
        try {
            return QuestionType.valueOf(type.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid question type. Must be INTEREST or CORRECT_ANSWER.");
        }
    }

    private void validateQuestion(QuestionRequest request, QuestionType questionType) {
        if (request == null) {
            throw new BadRequestException("Question request cannot be null");
        }
        if (request.getQuestionText() == null || request.getQuestionText().trim().isEmpty()) {
            throw new BadRequestException("Question text is required");
        }
        if (request.getOptions() == null || request.getOptions().isEmpty()) {
            throw new BadRequestException("At least one option is required");
        }

        for (QuestionOptionRequest option : request.getOptions()) {
            if (option == null || option.getOptionText() == null || option.getOptionText().trim().isEmpty()) {
                throw new BadRequestException("Option text is required for each option");
            }
            if (option.getCategory() == null) {
                option.setCategory("");
            }
            if (option.getScore() == null) {
                option.setScore(0);
            }
        }

        if (questionType == QuestionType.CORRECT_ANSWER) {
            long correctCount = request.getOptions().stream()
                    .filter(opt -> Boolean.TRUE.equals(opt.getCorrectAnswer()))
                    .count();
            if (correctCount != 1) {
                throw new BadRequestException("CORRECT_ANSWER question must have exactly one correct option.");
            }
        } else if (questionType == QuestionType.INTEREST) {
            request.getOptions().forEach(opt -> opt.setCorrectAnswer(false));
        }
    }

    private List<QuestionOption> createOptions(List<QuestionOptionRequest> requests,
                                               Question question,
                                               QuestionType questionType) {
        List<QuestionOption> options = new ArrayList<>();
        for (QuestionOptionRequest req : requests) {
            QuestionOption option = QuestionOption.builder()
                    .optionText(req.getOptionText().trim())
                    .category(req.getCategory() != null ? req.getCategory().trim().toUpperCase() : "")
                    .score(req.getScore() != null ? req.getScore() : 0)
                    .correctAnswer(questionType == QuestionType.CORRECT_ANSWER && Boolean.TRUE.equals(req.getCorrectAnswer()))
                    .question(question)
                    .build();
            options.add(option);
        }
        return options;
    }
}