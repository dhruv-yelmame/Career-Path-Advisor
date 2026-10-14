package com.career.service.impl;

import com.career.dto.AssessmentAnswerRequest;
import com.career.dto.AssessmentResultResponse;
import com.career.dto.CareerAllocationResult;
import com.career.dto.CareerPathResponse;
import com.career.entity.*;
import com.career.exception.BadRequestException;
import com.career.exception.ResourceNotFoundException;
import com.career.repository.*;
import com.career.service.AssessmentService;
import com.career.service.CareerAllocationService;
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
    private final UserRepository userRepository;
    private final AssessmentResultRepository assessmentResultRepository;
    private final AssessmentAnswerRepository assessmentAnswerRepository;
    private final CareerAllocationService careerAllocationService;

    public AssessmentServiceImpl(QuestionRepository questionRepository,
                                 UserRepository userRepository,
                                 AssessmentResultRepository assessmentResultRepository,
                                 AssessmentAnswerRepository assessmentAnswerRepository,
                                 CareerAllocationService careerAllocationService) {
        this.questionRepository = questionRepository;
        this.userRepository = userRepository;
        this.assessmentResultRepository = assessmentResultRepository;
        this.assessmentAnswerRepository = assessmentAnswerRepository;
        this.careerAllocationService = careerAllocationService;
    }

    @Override
    public List<Question> getQuestions() {
        log.debug("Fetching assessment questions");
        return questionRepository.findAll();
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

        List<Question> questions = questionRepository.findAll();
        if (questions.isEmpty()) {
            throw new BadRequestException("No assessment questions found");
        }

        CareerAllocationResult allocationResult = careerAllocationService.evaluateAndAllocate(questions, answers);

        CareerPath careerPath = allocationResult.getRecommendedCareer();
        String highestCategory = allocationResult.getHighestCategory();
        int matchScore = (int) Math.round(
                (allocationResult.getCareerMatchPercentage() > 0)
                        ? allocationResult.getCareerMatchPercentage()
                        : allocationResult.getPercentage()
        );
        LocalDateTime now = LocalDateTime.now();

        AssessmentResult result = AssessmentResult.builder()
                .student(student)
                .recommendedCareer(careerPath)
                .category(highestCategory != null ? highestCategory : "")
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

        log.info("Assessment completed for student ID: {}. Result ID: {}, Recommended career: {}",
                studentId, savedResult.getId(), careerPath != null ? careerPath.getCareerName() : "None");

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
                .attemptId(null)
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
}