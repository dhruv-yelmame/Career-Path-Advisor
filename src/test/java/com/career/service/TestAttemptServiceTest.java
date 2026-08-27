package com.career.service;

import com.career.dto.AssessmentAnswerRequest;
import com.career.dto.AssessmentResultResponse;
import com.career.dto.StartTestResponse;
import com.career.entity.*;
import com.career.repository.*;
import com.career.service.impl.TestAttemptServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TestAttemptServiceTest {

    @Mock
    private TestAttemptRepository testAttemptRepository;

    @Mock
    private TestQuestionRepository testQuestionRepository;

    @Mock
    private TestAttemptAnswerRepository testAttemptAnswerRepository;

    @Mock
    private TestRepository testRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private QuestionRepository questionRepository;

    @Mock
    private QuestionOptionRepository questionOptionRepository;

    @Mock
    private CareerPathRepository careerPathRepository;

    @Mock
    private AssessmentResultRepository assessmentResultRepository;

    @Mock
    private AssessmentAnswerRepository assessmentAnswerRepository;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private TestAttemptServiceImpl testAttemptService;

    private User student;
    private com.career.entity.Test testEntity;
    private TestAttempt attempt;
    private Question question;
    private QuestionOption option;
    private TestQuestion testQuestion;
    private CareerPath careerPath;

    @BeforeEach
    void setUp() {
        student = User.builder()
                .id(1L)
                .name("Alex Smith")
                .email("alex@example.com")
                .role(Role.STUDENT)
                .build();

        testEntity = com.career.entity.Test.builder()
                .id(10L)
                .testName("General Career Test")
                .questionCount(1)
                .timeLimitMinutes(15)
                .randomQuestions(false)
                .active(true)
                .testQuestions(new ArrayList<>())
                .build();

        question = Question.builder()
                .id(101L)
                .questionText("Do you like programming?")
                .questionType(QuestionType.INTEREST)
                .active(true)
                .options(new ArrayList<>())
                .build();

        option = QuestionOption.builder()
                .id(501L)
                .question(question)
                .optionText("Yes definitely")
                .category("Technical")
                .score(10)
                .build();

        question.getOptions().add(option);

        testQuestion = TestQuestion.builder()
                .id(1L)
                .test(testEntity)
                .question(question)
                .questionOrder(1)
                .build();

        attempt = TestAttempt.builder()
                .id(1001L)
                .student(student)
                .test(testEntity)
                .startedAt(LocalDateTime.now())
                .status(AttemptStatus.IN_PROGRESS)
                .score(0)
                .build();

        careerPath = CareerPath.builder()
                .id(1L)
                .careerName("Software Engineer")
                .category("TECHNICAL")
                .description("Builds software")
                .skills("Java")
                .education("B.Tech")
                .salaryRange("$80,000")
                .build();
    }

    @org.junit.jupiter.api.Test
    @DisplayName("Should start a new test attempt for a student")
    void testStartTest_Success() {
        when(testRepository.findById(10L)).thenReturn(Optional.of(testEntity));
        when(userRepository.findById(1L)).thenReturn(Optional.of(student));
        when(testAttemptRepository.findTopByStudentIdAndTestIdOrderByStartedAtDesc(1L, 10L)).thenReturn(Optional.empty());
        when(testQuestionRepository.findByTestIdOrderByQuestionOrderAsc(10L)).thenReturn(List.of(testQuestion));
        when(testAttemptRepository.save(any(TestAttempt.class))).thenReturn(attempt);

        StartTestResponse response = testAttemptService.startTest(1L, 10L);

        assertNotNull(response);
        assertEquals(1001L, response.getAttemptId());
        assertEquals("General Career Test", response.getTestName());
        verify(testAttemptRepository, times(1)).save(any(TestAttempt.class));
    }

    @org.junit.jupiter.api.Test
    @DisplayName("Should submit test attempt, calculate score and career recommendation")
    void testSubmitTest_Success() {
        when(testAttemptRepository.findById(1001L)).thenReturn(Optional.of(attempt));
        when(testQuestionRepository.findByTestIdOrderByQuestionOrderAsc(10L)).thenReturn(List.of(testQuestion));
        when(questionOptionRepository.findById(501L)).thenReturn(Optional.of(option));
        when(careerPathRepository.findByCategory("TECHNICAL")).thenReturn(Optional.of(careerPath));
        when(testAttemptRepository.save(any(TestAttempt.class))).thenReturn(attempt);

        AssessmentResult savedResult = AssessmentResult.builder()
                .id(999L)
                .student(student)
                .attempt(attempt)
                .recommendedCareer(careerPath)
                .category("TECHNICAL")
                .score(10)
                .completedAt(LocalDateTime.now())
                .build();

        when(assessmentResultRepository.save(any(AssessmentResult.class))).thenReturn(savedResult);

        AssessmentAnswerRequest answer = AssessmentAnswerRequest.builder()
                .questionId(101L)
                .optionId(501L)
                .build();

        AssessmentResultResponse result = testAttemptService.submitTest(1L, 1001L, List.of(answer));

        assertNotNull(result);
        assertEquals("Software Engineer", result.getRecommendedCareer());
        assertEquals(10, result.getTotalScore());
        verify(assessmentResultRepository, times(1)).save(any(AssessmentResult.class));
        verify(emailService, times(1)).sendTestResultEmail(eq("alex@example.com"), eq("Alex Smith"), eq("General Career Test"), eq("Software Engineer"), eq(10), any());
    }

    @org.junit.jupiter.api.Test
    @DisplayName("Should calculate remaining test time in seconds")
    void testGetRemainingSeconds() {
        when(testAttemptRepository.findById(1001L)).thenReturn(Optional.of(attempt));

        long remaining = testAttemptService.getRemainingSeconds(1L, 1001L);

        assertTrue(remaining > 0);
    }
}
