package com.career.service.impl;

import com.career.dto.AssessmentAnswerRequest;
import com.career.dto.AssessmentResultResponse;
import com.career.entity.*;
import com.career.exception.BadRequestException;
import com.career.exception.ResourceNotFoundException;
import com.career.repository.*;
import com.career.service.AssessmentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class AssessmentServiceImpl implements AssessmentService {

    private static final Logger log = LoggerFactory.getLogger(AssessmentServiceImpl.class);

    private final QuestionRepository questionRepository;
    private final QuestionOptionRepository questionOptionRepository;
    private final UserRepository userRepository;
    private final CareerPathRepository careerPathRepository;
    private final AssessmentResultRepository assessmentResultRepository;
    private final AssessmentAnswerRepository assessmentAnswerRepository;

    public AssessmentServiceImpl(QuestionRepository questionRepository,
                                 QuestionOptionRepository questionOptionRepository,
                                 UserRepository userRepository,
                                 CareerPathRepository careerPathRepository,
                                 AssessmentResultRepository assessmentResultRepository,
                                 AssessmentAnswerRepository assessmentAnswerRepository) {
        this.questionRepository = questionRepository;
        this.questionOptionRepository = questionOptionRepository;
        this.userRepository = userRepository;
        this.careerPathRepository = careerPathRepository;
        this.assessmentResultRepository = assessmentResultRepository;
        this.assessmentAnswerRepository = assessmentAnswerRepository;
    }

    @Override
    public List<Question> getQuestions() {
        log.debug("Fetching active assessment questions");
        return questionRepository.findByActiveTrue();
    }

    @Override
    @Transactional
    public AssessmentResultResponse submitAssessment(Long studentId, List<AssessmentAnswerRequest> answers) {
        log.info("Processing assessment submission for student ID: {}", studentId);

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with ID: " + studentId));

        if (answers == null || answers.isEmpty()) {
            throw new BadRequestException("Please answer at least one question");
        }

        Map<String, Integer> categoryScores = new HashMap<>();
        int interestScore = 0;
        int knowledgeScore = 0;
        List<AssessmentAnswer> selectedAnswers = new ArrayList<>();

        for (AssessmentAnswerRequest request : answers) {
            if (request.getOptionId() == null) continue;

            Question question = questionRepository.findById(request.getQuestionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Question not found with ID: " + request.getQuestionId()));

            if (!Boolean.TRUE.equals(question.getActive())) {
                throw new BadRequestException("Question ID " + question.getId() + " is inactive");
            }

            QuestionOption option = questionOptionRepository.findById(request.getOptionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Option not found with ID: " + request.getOptionId()));

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
        LocalDateTime now = LocalDateTime.now();

        AssessmentResult result = AssessmentResult.builder()
                .student(student)
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

        log.info("Assessment completed for student ID: {}. Result ID: {}", studentId, savedResult.getId());

        return AssessmentResultResponse.builder()
                .resultId(savedResult.getId())
                .attemptId(null)
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
}