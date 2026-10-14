package com.career.service;

import com.career.dto.AssessmentAnswerRequest;
import com.career.dto.CareerAllocationResult;
import com.career.dto.CategoryPerformanceResponse;
import com.career.entity.CareerPath;
import com.career.entity.Question;
import com.career.entity.QuestionOption;
import com.career.repository.CareerPathRepository;
import com.career.repository.QuestionOptionRepository;
import com.career.service.impl.CareerAllocationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CareerAllocationServiceTest {

	@Mock
	private QuestionOptionRepository questionOptionRepository;

	@Mock
	private CareerPathRepository careerPathRepository;

	@InjectMocks
	private CareerAllocationServiceImpl careerAllocationService;

	private CareerPath seCareer;
	private CareerPath deCareer;
	private CareerPath csCareer;
	private CareerPath ccCareer;
	private CareerPath aiCareer;
	private CareerPath webCareer;

	@BeforeEach
	void setUp() {
		seCareer = CareerPath.builder().id(1L).careerName("Software Engineer").category("SOFTWARE_ENGINEERING")
				.description("Software Development").build();

		deCareer = CareerPath.builder().id(2L).careerName("Data Engineer").category("DATA_ENGINEERING")
				.description("Data Pipelines & Processing").build();

		csCareer = CareerPath.builder().id(3L).careerName("Cyber Security Analyst").category("CYBER_SECURITY")
				.description("InfoSec & Threat Defense").build();

		ccCareer = CareerPath.builder().id(4L).careerName("Cloud Solutions Architect").category("CLOUD_COMPUTING")
				.description("Cloud Infrastructure & DevOps").build();

		aiCareer = CareerPath.builder().id(5L).careerName("AI/ML Engineer").category("AI_MACHINE_LEARNING")
				.description("Machine Learning & Neural Networks").build();

		webCareer = CareerPath.builder().id(6L).careerName("Full Stack Web Developer").category("WEB_DEVELOPMENT")
				.description("Web Applications").build();
	}

	private Question createQuestion(Long qId, String category, int marks, Long correctOptId, Long wrongOptId) {
		Question q = Question.builder().id(qId).questionText("Question " + qId).category(category).marks(marks)
				.options(new ArrayList<>()).build();

		QuestionOption correctOpt = QuestionOption.builder().id(correctOptId).optionText("Correct Option")
				.category(category).score(marks).question(q).build();

		QuestionOption wrongOpt = QuestionOption.builder().id(wrongOptId).optionText("Wrong Option").category(category)
				.score(0).question(q).build();

		q.getOptions().add(correctOpt);
		q.getOptions().add(wrongOpt);

		lenient().when(questionOptionRepository.findById(correctOptId)).thenReturn(Optional.of(correctOpt));
		lenient().when(questionOptionRepository.findById(wrongOptId)).thenReturn(Optional.of(wrongOpt));

		return q;
	}

	@Test
	@DisplayName("1. Correct answers: should award full marks and accurately calculate category and overall metrics")
	void testCorrectAnswersAwardMarks() {
		Question q1 = createQuestion(1L, "SOFTWARE_ENGINEERING", 10, 101L, 102L);
		when(careerPathRepository.findByCategory("SOFTWARE_ENGINEERING")).thenReturn(Optional.of(seCareer));

		List<AssessmentAnswerRequest> answers = List
				.of(AssessmentAnswerRequest.builder().questionId(1L).optionId(101L).build());

		CareerAllocationResult result = careerAllocationService.evaluateAndAllocate(List.of(q1), answers);

		assertNotNull(result);
		assertEquals(1, result.getTotalQuestions());
		assertEquals(1, result.getAttemptedQuestions());
		assertEquals(1, result.getCorrectAnswers());
		assertEquals(0, result.getWrongAnswers());
		assertEquals(0, result.getUnansweredQuestions());
		assertEquals(10, result.getMaximumScore());
		assertEquals(10, result.getObtainedScore());
		assertEquals(100.0, result.getPercentage());
		assertEquals(100.0, result.getCareerMatchPercentage());
		assertEquals("SOFTWARE_ENGINEERING", result.getHighestCategory());
		assertNotNull(result.getRecommendedCareer());
		assertEquals("Software Engineer", result.getRecommendedCareer().getCareerName());
	}

	@Test
	@DisplayName("2. Wrong answers: should award 0 marks and apply NO negative marking")
	void testWrongAnswersGiveZeroMarks() {
		Question q1 = createQuestion(1L, "SOFTWARE_ENGINEERING", 10, 101L, 102L);

		List<AssessmentAnswerRequest> answers = List
				.of(AssessmentAnswerRequest.builder().questionId(1L).optionId(102L).build() // wrong option
				);

		CareerAllocationResult result = careerAllocationService.evaluateAndAllocate(List.of(q1), answers);

		assertNotNull(result);
		assertEquals(1, result.getTotalQuestions());
		assertEquals(1, result.getAttemptedQuestions());
		assertEquals(0, result.getCorrectAnswers());
		assertEquals(1, result.getWrongAnswers());
		assertEquals(0, result.getUnansweredQuestions());
		assertEquals(10, result.getMaximumScore());
		assertEquals(0, result.getObtainedScore());
		assertEquals(0.0, result.getPercentage());
		assertNull(result.getHighestCategory(), "Zero score should not allocate a highest category");
		assertNull(result.getRecommendedCareer(), "Zero score should not recommend a career");
	}

	@Test
	@DisplayName("3. Unanswered questions: should award 0 marks without penalization")
	void testUnansweredQuestionsGiveZeroMarks() {
		Question q1 = createQuestion(1L, "SOFTWARE_ENGINEERING", 10, 101L, 102L);
		Question q2 = createQuestion(2L, "SOFTWARE_ENGINEERING", 10, 201L, 202L);
		when(careerPathRepository.findByCategory("SOFTWARE_ENGINEERING")).thenReturn(Optional.of(seCareer));

		// Answer only q1, leave q2 unanswered
		List<AssessmentAnswerRequest> answers = List
				.of(AssessmentAnswerRequest.builder().questionId(1L).optionId(101L).build());

		CareerAllocationResult result = careerAllocationService.evaluateAndAllocate(List.of(q1, q2), answers);

		assertNotNull(result);
		assertEquals(2, result.getTotalQuestions());
		assertEquals(1, result.getAttemptedQuestions());
		assertEquals(1, result.getCorrectAnswers());
		assertEquals(0, result.getWrongAnswers());
		assertEquals(1, result.getUnansweredQuestions());
		assertEquals(20, result.getMaximumScore());
		assertEquals(10, result.getObtainedScore());
		assertEquals(50.0, result.getPercentage());
		assertEquals("SOFTWARE_ENGINEERING", result.getHighestCategory());
		assertEquals("Software Engineer", result.getRecommendedCareer().getCareerName());
	}

	@Test
	@DisplayName("4. Percentage comparison: higher percentage wins over higher raw marks (Section 4 Example)")
	void testCategoryPercentageWinsOverRawMarks() {
		// SOFTWARE_ENGINEERING: 5 questions, 50 max, 4 correct -> 40 obtained (80%)
		// DATA_ENGINEERING: 10 questions, 100 max, 7 correct -> 70 obtained (70%)
		List<Question> questions = new ArrayList<>();
		List<AssessmentAnswerRequest> answers = new ArrayList<>();

		// 5 SE questions: answer first 4 correct, 5th wrong
		for (long i = 1; i <= 5; i++) {
			Question q = createQuestion(i, "SOFTWARE_ENGINEERING", 10, 1000L + i, 2000L + i);
			questions.add(q);
			long chosenOptId = (i <= 4) ? (1000L + i) : (2000L + i);
			answers.add(AssessmentAnswerRequest.builder().questionId(i).optionId(chosenOptId).build());
		}

		// 10 DE questions: answer first 7 correct, remaining 3 wrong
		for (long i = 6; i <= 15; i++) {
			Question q = createQuestion(i, "DATA_ENGINEERING", 10, 1000L + i, 2000L + i);
			questions.add(q);
			long chosenOptId = (i <= 12) ? (1000L + i) : (2000L + i); // 6..12 is 7 questions
			answers.add(AssessmentAnswerRequest.builder().questionId(i).optionId(chosenOptId).build());
		}

		lenient().when(careerPathRepository.findByCategory("DATA_ENGINEERING")).thenReturn(Optional.of(deCareer));
		when(careerPathRepository.findByCategory("SOFTWARE_ENGINEERING")).thenReturn(Optional.of(seCareer));

		CareerAllocationResult result = careerAllocationService.evaluateAndAllocate(questions, answers);

		assertNotNull(result);
		assertEquals(15, result.getTotalQuestions());
		assertEquals(11, result.getCorrectAnswers());
		assertEquals(4, result.getWrongAnswers());
		assertEquals(150, result.getMaximumScore());
		assertEquals(110, result.getObtainedScore());

		// SE: 40/50 = 80%, DE: 70/100 = 70%
		// SOFTWARE_ENGINEERING must win because 80% > 70% even though DE raw score (70)
		// > SE raw score (40)
		assertEquals("SOFTWARE_ENGINEERING", result.getHighestCategory());
		assertEquals(80.0, result.getCareerMatchPercentage());
		assertNotNull(result.getRecommendedCareer());
		assertEquals("Software Engineer", result.getRecommendedCareer().getCareerName());

		List<CategoryPerformanceResponse> perf = result.getCategoryPerformance();
		assertEquals(2, perf.size());
		CategoryPerformanceResponse sePerf = perf.stream().filter(p -> p.getCategory().equals("SOFTWARE_ENGINEERING"))
				.findFirst().orElseThrow();
		assertEquals(50, sePerf.getMaximumScore());
		assertEquals(40, sePerf.getObtainedScore());
		assertEquals(80.0, sePerf.getPercentage());

		CategoryPerformanceResponse dePerf = perf.stream().filter(p -> p.getCategory().equals("DATA_ENGINEERING"))
				.findFirst().orElseThrow();
		assertEquals(100, dePerf.getMaximumScore());
		assertEquals(70, dePerf.getObtainedScore());
		assertEquals(70.0, dePerf.getPercentage());
	}

	@Test
	@DisplayName("5. Tie-breaking Rule 1: identical percentage -> category with higher obtained marks wins")
	void testTieBreaking_HigherObtainedMarksWins() {
		// CYBER_SECURITY: 2 questions = 20 max, 1 correct = 10 obtained (50%)
		// CLOUD_COMPUTING: 4 questions = 40 max, 2 correct = 20 obtained (50%)
		List<Question> questions = new ArrayList<>();
		List<AssessmentAnswerRequest> answers = new ArrayList<>();

		Question cs1 = createQuestion(1L, "CYBER_SECURITY", 10, 101L, 102L);
		Question cs2 = createQuestion(2L, "CYBER_SECURITY", 10, 201L, 202L);
		questions.addAll(List.of(cs1, cs2));
		answers.add(AssessmentAnswerRequest.builder().questionId(1L).optionId(101L).build()); // correct (10 pts)
		answers.add(AssessmentAnswerRequest.builder().questionId(2L).optionId(202L).build()); // wrong

		Question cc1 = createQuestion(3L, "CLOUD_COMPUTING", 10, 301L, 302L);
		Question cc2 = createQuestion(4L, "CLOUD_COMPUTING", 10, 401L, 402L);
		Question cc3 = createQuestion(5L, "CLOUD_COMPUTING", 10, 501L, 502L);
		Question cc4 = createQuestion(6L, "CLOUD_COMPUTING", 10, 601L, 602L);
		questions.addAll(List.of(cc1, cc2, cc3, cc4));
		answers.add(AssessmentAnswerRequest.builder().questionId(3L).optionId(301L).build()); // correct
		answers.add(AssessmentAnswerRequest.builder().questionId(4L).optionId(401L).build()); // correct (total 20 pts)
		answers.add(AssessmentAnswerRequest.builder().questionId(5L).optionId(502L).build()); // wrong
		answers.add(AssessmentAnswerRequest.builder().questionId(6L).optionId(602L).build()); // wrong

		lenient().when(careerPathRepository.findByCategory("CYBER_SECURITY")).thenReturn(Optional.of(csCareer));
		when(careerPathRepository.findByCategory("CLOUD_COMPUTING")).thenReturn(Optional.of(ccCareer));

		CareerAllocationResult result = careerAllocationService.evaluateAndAllocate(questions, answers);

		assertNotNull(result);
		// Both categories are 50.0%. CLOUD_COMPUTING has 20 marks vs CYBER_SECURITY 10
		// marks -> CLOUD_COMPUTING wins
		assertEquals("CLOUD_COMPUTING", result.getHighestCategory());
		assertEquals("Cloud Solutions Architect", result.getRecommendedCareer().getCareerName());
	}

	@Test
	@DisplayName("6. Tie-breaking Rule 2: identical percentage and marks -> higher correct answers count wins")
	void testTieBreaking_HigherCorrectCountWins() {
		// Category A: 3 questions of 10 marks = 30 max. 2 correct of 10 marks = 20
		// obtained (66.67%). Correct count = 2.
		// Category B: 6 questions of 5 marks = 30 max. 4 correct of 5 marks = 20
		// obtained (66.67%). Correct count = 4.
		List<Question> questions = new ArrayList<>();
		List<AssessmentAnswerRequest> answers = new ArrayList<>();

		Question a1 = createQuestion(1L, "DATA_ENGINEERING", 10, 101L, 102L);
		Question a2 = createQuestion(2L, "DATA_ENGINEERING", 10, 201L, 202L);
		Question a3 = createQuestion(3L, "DATA_ENGINEERING", 10, 301L, 302L);
		questions.addAll(List.of(a1, a2, a3));
		answers.add(AssessmentAnswerRequest.builder().questionId(1L).optionId(101L).build()); // correct (10)
		answers.add(AssessmentAnswerRequest.builder().questionId(2L).optionId(201L).build()); // correct (10) -> total
																								// 20, 2 correct
		answers.add(AssessmentAnswerRequest.builder().questionId(3L).optionId(302L).build()); // wrong

		Question b1 = createQuestion(4L, "SOFTWARE_ENGINEERING", 5, 401L, 402L);
		Question b2 = createQuestion(5L, "SOFTWARE_ENGINEERING", 5, 501L, 502L);
		Question b3 = createQuestion(6L, "SOFTWARE_ENGINEERING", 5, 601L, 602L);
		Question b4 = createQuestion(7L, "SOFTWARE_ENGINEERING", 5, 701L, 702L);
		Question b5 = createQuestion(8L, "SOFTWARE_ENGINEERING", 5, 801L, 802L);
		Question b6 = createQuestion(9L, "SOFTWARE_ENGINEERING", 5, 901L, 902L);
		questions.addAll(List.of(b1, b2, b3, b4, b5, b6));
		answers.add(AssessmentAnswerRequest.builder().questionId(4L).optionId(401L).build()); // correct (5)
		answers.add(AssessmentAnswerRequest.builder().questionId(5L).optionId(501L).build()); // correct (5)
		answers.add(AssessmentAnswerRequest.builder().questionId(6L).optionId(601L).build()); // correct (5)
		answers.add(AssessmentAnswerRequest.builder().questionId(7L).optionId(701L).build()); // correct (5) -> total
																								// 20, 4 correct
		answers.add(AssessmentAnswerRequest.builder().questionId(8L).optionId(802L).build()); // wrong
		answers.add(AssessmentAnswerRequest.builder().questionId(9L).optionId(902L).build()); // wrong

		when(careerPathRepository.findByCategory("SOFTWARE_ENGINEERING")).thenReturn(Optional.of(seCareer));

		CareerAllocationResult result = careerAllocationService.evaluateAndAllocate(questions, answers);

		assertNotNull(result);
		// Both are 66.67% and 20 marks. SOFTWARE_ENGINEERING has 4 correct answers vs
		// DATA_ENGINEERING 2 -> SE wins
		assertEquals("SOFTWARE_ENGINEERING", result.getHighestCategory());
		assertEquals("Software Engineer", result.getRecommendedCareer().getCareerName());
	}

	@Test
	@DisplayName("7. Tie-breaking Rule 3: identical percentage, marks, and count -> alphabetical ordering wins")
	void testTieBreaking_AlphabeticalOrderWins() {
		// AI_MACHINE_LEARNING vs WEB_DEVELOPMENT: Both 1 question, 10 max, 1 correct =
		// 10 obtained (100%), 1 correct count.
		Question qAI = createQuestion(1L, "AI_MACHINE_LEARNING", 10, 101L, 102L);
		Question qWeb = createQuestion(2L, "WEB_DEVELOPMENT", 10, 201L, 202L);

		List<AssessmentAnswerRequest> answers = List.of(
				AssessmentAnswerRequest.builder().questionId(1L).optionId(101L).build(), // correct
				AssessmentAnswerRequest.builder().questionId(2L).optionId(201L).build() // correct
		);

		lenient().when(careerPathRepository.findByCategory("WEB_DEVELOPMENT")).thenReturn(Optional.of(webCareer));
		when(careerPathRepository.findByCategory("AI_MACHINE_LEARNING")).thenReturn(Optional.of(aiCareer));

		CareerAllocationResult result = careerAllocationService.evaluateAndAllocate(List.of(qWeb, qAI), answers);

		assertNotNull(result);
		// Both 100%, 10 marks, 1 correct answer.
		// Alphabetical: 'AI_MACHINE_LEARNING' comes before 'WEB_DEVELOPMENT' ->
		// AI_MACHINE_LEARNING wins
		assertEquals("AI_MACHINE_LEARNING", result.getHighestCategory());
		assertEquals("AI/ML Engineer", result.getRecommendedCareer().getCareerName());
	}

	@Test
	@DisplayName("8. Zero-score case: all wrong answers -> highestCategory is null, recommendedCareer is null")
	void testZeroScoreAllWrong_ReturnsNullCareer() {
		Question q1 = createQuestion(1L, "SOFTWARE_ENGINEERING", 10, 101L, 102L);
		Question q2 = createQuestion(2L, "DATA_SCIENCE", 10, 201L, 202L);

		List<AssessmentAnswerRequest> answers = List.of(
				AssessmentAnswerRequest.builder().questionId(1L).optionId(102L).build(), // wrong
				AssessmentAnswerRequest.builder().questionId(2L).optionId(202L).build() // wrong
		);

		CareerAllocationResult result = careerAllocationService.evaluateAndAllocate(List.of(q1, q2), answers);

		assertNotNull(result);
		assertEquals(0, result.getObtainedScore());
		assertEquals(0.0, result.getPercentage());
		assertEquals(2, result.getWrongAnswers());
		assertEquals(0, result.getCorrectAnswers());
		assertNull(result.getHighestCategory(), "Zero score should not allocate a highest category");
		assertNull(result.getRecommendedCareer(), "Zero score should not recommend any career");
		verify(careerPathRepository, never()).findByCategory(anyString());
	}

	@Test
	@DisplayName("9. All unanswered case: no questions attempted -> highestCategory is null, recommendedCareer is null")
	void testAllUnanswered_ReturnsNullCareer() {
		Question q1 = createQuestion(1L, "SOFTWARE_ENGINEERING", 10, 101L, 102L);
		Question q2 = createQuestion(2L, "DATA_SCIENCE", 10, 201L, 202L);

		CareerAllocationResult result = careerAllocationService.evaluateAndAllocate(List.of(q1, q2), List.of());

		assertNotNull(result);
		assertEquals(2, result.getTotalQuestions());
		assertEquals(0, result.getAttemptedQuestions());
		assertEquals(2, result.getUnansweredQuestions());
		assertEquals(0, result.getObtainedScore());
		assertEquals(0.0, result.getPercentage());
		assertNull(result.getHighestCategory());
		assertNull(result.getRecommendedCareer());
		verify(careerPathRepository, never()).findByCategory(anyString());
	}

	@Test
	@DisplayName("10. Missing CareerPath match: highest category exists but DB has no CareerPath -> recommendedCareer is null")
	void testMissingCareerPathInDatabase_ReturnsNullRecommendedCareer() {
		Question q1 = createQuestion(1L, "SPECIAL_ROBOTICS", 10, 101L, 102L);

		List<AssessmentAnswerRequest> answers = List
				.of(AssessmentAnswerRequest.builder().questionId(1L).optionId(101L).build());

		when(careerPathRepository.findByCategory("SPECIAL_ROBOTICS")).thenReturn(Optional.empty());

		CareerAllocationResult result = careerAllocationService.evaluateAndAllocate(List.of(q1), answers);

		assertNotNull(result);
		assertEquals("SPECIAL_ROBOTICS", result.getHighestCategory());
		assertNull(result.getRecommendedCareer(), "Missing CareerPath should result in null recommendedCareer");
		verify(careerPathRepository, never()).save(any(CareerPath.class));
	}

	@Test
	@DisplayName("11. Division-by-Zero safety: empty questions list returns 0% safely")
	void testDivisionByZeroSafety_EmptyQuestions() {
		CareerAllocationResult result = careerAllocationService.evaluateAndAllocate(List.of(), List.of());

		assertNotNull(result);
		assertEquals(0, result.getTotalQuestions());
		assertEquals(0, result.getMaximumScore());
		assertEquals(0, result.getObtainedScore());
		assertEquals(0.0, result.getPercentage());
		assertNull(result.getHighestCategory());
		assertNull(result.getRecommendedCareer());
	}

	@Test
	@DisplayName("12. Java questions correctly answered should recommend Software Engineer, not Web Developer")
	void testJavaQuestionsRecommendSoftwareEngineer() {
		Question qJava = Question.builder().id(50L)
				.questionText("What is the primary function of the Java Virtual Machine (JVM)?").category("GENERAL") // In
																														// case
																														// category
																														// was
																														// left
																														// GENERAL
																														// or
																														// Java
				.marks(10).options(new ArrayList<>()).build();

		QuestionOption correctOpt = QuestionOption.builder().id(501L)
				.optionText("Executes Java bytecode and provides cross-platform portability").category("JAVA").score(10)
				.question(qJava).build();

		QuestionOption wrongOpt = QuestionOption.builder().id(502L).optionText("Compiles C++ code into assembly")
				.category("JAVA").score(0).question(qJava).build();

		qJava.getOptions().add(correctOpt);
		qJava.getOptions().add(wrongOpt);

		lenient().when(questionOptionRepository.findById(501L)).thenReturn(Optional.of(correctOpt));
		when(careerPathRepository.findByCategory("SOFTWARE_ENGINEERING")).thenReturn(Optional.of(seCareer));

		List<AssessmentAnswerRequest> answers = List
				.of(AssessmentAnswerRequest.builder().questionId(50L).optionId(501L).build());

		CareerAllocationResult result = careerAllocationService.evaluateAndAllocate(List.of(qJava), answers);

		assertNotNull(result);
		assertEquals("SOFTWARE_ENGINEERING", result.getHighestCategory());
		assertNotNull(result.getRecommendedCareer());
		assertEquals("Software Engineer", result.getRecommendedCareer().getCareerName());
		assertNotEquals("Full Stack Web Developer", result.getRecommendedCareer().getCareerName());
	}

	@Test
	@DisplayName("13. Computer Basics questions correctly answered should recommend Software Engineer / Systems, not Web Developer")
	void testComputerBasicsQuestionsRecommendSoftwareEngineer() {
		Question qBasics = Question.builder().id(60L).questionText(
				"Which computer component is responsible for executing arithmetic logic and instructions (ALU & CPU)?")
				.category("COMPUTER_BASICS").marks(10).options(new ArrayList<>()).build();

		QuestionOption correctOpt = QuestionOption.builder().id(601L).optionText("Central Processing Unit (CPU)")
				.category("COMPUTER_BASICS").score(10).question(qBasics).build();

		QuestionOption wrongOpt = QuestionOption.builder().id(602L).optionText("Power Supply Unit (PSU)")
				.category("COMPUTER_BASICS").score(0).question(qBasics).build();

		qBasics.getOptions().add(correctOpt);
		qBasics.getOptions().add(wrongOpt);

		lenient().when(questionOptionRepository.findById(601L)).thenReturn(Optional.of(correctOpt));
		when(careerPathRepository.findByCategory("SOFTWARE_ENGINEERING")).thenReturn(Optional.of(seCareer));

		List<AssessmentAnswerRequest> answers = List
				.of(AssessmentAnswerRequest.builder().questionId(60L).optionId(601L).build());

		CareerAllocationResult result = careerAllocationService.evaluateAndAllocate(List.of(qBasics), answers);

		assertNotNull(result);
		assertEquals("SOFTWARE_ENGINEERING", result.getHighestCategory());
		assertNotNull(result.getRecommendedCareer());
		assertEquals("Software Engineer", result.getRecommendedCareer().getCareerName());
		assertNotEquals("Full Stack Web Developer", result.getRecommendedCareer().getCareerName());
	}
}
