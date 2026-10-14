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
                .category("TECHNICAL")
                .marks(10)
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

        com.career.service.CareerAllocationService careerAllocationService =
                new com.career.service.impl.CareerAllocationServiceImpl(questionOptionRepository, careerPathRepository);

        testAttemptService = new TestAttemptServiceImpl(
                testRepository,
                testQuestionRepository,
                testAttemptRepository,
                userRepository,
                questionOptionRepository,
                assessmentResultRepository,
                assessmentAnswerRepository,
                careerPathRepository,
                careerAllocationService
        );
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
                .score(100)
                .interestScore(1)
                .knowledgeScore(10)
                .completedAt(LocalDateTime.now())
                .build();

        when(assessmentResultRepository.save(any(AssessmentResult.class))).thenReturn(savedResult);

        AssessmentAnswerRequest answer = AssessmentAnswerRequest.builder()
                .questionId(101L)
                .optionId(501L)
                .build();

        AssessmentResultResponse result = testAttemptService.submitTest(1L, 1001L, List.of(answer));

        assertNotNull(result);
        assertNotNull(result.getRecommendedCareer());
        assertEquals("Software Engineer", result.getRecommendedCareer().getCareerName());
        assertEquals(100, result.getTotalScore());
        verify(assessmentResultRepository, times(1)).save(any(AssessmentResult.class));
    }

    @org.junit.jupiter.api.Test
    @DisplayName("Should evaluate 5 out of 10 correct answers as exactly 50%")
    void testSubmitTest_FiveOutOfTenCorrect_ShouldBeFiftyPercent() {
        List<TestQuestion> tenQuestions = new ArrayList<>();
        List<AssessmentAnswerRequest> answers = new ArrayList<>();

        for (long i = 1; i <= 10; i++) {
            Question q = Question.builder()
                    .id(100L + i)
                    .questionText("Question " + i)
                    .category("TECHNICAL")
                    .marks(10)
                    .options(new ArrayList<>())
                    .build();

            QuestionOption optCorrect = QuestionOption.builder()
                    .id(1000L + i)
                    .question(q)
                    .optionText("Correct Option")
                    .category("TECHNICAL")
                    .score(10)
                    .build();

            QuestionOption optWrong = QuestionOption.builder()
                    .id(2000L + i)
                    .question(q)
                    .optionText("Wrong Option")
                    .category("TECHNICAL")
                    .score(0)
                    .build();

            q.getOptions().add(optCorrect);
            q.getOptions().add(optWrong);

            TestQuestion tq = TestQuestion.builder()
                    .id(i)
                    .test(testEntity)
                    .question(q)
                    .questionOrder((int) i)
                    .build();
            tenQuestions.add(tq);

            // Answer first 5 questions with correct option, remaining 5 with wrong option
            long chosenOptId = (i <= 5) ? optCorrect.getId() : optWrong.getId();
            answers.add(AssessmentAnswerRequest.builder()
                    .questionId(q.getId())
                    .optionId(chosenOptId)
                    .build());

            when(questionOptionRepository.findById(chosenOptId))
                    .thenReturn(Optional.of(i <= 5 ? optCorrect : optWrong));
        }

        when(testAttemptRepository.findById(1001L)).thenReturn(Optional.of(attempt));
        when(testQuestionRepository.findByTestIdOrderByQuestionOrderAsc(10L)).thenReturn(tenQuestions);
        when(careerPathRepository.findByCategory("TECHNICAL")).thenReturn(Optional.of(careerPath));
        when(testAttemptRepository.save(any(TestAttempt.class))).thenReturn(attempt);

        AssessmentResult savedResult = AssessmentResult.builder()
                .id(999L)
                .student(student)
                .attempt(attempt)
                .recommendedCareer(careerPath)
                .category("TECHNICAL")
                .score(50)
                .interestScore(5)
                .knowledgeScore(50)
                .completedAt(LocalDateTime.now())
                .build();

        when(assessmentResultRepository.save(any(AssessmentResult.class))).thenReturn(savedResult);

        AssessmentResultResponse result = testAttemptService.submitTest(1L, 1001L, answers);

        assertNotNull(result);
        assertEquals(50, result.getTotalScore()); // 50%
        assertEquals(50, result.getKnowledgeScore()); // 50 marks
        assertEquals(5, result.getInterestScore()); // 5 correct answers
    }

    @org.junit.jupiter.api.Test
    @DisplayName("Should evaluate 0 correct answers as exactly 0%")
    void testSubmitTest_ZeroCorrect_ShouldBeZeroPercent() {
        List<TestQuestion> tenQuestions = new ArrayList<>();
        List<AssessmentAnswerRequest> answers = new ArrayList<>();

        for (long i = 1; i <= 10; i++) {
            Question q = Question.builder()
                    .id(100L + i)
                    .questionText("Question " + i)
                    .category("TECHNICAL")
                    .marks(10)
                    .options(new ArrayList<>())
                    .build();

            QuestionOption optCorrect = QuestionOption.builder()
                    .id(1000L + i)
                    .question(q)
                    .optionText("Correct Option")
                    .category("TECHNICAL")
                    .score(10)
                    .build();

            QuestionOption optWrong = QuestionOption.builder()
                    .id(2000L + i)
                    .question(q)
                    .optionText("Wrong Option")
                    .category("TECHNICAL")
                    .score(0)
                    .build();

            q.getOptions().add(optCorrect);
            q.getOptions().add(optWrong);

            TestQuestion tq = TestQuestion.builder()
                    .id(i)
                    .test(testEntity)
                    .question(q)
                    .questionOrder((int) i)
                    .build();
            tenQuestions.add(tq);

            // Student attended all 10 questions but got all wrong
            answers.add(AssessmentAnswerRequest.builder()
                    .questionId(q.getId())
                    .optionId(optWrong.getId())
                    .build());

            when(questionOptionRepository.findById(optWrong.getId())).thenReturn(Optional.of(optWrong));
        }

        when(testAttemptRepository.findById(1001L)).thenReturn(Optional.of(attempt));
        when(testQuestionRepository.findByTestIdOrderByQuestionOrderAsc(10L)).thenReturn(tenQuestions);
        when(testAttemptRepository.save(any(TestAttempt.class))).thenReturn(attempt);

        AssessmentResult savedResult = AssessmentResult.builder()
                .id(999L)
                .student(student)
                .attempt(attempt)
                .recommendedCareer(null)
                .category(null)
                .score(0)
                .interestScore(0)
                .knowledgeScore(0)
                .completedAt(LocalDateTime.now())
                .build();

        when(assessmentResultRepository.save(any(AssessmentResult.class))).thenReturn(savedResult);

        AssessmentResultResponse result = testAttemptService.submitTest(1L, 1001L, answers);

        assertNotNull(result);
        assertEquals(0, result.getTotalScore()); // 0%
        assertEquals(0, result.getKnowledgeScore()); // 0 marks
        assertEquals(0, result.getInterestScore()); // 0 correct answers
        assertNull(result.getRecommendedCareer(), "No career should be recommended for 0 score");
    }

    @org.junit.jupiter.api.Test
    @DisplayName("Should calculate remaining test time in seconds")
    void testGetRemainingSeconds() {
        when(testAttemptRepository.findById(1001L)).thenReturn(Optional.of(attempt));

        long remaining = testAttemptService.getRemainingSeconds(1L, 1001L);

        assertTrue(remaining > 0);
    }

    @org.junit.jupiter.api.Test
    @DisplayName("Step 4 & 5: Should evaluate dynamic maximumScore, obtainedScore, question counts and save test attempt answers")
    void testSubmitTest_EvaluationFormulasAndAssessmentAnswerPersistence() {
        // 4 questions with 10 marks each:
        // Q1: SOFTWARE_ENGINEERING (Answered Correct: +10)
        // Q2: SOFTWARE_ENGINEERING (Answered Wrong: +0)
        // Q3: DATA_SCIENCE (Unanswered: +0)
        // Q4: CYBER_SECURITY (Unanswered: +0)
        List<TestQuestion> testQuestions = new ArrayList<>();

        Question q1 = Question.builder().id(201L).questionText("Q1").category("SOFTWARE_ENGINEERING").marks(10).options(new ArrayList<>()).build();
        QuestionOption opt1Correct = QuestionOption.builder().id(601L).question(q1).optionText("Correct 1").category("SOFTWARE_ENGINEERING").score(10).build();
        QuestionOption opt1Wrong = QuestionOption.builder().id(602L).question(q1).optionText("Wrong 1").category("SOFTWARE_ENGINEERING").score(0).build();
        q1.getOptions().addAll(List.of(opt1Correct, opt1Wrong));

        Question q2 = Question.builder().id(202L).questionText("Q2").category("SOFTWARE_ENGINEERING").marks(10).options(new ArrayList<>()).build();
        QuestionOption opt2Correct = QuestionOption.builder().id(603L).question(q2).optionText("Correct 2").category("SOFTWARE_ENGINEERING").score(10).build();
        QuestionOption opt2Wrong = QuestionOption.builder().id(604L).question(q2).optionText("Wrong 2").category("SOFTWARE_ENGINEERING").score(0).build();
        q2.getOptions().addAll(List.of(opt2Correct, opt2Wrong));

        Question q3 = Question.builder().id(203L).questionText("Q3").category("DATA_SCIENCE").marks(10).options(new ArrayList<>()).build();
        QuestionOption opt3Correct = QuestionOption.builder().id(605L).question(q3).optionText("Correct 3").category("DATA_SCIENCE").score(10).build();
        q3.getOptions().add(opt3Correct);

        Question q4 = Question.builder().id(204L).questionText("Q4").category("CYBER_SECURITY").marks(10).options(new ArrayList<>()).build();
        QuestionOption opt4Correct = QuestionOption.builder().id(606L).question(q4).optionText("Correct 4").category("CYBER_SECURITY").score(10).build();
        q4.getOptions().add(opt4Correct);

        testQuestions.add(TestQuestion.builder().id(1L).test(testEntity).question(q1).questionOrder(1).build());
        testQuestions.add(TestQuestion.builder().id(2L).test(testEntity).question(q2).questionOrder(2).build());
        testQuestions.add(TestQuestion.builder().id(3L).test(testEntity).question(q3).questionOrder(3).build());
        testQuestions.add(TestQuestion.builder().id(4L).test(testEntity).question(q4).questionOrder(4).build());

        when(testAttemptRepository.findById(1001L)).thenReturn(Optional.of(attempt));
        when(testQuestionRepository.findByTestIdOrderByQuestionOrderAsc(10L)).thenReturn(testQuestions);
        when(questionOptionRepository.findById(601L)).thenReturn(Optional.of(opt1Correct));
        when(questionOptionRepository.findById(604L)).thenReturn(Optional.of(opt2Wrong));

        CareerPath seCareer = CareerPath.builder()
                .id(100L)
                .careerName("Software Engineer")
                .category("SOFTWARE_ENGINEERING")
                .build();
        when(careerPathRepository.findByCategory("SOFTWARE_ENGINEERING")).thenReturn(Optional.of(seCareer));
        when(testAttemptRepository.save(any(TestAttempt.class))).thenReturn(attempt);

        AssessmentResult savedResult = AssessmentResult.builder()
                .id(999L)
                .student(student)
                .attempt(attempt)
                .recommendedCareer(seCareer)
                .category("SOFTWARE_ENGINEERING")
                .score(50) // Domain match: 10 / 20 in SOFTWARE_ENGINEERING = 50%
                .interestScore(1)
                .knowledgeScore(10)
                .completedAt(LocalDateTime.now())
                .build();
        when(assessmentResultRepository.save(any(AssessmentResult.class))).thenReturn(savedResult);

        // Student submits answers only for Q1 (correct) and Q2 (wrong). Q3 and Q4 are omitted (unanswered).
        List<AssessmentAnswerRequest> submittedAnswers = List.of(
                AssessmentAnswerRequest.builder().questionId(201L).optionId(601L).build(),
                AssessmentAnswerRequest.builder().questionId(202L).optionId(604L).build()
        );

        AssessmentResultResponse result = testAttemptService.submitTest(1L, 1001L, submittedAnswers);

        assertNotNull(result);
        assertEquals(50, result.getTotalScore()); // domain match percentage = 50%
        assertEquals(10, result.getKnowledgeScore()); // obtainedScore = 10
        assertEquals(1, result.getInterestScore()); // correctAnswers = 1
        assertEquals("Software Engineer", result.getRecommendedCareer().getCareerName());

        // Verify AssessmentAnswer records were saved
        verify(assessmentAnswerRepository, times(2)).save(any(AssessmentAnswer.class));
    }
}
