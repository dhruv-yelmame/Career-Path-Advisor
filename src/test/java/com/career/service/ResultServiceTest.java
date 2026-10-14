package com.career.service;

import com.career.dto.PaginatedResponse;
import com.career.dto.StudentResultResponse;
import com.career.dto.TestResultSummaryResponse;
import com.career.entity.AssessmentResult;
import com.career.entity.CareerPath;
import com.career.entity.Test;
import com.career.entity.TestAttempt;
import com.career.entity.User;
import com.career.repository.AssessmentAnswerRepository;
import com.career.repository.AssessmentResultRepository;
import com.career.repository.TestQuestionRepository;
import com.career.repository.TestRepository;
import com.career.service.impl.ResultServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ResultServiceTest {

    @Mock
    private AssessmentResultRepository assessmentResultRepository;

    @Mock
    private TestRepository testRepository;

    @Mock
    private AssessmentAnswerRepository assessmentAnswerRepository;

    @Mock
    private TestQuestionRepository testQuestionRepository;

    @InjectMocks
    private ResultServiceImpl resultService;

    private User student;
    private Test test1;
    private CareerPath career;
    private TestAttempt attempt;
    private AssessmentResult result;

    @BeforeEach
    void setUp() {
        student = new User();
        student.setId(10L);
        student.setName("Aarav Sharma");
        student.setEmail("aarav@example.com");

        test1 = Test.builder()
                .id(1L)
                .testName("Test 1 - Full Stack Assessment")
                .description("Test Description")
                .build();

        career = CareerPath.builder()
                .id(5L)
                .careerName("Software Engineer")
                .category("SOFTWARE_ENGINEERING")
                .build();

        attempt = TestAttempt.builder()
                .id(101L)
                .student(student)
                .test(test1)
                .score(85)
                .build();

        result = AssessmentResult.builder()
                .id(501L)
                .student(student)
                .attempt(attempt)
                .recommendedCareer(career)
                .category("SOFTWARE_ENGINEERING")
                .score(85)
                .interestScore(40)
                .knowledgeScore(45)
                .completedAt(LocalDateTime.now())
                .build();
    }

    @org.junit.jupiter.api.Test
    @DisplayName("Should fetch results filtered by testId with pagination")
    void testGetAllResultsPaged_ByTestId() {
        Page<AssessmentResult> page = new PageImpl<>(List.of(result));
        when(assessmentResultRepository.findResultsByTestIdAndSearchPaged(eq(1L), isNull(), any(Pageable.class)))
                .thenReturn(page);

        PaginatedResponse<StudentResultResponse> response = resultService.getAllResultsPaged(1L, null, 0, 10);

        assertNotNull(response);
        assertEquals(1, response.getContent().size());
        StudentResultResponse item = response.getContent().get(0);
        assertEquals(1L, item.getTestId());
        assertEquals("Test 1 - Full Stack Assessment", item.getTestName());
        assertEquals("Aarav Sharma", item.getStudentName());
        assertEquals("aarav@example.com", item.getStudentEmail());
        assertEquals("Software Engineer", item.getRecommendedCareer());
        assertEquals(85, item.getTotalScore());

        verify(assessmentResultRepository, times(1))
                .findResultsByTestIdAndSearchPaged(eq(1L), isNull(), any(Pageable.class));
    }

    @org.junit.jupiter.api.Test
    @DisplayName("Should calculate test summary metrics correctly")
    void testGetTestsSummary() {
        when(testRepository.findAll(any(Sort.class))).thenReturn(List.of(test1));
        when(assessmentResultRepository.findResultsByTestId(1L)).thenReturn(List.of(result));

        List<TestResultSummaryResponse> summaries = resultService.getTestsSummary();

        assertNotNull(summaries);
        assertEquals(1, summaries.size());
        TestResultSummaryResponse summary = summaries.get(0);
        assertEquals(1L, summary.getTestId());
        assertEquals("Test 1 - Full Stack Assessment", summary.getTestName());
        assertEquals(1L, summary.getTotalStudents());
        assertEquals(1L, summary.getTotalSubmissions());
        assertEquals(85.0, summary.getAverageScore());
        assertEquals(85, summary.getHighestScore());
    }
}
