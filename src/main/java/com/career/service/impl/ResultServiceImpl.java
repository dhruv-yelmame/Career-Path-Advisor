package com.career.service.impl;

import com.career.dto.AssessmentResultResponse;
import com.career.dto.CareerPathResponse;
import com.career.dto.CategoryPerformanceResponse;
import com.career.dto.PaginatedResponse;
import com.career.dto.StudentResultResponse;
import com.career.dto.TestResultSummaryResponse;
import com.career.entity.AssessmentAnswer;
import com.career.entity.AssessmentResult;
import com.career.entity.CareerPath;
import com.career.entity.Question;
import com.career.entity.QuestionOption;
import com.career.entity.Test;
import com.career.entity.TestQuestion;
import com.career.exception.ResourceNotFoundException;
import com.career.repository.AssessmentAnswerRepository;
import com.career.repository.AssessmentResultRepository;
import com.career.repository.TestQuestionRepository;
import com.career.repository.TestRepository;
import com.career.service.ResultService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ResultServiceImpl implements ResultService {

    private static final Logger log = LoggerFactory.getLogger(ResultServiceImpl.class);

    private final AssessmentResultRepository assessmentResultRepository;
    private final TestRepository testRepository;
    private final AssessmentAnswerRepository assessmentAnswerRepository;
    private final TestQuestionRepository testQuestionRepository;

    public ResultServiceImpl(AssessmentResultRepository assessmentResultRepository,
                             TestRepository testRepository,
                             AssessmentAnswerRepository assessmentAnswerRepository,
                             TestQuestionRepository testQuestionRepository) {
        this.assessmentResultRepository = assessmentResultRepository;
        this.testRepository = testRepository;
        this.assessmentAnswerRepository = assessmentAnswerRepository;
        this.testQuestionRepository = testQuestionRepository;
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
        return getAllResultsPaged(null, null, page, size);
    }

    @Override
    public PaginatedResponse<StudentResultResponse> getAllResultsPaged(Long testId, String search, int page, int size) {
        log.debug("Fetching all results paged: testId={}, search={}, page={}, size={}", testId, search, page, size);
        String cleanedSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        Pageable pageable = PageRequest.of(page, size, Sort.by("completedAt").descending());
        Page<AssessmentResult> resultPage = assessmentResultRepository.findResultsByTestIdAndSearchPaged(testId, cleanedSearch, pageable);

        List<StudentResultResponse> content = resultPage.getContent()
                .stream()
                .map(r -> StudentResultResponse.builder()
                        .resultId(r.getId())
                        .testId(r.getAttempt() != null && r.getAttempt().getTest() != null ? r.getAttempt().getTest().getId() : null)
                        .testName(r.getAttempt() != null && r.getAttempt().getTest() != null ? r.getAttempt().getTest().getTestName() : "General Assessment")
                        .studentId(r.getStudent() != null ? r.getStudent().getId() : null)
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

    @Override
    public List<TestResultSummaryResponse> getTestsSummary() {
        log.debug("Generating tests summary analytics");
        List<Test> tests = testRepository.findAll(Sort.by(Sort.Direction.ASC, "id"));
        List<TestResultSummaryResponse> summaries = new ArrayList<>();

        for (Test test : tests) {
            List<AssessmentResult> results = assessmentResultRepository.findResultsByTestId(test.getId());
            long totalSubmissions = results.size();
            long totalStudents = results.stream()
                    .map(r -> r.getStudent() != null ? r.getStudent().getId() : null)
                    .filter(java.util.Objects::nonNull)
                    .distinct()
                    .count();
            double avgScore = 0.0;
            int maxScore = 0;
            int minScore = 0;
            LocalDateTime latest = null;

            if (!results.isEmpty()) {
                avgScore = results.stream().mapToInt(r -> r.getScore() != null ? r.getScore() : 0).average().orElse(0.0);
                maxScore = results.stream().mapToInt(r -> r.getScore() != null ? r.getScore() : 0).max().orElse(0);
                minScore = results.stream().mapToInt(r -> r.getScore() != null ? r.getScore() : 0).min().orElse(0);
                latest = results.get(0).getCompletedAt();
            }

            summaries.add(TestResultSummaryResponse.builder()
                    .testId(test.getId())
                    .testName(test.getTestName())
                    .description(test.getDescription())
                    .totalStudents(totalStudents)
                    .totalSubmissions(totalSubmissions)
                    .averageScore(Math.round(avgScore * 10.0) / 10.0)
                    .highestScore(maxScore)
                    .lowestScore(minScore)
                    .latestCompletedAt(latest)
                    .build());
        }

        return summaries;
    }

    private AssessmentResultResponse convertToResponse(AssessmentResult result) {
        CareerPath career = result.getRecommendedCareer();
        Long testId = null;
        String testName = "Career Assessment";
        Integer testQuestionCount = null;
        if (result.getAttempt() != null && result.getAttempt().getTest() != null) {
            Test t = result.getAttempt().getTest();
            testId = t.getId();
            testName = t.getTestName();
            testQuestionCount = t.getQuestionCount();
        }

        CareerPathResponse careerResponse = career != null ? CareerPathResponse.builder()
                .id(career.getId())
                .careerName(career.getCareerName())
                .category(career.getCategory())
                .description(career.getDescription())
                .skills(career.getSkills())
                .education(career.getEducation())
                .salaryRange(career.getSalaryRange())
                .build() : null;

        List<TestQuestion> testQuestions = (testId != null && testQuestionRepository != null)
                ? testQuestionRepository.findByTestIdOrderByQuestionOrderAsc(testId)
                : new ArrayList<>();

        List<AssessmentAnswer> answers = (assessmentAnswerRepository != null)
                ? assessmentAnswerRepository.findByResult(result)
                : new ArrayList<>();

        List<CategoryPerformanceResponse> categoryPerformance = new ArrayList<>();
        int totalQuestions = !testQuestions.isEmpty() ? testQuestions.size()
                : (testQuestionCount != null && testQuestionCount > 0 ? testQuestionCount
                : (!answers.isEmpty() ? answers.size() : 32));

        int attemptedQuestions = 0;
        int correctAnswers = result.getInterestScore() != null ? result.getInterestScore() : 0;
        int wrongAnswers = 0;
        int maximumScore = 0;
        int obtainedScore = result.getKnowledgeScore() != null ? result.getKnowledgeScore() : 0;

        Map<String, int[]> categoryStats = new LinkedHashMap<>();

        if (!testQuestions.isEmpty()) {
            for (TestQuestion tq : testQuestions) {
                Question q = tq.getQuestion();
                int qMarks = (q != null && q.getMarks() != null && q.getMarks() > 0) ? q.getMarks() : 10;
                maximumScore += qMarks;

                String cat = "GENERAL";
                if (q != null && q.getCategory() != null && !q.getCategory().isBlank()) {
                    cat = q.getCategory().trim().toUpperCase().replace(" ", "_").replace("-", "_");
                }
                int[] stats = categoryStats.computeIfAbsent(cat, k -> new int[2]);
                stats[1] += qMarks;
            }

            for (AssessmentAnswer ans : answers) {
                Question q = ans.getQuestion();
                QuestionOption opt = ans.getSelectedOption();
                int qMarks = (q != null && q.getMarks() != null && q.getMarks() > 0) ? q.getMarks() : 10;

                String cat = "GENERAL";
                if (q != null && q.getCategory() != null && !q.getCategory().isBlank()) {
                    cat = q.getCategory().trim().toUpperCase().replace(" ", "_").replace("-", "_");
                } else if (opt != null && opt.getCategory() != null && !opt.getCategory().isBlank()) {
                    cat = opt.getCategory().trim().toUpperCase().replace(" ", "_").replace("-", "_");
                }

                int[] stats = categoryStats.computeIfAbsent(cat, k -> new int[2]);
                if (opt != null) {
                    attemptedQuestions++;
                    if (opt.getScore() != null && opt.getScore() > 0) {
                        stats[0] += qMarks;
                    }
                }
            }
        } else if (!answers.isEmpty()) {
            for (AssessmentAnswer ans : answers) {
                Question q = ans.getQuestion();
                QuestionOption opt = ans.getSelectedOption();
                int qMarks = (q != null && q.getMarks() != null && q.getMarks() > 0) ? q.getMarks() : 10;
                maximumScore += qMarks;

                String cat = "GENERAL";
                if (q != null && q.getCategory() != null && !q.getCategory().isBlank()) {
                    cat = q.getCategory().trim().toUpperCase().replace(" ", "_").replace("-", "_");
                } else if (opt != null && opt.getCategory() != null && !opt.getCategory().isBlank()) {
                    cat = opt.getCategory().trim().toUpperCase().replace(" ", "_").replace("-", "_");
                }

                int[] stats = categoryStats.computeIfAbsent(cat, k -> new int[2]);
                stats[1] += qMarks;

                if (opt != null) {
                    attemptedQuestions++;
                    if (opt.getScore() != null && opt.getScore() > 0) {
                        stats[0] += qMarks;
                    }
                }
            }
        } else {
            maximumScore = totalQuestions * 10;
            attemptedQuestions = correctAnswers;
        }

        for (Map.Entry<String, int[]> entry : categoryStats.entrySet()) {
            int catObtained = entry.getValue()[0];
            int catMax = entry.getValue()[1];
            double catPct = catMax > 0 ? (catObtained * 100.0) / catMax : 0.0;
            categoryPerformance.add(CategoryPerformanceResponse.builder()
                    .category(entry.getKey())
                    .obtainedScore(catObtained)
                    .maximumScore(catMax)
                    .percentage(Math.round(catPct * 100.0) / 100.0)
                    .build());
        }

        categoryPerformance.sort((a, b) -> {
            int cmp = Double.compare(b.getPercentage(), a.getPercentage());
            if (cmp != 0) return cmp;
            return a.getCategory().compareTo(b.getCategory());
        });

        wrongAnswers = Math.max(0, attemptedQuestions - correctAnswers);

        int unansweredQuestions = Math.max(0, totalQuestions - attemptedQuestions);
        double matchScore = result.getScore() != null ? result.getScore().doubleValue() : 0.0;

        return AssessmentResultResponse.builder()
                .resultId(result.getId())
                .attemptId(result.getAttempt() != null ? result.getAttempt().getId() : null)
                .testId(testId)
                .testName(testName)
                .obtainedScore(obtainedScore)
                .maximumScore(maximumScore)
                .percentage(matchScore)
                .totalQuestions(totalQuestions)
                .attemptedQuestions(attemptedQuestions)
                .correctAnswers(correctAnswers)
                .wrongAnswers(wrongAnswers)
                .unansweredQuestions(unansweredQuestions)
                .highestCategory(result.getCategory())
                .recommendedCareer(careerResponse)
                .categoryPerformance(categoryPerformance)
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