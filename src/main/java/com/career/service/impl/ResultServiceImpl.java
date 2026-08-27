package com.career.service.impl;

import com.career.dto.AssessmentResultResponse;
import com.career.dto.PaginatedResponse;
import com.career.dto.StudentResultResponse;
import com.career.entity.AssessmentResult;
import com.career.entity.CareerPath;
import com.career.exception.ResourceNotFoundException;
import com.career.repository.AssessmentResultRepository;
import com.career.service.ResultService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ResultServiceImpl implements ResultService {

    private static final Logger log = LoggerFactory.getLogger(ResultServiceImpl.class);

    private final AssessmentResultRepository assessmentResultRepository;

    public ResultServiceImpl(AssessmentResultRepository assessmentResultRepository) {
        this.assessmentResultRepository = assessmentResultRepository;
    }

    @Override
    public AssessmentResultResponse getResult(Long resultId) {
        log.debug("Fetching assessment result by ID: {}", resultId);
        AssessmentResult result = assessmentResultRepository.findById(resultId)
                .orElseThrow(() -> new ResourceNotFoundException("Result not found with id: " + resultId));

        return convertToResponse(result);
    }

    @Override
    public List<AssessmentResultResponse> getStudentResults(Long studentId) {
        log.debug("Fetching assessment results for student ID: {}", studentId);
        return assessmentResultRepository.findByStudentIdOrderByCompletedAtDesc(studentId)
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public PaginatedResponse<AssessmentResultResponse> getStudentResultsPaged(Long studentId, int page, int size) {
        log.debug("Fetching paged results for student ID {}: page={}, size={}", studentId, page, size);
        Pageable pageable = PageRequest.of(page, size, Sort.by("completedAt").descending());
        Page<AssessmentResult> resultPage = assessmentResultRepository.findByStudentIdPaged(studentId, pageable);

        List<AssessmentResultResponse> content = resultPage.getContent()
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());

        return PaginatedResponse.<AssessmentResultResponse>builder()
                .content(content)
                .pageNumber(resultPage.getNumber())
                .pageSize(resultPage.getSize())
                .totalElements(resultPage.getTotalElements())
                .totalPages(resultPage.getTotalPages())
                .first(resultPage.isFirst())
                .last(resultPage.isLast())
                .build();
    }

    @Override
    public PaginatedResponse<StudentResultResponse> getAllResultsPaged(int page, int size) {
        log.debug("Fetching all results paged: page={}, size={}", page, size);
        Pageable pageable = PageRequest.of(page, size, Sort.by("completedAt").descending());
        Page<AssessmentResult> resultPage = assessmentResultRepository.findAllResultsPaged(pageable);

        List<StudentResultResponse> content = resultPage.getContent()
                .stream()
                .map(r -> StudentResultResponse.builder()
                        .resultId(r.getId())
                        .testId(r.getAttempt() != null && r.getAttempt().getTest() != null ? r.getAttempt().getTest().getId() : null)
                        .testName(r.getAttempt() != null && r.getAttempt().getTest() != null ? r.getAttempt().getTest().getTestName() : "General Assessment")
                        .studentName(r.getStudent() != null ? r.getStudent().getName() : "Unknown")
                        .studentEmail(r.getStudent() != null ? r.getStudent().getEmail() : "Unknown")
                        .recommendedCareer(r.getRecommendedCareer() != null ? r.getRecommendedCareer().getCareerName() : "N/A")
                        .category(r.getCategory())
                        .interestScore(r.getInterestScore())
                        .knowledgeScore(r.getKnowledgeScore())
                        .totalScore(r.getScore())
                        .completedAt(r.getCompletedAt())
                        .build())
                .collect(Collectors.toList());

        return PaginatedResponse.<StudentResultResponse>builder()
                .content(content)
                .pageNumber(resultPage.getNumber())
                .pageSize(resultPage.getSize())
                .totalElements(resultPage.getTotalElements())
                .totalPages(resultPage.getTotalPages())
                .first(resultPage.isFirst())
                .last(resultPage.isLast())
                .build();
    }

    private AssessmentResultResponse convertToResponse(AssessmentResult result) {
        CareerPath career = result.getRecommendedCareer();
        Long testId = null;
        String testName = "Career Assessment";
        if (result.getAttempt() != null && result.getAttempt().getTest() != null) {
            testId = result.getAttempt().getTest().getId();
            testName = result.getAttempt().getTest().getTestName();
        }

        return AssessmentResultResponse.builder()
                .resultId(result.getId())
                .attemptId(result.getAttempt() != null ? result.getAttempt().getId() : null)
                .testId(testId)
                .testName(testName)
                .recommendedCareer(career != null ? career.getCareerName() : "N/A")
                .category(result.getCategory())
                .interestScore(result.getInterestScore())
                .knowledgeScore(result.getKnowledgeScore())
                .totalScore(result.getScore())
                .description(career != null ? career.getDescription() : "")
                .skills(career != null ? career.getSkills() : "")
                .education(career != null ? career.getEducation() : "")
                .salaryRange(career != null ? career.getSalaryRange() : "")
                .completedAt(result.getCompletedAt())
                .build();
    }
}