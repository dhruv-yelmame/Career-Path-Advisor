package com.career.service.impl;

import com.career.dto.AssessmentAnswerRequest;
import com.career.dto.CareerAllocationResult;
import com.career.dto.CategoryPerformanceResponse;
import com.career.entity.AssessmentAnswer;
import com.career.entity.CareerPath;
import com.career.entity.Question;
import com.career.entity.QuestionOption;
import com.career.exception.BadRequestException;
import com.career.exception.ResourceNotFoundException;
import com.career.repository.CareerPathRepository;
import com.career.repository.QuestionOptionRepository;
import com.career.service.CareerAllocationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import java.util.*;

/**
 * Service implementing the Career Path Allocation and Recommendation logic.
 *
 * Evaluates student answers against database truth, computes category-level and
 * overall metrics, and deterministically allocates the highest-matching career
 * path recommendation.
 *
 * Deterministic Tie-Breaking Rules: 1. Higher category percentage
 * ((categoryObtainedScore * 100.0) / categoryMaximumScore). 2. If tied, higher
 * obtained score in the category. 3. If tied, higher number of correct answers
 * in the category. 4. If tied, stable alphabetical ordering of category name (A
 * to Z).
 */
@Service
public class CareerAllocationServiceImpl implements CareerAllocationService {

	private static final Logger log = LoggerFactory.getLogger(CareerAllocationServiceImpl.class);

	private final QuestionOptionRepository questionOptionRepository;
	private final CareerPathRepository careerPathRepository;

	public CareerAllocationServiceImpl(QuestionOptionRepository questionOptionRepository,
			CareerPathRepository careerPathRepository) {
		this.questionOptionRepository = questionOptionRepository;
		this.careerPathRepository = careerPathRepository;
	}

	@Override
	public CareerAllocationResult evaluateAndAllocate(List<Question> questions, List<AssessmentAnswerRequest> answers) {
		if (questions == null || questions.isEmpty()) {
			log.warn("Career allocation called with empty questions list");
			return CareerAllocationResult.builder().totalQuestions(0).attemptedQuestions(0).correctAnswers(0)
					.wrongAnswers(0).unansweredQuestions(0).maximumScore(0).obtainedScore(0).percentage(0.0)
					.highestCategory(null).recommendedCareer(null).categoryPerformance(new ArrayList<>())
					.evaluatedAnswers(new ArrayList<>()).build();
		}

		// Deduplicate submitted answers by questionId (latest non-null entry wins)
		Map<Long, Long> submittedAnswerMap = new HashMap<>();
		if (answers != null) {
			for (AssessmentAnswerRequest ans : answers) {
				if (ans != null && ans.getQuestionId() != null) {
					submittedAnswerMap.put(ans.getQuestionId(), ans.getOptionId());
				}
			}
		}

		int totalQuestions = questions.size();
		int correctAnswers = 0;
		int wrongAnswers = 0;
		int unansweredQuestions = 0;
		int maximumScore = 0;
		int obtainedScore = 0;

		List<AssessmentAnswer> evaluatedAnswers = new ArrayList<>();
		Map<String, CategoryTracker> categoryTrackerMap = new LinkedHashMap<>();

		for (Question question : questions) {
			if (question == null)
				continue;

			String category = resolveQuestionCategory(question);
			int qMarks = resolveQuestionMarks(question);

			maximumScore += qMarks;

			CategoryTracker tracker = categoryTrackerMap.computeIfAbsent(category, CategoryTracker::new);
			tracker.maximumScore += qMarks;

			Long selectedOptionId = submittedAnswerMap.get(question.getId());

			if (selectedOptionId == null) {
				// Unanswered question -> 0 marks awarded
				unansweredQuestions++;
			} else {
				// Attempted question -> validate option against DB truth
				QuestionOption selectedOption = questionOptionRepository.findById(selectedOptionId).orElseThrow(
						() -> new ResourceNotFoundException("Option not found with ID: " + selectedOptionId));

				if (selectedOption.getQuestion() == null
						|| !selectedOption.getQuestion().getId().equals(question.getId())) {
					throw new BadRequestException("Invalid option selected for question ID " + question.getId());
				}

				// Option awards marks if score > 0
				boolean isCorrect = selectedOption.getScore() != null && selectedOption.getScore() > 0;

				if (isCorrect) {
					correctAnswers++;
					obtainedScore += qMarks;
					tracker.obtainedScore += qMarks;
					tracker.correctCount++;
				} else {
					// Wrong answer -> 0 marks awarded (no negative marking)
					wrongAnswers++;
				}

				AssessmentAnswer answerEntity = AssessmentAnswer.builder().question(question)
						.selectedOption(selectedOption).build();
				evaluatedAnswers.add(answerEntity);
			}
		}

		int attemptedQuestions = correctAnswers + wrongAnswers;

		// Division-by-zero protection for overall score percentage
		double overallPercentage = maximumScore > 0 ? (obtainedScore * 100.0) / maximumScore : 0.0;
		double roundedOverallPercentage = Math.round(overallPercentage * 100.0) / 100.0;

		// Build category performance responses with division-by-zero protection
		List<CategoryPerformanceResponse> categoryPerformanceList = new ArrayList<>();
		for (CategoryTracker tracker : categoryTrackerMap.values()) {
			double catPct = tracker.maximumScore > 0 ? (tracker.obtainedScore * 100.0) / tracker.maximumScore : 0.0;
			double roundedCatPct = Math.round(catPct * 100.0) / 100.0;

			categoryPerformanceList.add(CategoryPerformanceResponse.builder().category(tracker.category)
					.obtainedScore(tracker.obtainedScore).maximumScore(tracker.maximumScore).percentage(roundedCatPct)
					.build());
		}

		// Sort category performance list descending by percentage, then category name
		categoryPerformanceList.sort((a, b) -> {
			int cmp = Double.compare(b.getPercentage(), a.getPercentage());
			if (cmp != 0)
				return cmp;
			return a.getCategory().compareTo(b.getCategory());
		});

		// Determine highest category with deterministic tie-breaking
		String highestCategory = null;
		CareerPath recommendedCareer = null;
		double careerMatchPercentage = 0.0;

		// Zero-score protection: If obtained score is 0 across all categories or all
		// questions are unanswered,
		// do not randomly select a career.
		boolean hasAnyScore = categoryTrackerMap.values().stream().anyMatch(t -> t.obtainedScore > 0);

		if (hasAnyScore) {
			CategoryTracker bestCategory = categoryTrackerMap.values().stream().filter(t -> t.maximumScore > 0)
					.max(CATEGORY_SELECTION_COMPARATOR).orElse(null);

			if (bestCategory != null) {
				highestCategory = bestCategory.category;
				careerMatchPercentage = Math.round(bestCategory.getPercentage() * 100.0) / 100.0;
				recommendedCareer = findCareerPathByBestMatch(highestCategory, questions);
				if (recommendedCareer != null && (highestCategory == null || "GENERAL".equalsIgnoreCase(highestCategory))) {
					highestCategory = recommendedCareer.getCategory();
				}
				if (recommendedCareer == null) {
					log.warn("No CareerPath found in database for category: {}", highestCategory);
				}
			}
		} else {
			log.info("Student scored 0 marks across all categories. No career path allocated.");
		}

		return CareerAllocationResult.builder().totalQuestions(totalQuestions).attemptedQuestions(attemptedQuestions)
				.correctAnswers(correctAnswers).wrongAnswers(wrongAnswers).unansweredQuestions(unansweredQuestions)
				.maximumScore(maximumScore).obtainedScore(obtainedScore).percentage(roundedOverallPercentage)
				.careerMatchPercentage(careerMatchPercentage)
				.highestCategory(highestCategory).recommendedCareer(recommendedCareer)
				.categoryPerformance(categoryPerformanceList).evaluatedAnswers(evaluatedAnswers).build();
	}

	/**
	 * Finds the most suitable CareerPath matching the category or questions content.
	 */
	private CareerPath findCareerPathByBestMatch(String category, List<Question> questions) {
		if (category != null && !category.trim().isEmpty() && !category.trim().equalsIgnoreCase("GENERAL")) {
			String normalized = normalizeCategory(category);
			Optional<CareerPath> cpOpt = careerPathRepository.findByCategory(normalized);
			if (cpOpt.isPresent()) {
				return cpOpt.get();
			}
			// Try finding by career name or case-insensitive match
			List<CareerPath> allPaths = careerPathRepository.findAll();
			for (CareerPath cp : allPaths) {
				if (cp.getCategory() != null && cp.getCategory().equalsIgnoreCase(normalized)) {
					return cp;
				}
			}
			for (CareerPath cp : allPaths) {
				if (cp.getCareerName() != null && cp.getCareerName().equalsIgnoreCase(category.trim())) {
					return cp;
				}
			}
			for (CareerPath cp : allPaths) {
				if (cp.getCategory() != null && (cp.getCategory().contains(normalized) || normalized.contains(cp.getCategory()))) {
					return cp;
				}
			}
			// Fallback alias mappings if category is DATA_ENGINEERING or DATA_ENGINEER
			if ("DATA_ENGINEERING".equals(normalized) || "DATA_ENGINEER".equals(normalized)) {
				Optional<CareerPath> bigDataCp = careerPathRepository.findByCategory("BIG_DATA");
				if (bigDataCp.isPresent()) {
					return bigDataCp.get();
				}
			}
		}

		// If category was GENERAL or not directly matched, scan question texts for predominant domain
		if (questions != null && !questions.isEmpty()) {
			Map<String, Integer> domainCounts = new HashMap<>();
			for (Question q : questions) {
				if (q == null) continue;
				String detected = detectCategoryFromText(q.getQuestionText());
				if (!"GENERAL".equals(detected)) {
					domainCounts.put(detected, domainCounts.getOrDefault(detected, 0) + 1);
				}
			}
			if (!domainCounts.isEmpty()) {
				String dominantDomain = domainCounts.entrySet().stream()
						.max(Map.Entry.comparingByValue())
						.map(Map.Entry::getKey)
						.orElse(null);
				if (dominantDomain != null) {
					Optional<CareerPath> domCp = careerPathRepository.findByCategory(dominantDomain);
					if (domCp.isPresent()) {
						log.info("Inferred dominant category {} from questions for career allocation", dominantDomain);
						return domCp.get();
					}
				}
			}
		}

		// Never arbitrarily default to allPaths.get(0) (e.g. Web Developer) if no match is found
		return null;
	}

	/**
	 * Normalizes category code to standard uppercase underscore format with domain aliasing.
	 */
	private String normalizeCategory(String cat) {
		if (cat == null || cat.isBlank()) return "GENERAL";
		String norm = cat.trim().toUpperCase().replace(" ", "_").replace("-", "_");

		// Aliases for Java and Software Engineering
		if (norm.equals("JAVA") || norm.equals("CORE_JAVA") || norm.equals("ADVANCED_JAVA")
				|| norm.equals("SOFTWARE_DEVELOPMENT") || norm.equals("SOFTWARE_DEVELOPER")
				|| norm.equals("PROGRAMMING") || norm.equals("CODING")
				|| norm.equals("OOP") || norm.equals("DATA_STRUCTURES")) {
			return "SOFTWARE_ENGINEERING";
		}

		// Aliases for Computer Basics, Systems and Computer Science
		if (norm.equals("COMPUTER_BASICS") || norm.equals("BASIC_COMPUTER") || norm.equals("COMPUTER_FUNDAMENTALS")
				|| norm.equals("COMPUTER_SCIENCE") || norm.equals("CS_FUNDAMENTALS") || norm.equals("OPERATING_SYSTEMS")
				|| norm.equals("SYSTEMS") || norm.equals("COMPUTER_SYSTEMS")) {
			return "SOFTWARE_ENGINEERING";
		}

		// Aliases for Web Development
		if (norm.equals("WEB_DEV") || norm.equals("WEB_DEVELOPER") || norm.equals("FRONTEND")
				|| norm.equals("BACKEND") || norm.equals("FULLSTACK") || norm.equals("FULL_STACK")) {
			return "WEB_DEVELOPMENT";
		}

		// Aliases for Cybersecurity
		if (norm.equals("CYBERSECURITY") || norm.equals("INFOSEC") || norm.equals("INFORMATION_SECURITY")
				|| norm.equals("ETHICAL_HACKING") || norm.equals("SECURITY")) {
			return "CYBER_SECURITY";
		}

		// Aliases for Cloud Computing
		if (norm.equals("CLOUD") || norm.equals("AWS") || norm.equals("AZURE") || norm.equals("GCP")) {
			return "CLOUD_COMPUTING";
		}

		// Aliases for AI & ML
		if (norm.equals("AI") || norm.equals("ML") || norm.equals("ARTIFICIAL_INTELLIGENCE")
				|| norm.equals("MACHINE_LEARNING") || norm.equals("DEEP_LEARNING")) {
			return "AI_MACHINE_LEARNING";
		}

		// Aliases for Data Science
		if (norm.equals("DATA") || norm.equals("DATA_ANALYTICS") || norm.equals("DATA_ANALYSIS")) {
			return "DATA_SCIENCE";
		}

		// Aliases for UI/UX & Design
		if (norm.equals("DESIGN") || norm.equals("UI_UX") || norm.equals("UIUX")
				|| norm.equals("UI_DESIGN") || norm.equals("UX_DESIGN") || norm.equals("PRODUCT_DESIGN")) {
			return "UI_UX_DESIGN";
		}

		// Aliases for Network Engineering
		if (norm.equals("NETWORKING") || norm.equals("NETWORK") || norm.equals("NETWORK_ADMIN")
				|| norm.equals("CCNA") || norm.equals("NETWORK_ENGINEER")) {
			return "NETWORK_ENGINEERING";
		}

		// Aliases for Business Intelligence
		if (norm.equals("BI") || norm.equals("POWER_BI") || norm.equals("TABLEAU")
				|| norm.equals("BUSINESS_ANALYTICS") || norm.equals("BI_CONSULTANT")) {
			return "BUSINESS_INTELLIGENCE";
		}

		// Aliases for Big Data (keep DATA_ENGINEERING distinct if passed directly, only map raw tags)
		if (norm.equals("SPARK") || norm.equals("HADOOP") || norm.equals("BIGDATA")) {
			return "BIG_DATA";
		}

		// Aliases for QA & Testing
		if (norm.equals("QA") || norm.equals("TESTING") || norm.equals("AUTOMATION_TESTING")
				|| norm.equals("TEST_AUTOMATION") || norm.equals("SOFTWARE_TESTING")) {
			return "QA_AUTOMATION";
		}

		// Aliases for IoT & Embedded
		if (norm.equals("IOT") || norm.equals("EMBEDDED") || norm.equals("EMBEDDED_SYSTEMS")
				|| norm.equals("INTERNET_OF_THINGS")) {
			return "IOT_EMBEDDED";
		}

		// Aliases for Robotics
		if (norm.equals("ROBOTICS") || norm.equals("AUTONOMOUS_SYSTEMS") || norm.equals("ROS")) {
			return "ROBOTICS_AI";
		}

		// Aliases for Game Development
		if (norm.equals("GAME_DEV") || norm.equals("GAME_DEVELOPER") || norm.equals("GAMING")
				|| norm.equals("UNITY") || norm.equals("UNREAL")) {
			return "GAME_DEVELOPMENT";
		}

		// Aliases for HR
		if (norm.equals("HR") || norm.equals("TALENT") || norm.equals("TALENT_ACQUISITION")
				|| norm.equals("RECRUITING") || norm.equals("RECRUITMENT")) {
			return "HUMAN_RESOURCES";
		}

		// Aliases for Product Management
		if (norm.equals("PRODUCT") || norm.equals("PRODUCT_MANAGER") || norm.equals("TECH_PM")) {
			return "PRODUCT_MANAGEMENT";
		}

		return norm;
	}

	/**
	 * Detects domain category from question text using domain keywords.
	 */
	public static String detectCategoryFromText(String text) {
		if (text == null || text.isBlank()) {
			return "GENERAL";
		}
		String lower = text.toLowerCase();

		// Data Science & Analytics
		if (lower.contains("data science") || lower.contains("dataset") || lower.contains("pandas")
				|| lower.contains("dataframe") || lower.contains("numpy") || lower.contains("csv")
				|| lower.contains("standard deviation") || lower.contains("median") || lower.contains("mode")
				|| lower.contains("mean of") || lower.contains("data cleaning") || lower.contains("missing value")
				|| lower.contains("data visualization") || lower.contains("exploratory data analysis")
				|| lower.contains("eda") || lower.contains("skewed") || lower.contains("correlation")
				|| (lower.contains("sql") && (lower.contains("data") || lower.contains("analytics")))) {
			return "DATA_SCIENCE";
		}

		// AI & Machine Learning
		if (lower.contains("machine learning") || lower.contains("supervised learning")
				|| lower.contains("unsupervised learning") || lower.contains("deep learning")
				|| lower.contains("neural network") || lower.contains("svm") || lower.contains("hyperplane")
				|| lower.contains("overfitting") || lower.contains("underfitting") || lower.contains("loss function")
				|| lower.contains("transformer") || lower.contains("nlp") || lower.contains("clustering")
				|| lower.contains("classification") || lower.contains("regression")) {
			return "AI_MACHINE_LEARNING";
		}

		// Web Development (Note: check JavaScript before Java checks to avoid ambiguity)
		if (lower.contains("javascript") || lower.contains("react") || lower.contains("html") || lower.contains("css")
				|| lower.contains("flexbox") || lower.contains("localstorage") || lower.contains("sessionstorage")
				|| lower.contains("cross-origin") || lower.contains("cors") || lower.contains("websocket")
				|| lower.contains("useeffect") || lower.contains("web development") || lower.contains("front-end")
				|| lower.contains("frontend") || lower.contains("dom manipulation") || lower.contains("nodejs")
				|| lower.contains("expressjs")) {
			return "WEB_DEVELOPMENT";
		}

		// Cybersecurity
		if (lower.contains("cyber") || lower.contains("phishing") || lower.contains("sql injection")
				|| lower.contains("tls") || lower.contains("cia triad") || lower.contains("mfa")
				|| lower.contains("firewall") || lower.contains("penetration testing") || lower.contains("encryption")
				|| lower.contains("vulnerability") || lower.contains("malware") || lower.contains("ransomware")
				|| lower.contains("ddos") || lower.contains("cryptography") || lower.contains("xss")) {
			return "CYBER_SECURITY";
		}

		// Cloud Computing
		if (lower.contains("cloud") || lower.contains("iaas") || lower.contains("paas")
				|| lower.contains("saas") || lower.contains("aws") || lower.contains("azure")
				|| lower.contains("s3") || lower.contains("serverless") || lower.contains("multi-az")
				|| lower.contains("horizontal scaling") || lower.contains("vertical scaling")) {
			return "CLOUD_COMPUTING";
		}

		// DevOps Engineering
		if (lower.contains("devops") || lower.contains("ci/cd") || lower.contains("kubernetes")
				|| lower.contains("docker") || lower.contains("terraform") || lower.contains("canary")
				|| lower.contains("prometheus") || lower.contains("grafana") || lower.contains("ansible")) {
			return "DEVOPS_ENGINEERING";
		}

		// Mobile Development
		if (lower.contains("mobile app") || lower.contains("flutter") || lower.contains("android")
				|| lower.contains("ios") || lower.contains("swift") || lower.contains("kotlin")
				|| lower.contains("viewmodel") || lower.contains("proguar") || lower.contains("activity")) {
			return "MOBILE_DEVELOPMENT";
		}

		// Software Engineering (includes Java, OOP, Data Structures, Algorithms, Computer Basics & Systems)
		if (lower.matches(".*\\bjava\\b.*") || lower.contains("jvm") || lower.contains("jdk") || lower.contains("jre")
				|| lower.contains("spring boot") || lower.contains("multithreading") || lower.contains("garbage collect")
				|| lower.contains("polymorphism") || lower.contains("inheritance") || lower.contains("encapsulation")
				|| lower.contains("abstraction") || lower.contains("object oriented") || lower.matches(".*\\boop\\b.*")
				|| lower.contains("data structure") || lower.contains("linked list") || lower.contains("binary search")
				|| lower.contains("stack") || lower.contains("queue") || lower.contains("tree traversal")
				|| lower.contains("c++") || lower.matches(".*\\bc#\\b.*") || lower.contains("pointer")
				|| lower.contains("dependency injection") || lower.contains("solid principle") || lower.contains("idempotent")
				|| lower.contains("acid") || lower.contains("design pattern") || lower.contains("hash table")
				|| lower.contains("binary search tree") || lower.contains("software engineering") || lower.contains("software development")
				|| lower.contains("computer basic") || lower.contains("computer fundamental")
				|| lower.contains("cpu") || lower.contains("alu") || lower.contains("operating system")
				|| lower.contains("ram") || lower.contains("rom") || lower.contains("cache memory")
				|| lower.contains("virtual memory") || lower.contains("compiler") || lower.contains("interpreter")
				|| lower.contains("motherboard") || lower.contains("binary number") || lower.contains("file system")) {
			return "SOFTWARE_ENGINEERING";
		}

		// Network Engineering
		if (lower.contains("cisco") || lower.contains("ccna") || lower.contains("subnet mask")
				|| lower.contains("ospf") || lower.contains("bgp") || lower.contains("routing protocol")
				|| lower.contains("wireshark") || lower.contains("tcp/ip") || lower.contains("three-way handshake")
				|| lower.contains("vlan") || lower.contains("packet analyzer") || lower.contains("dns")
				|| lower.contains("router") || lower.contains("switch port") || lower.contains("default gateway")) {
			return "NETWORK_ENGINEERING";
		}

		// Business Intelligence
		if (lower.contains("power bi") || lower.contains("dax") || lower.contains("calculate")
				|| lower.contains("tableau") || lower.contains("star schema") || lower.contains("snowflake schema")
				|| lower.contains("dimensional modeling") || lower.contains("fact table") || lower.contains("dimension table")
				|| lower.contains("business intelligence") || lower.contains("etl pipeline")) {
			return "BUSINESS_INTELLIGENCE";
		}

		// Blockchain & Web3
		if (lower.contains("blockchain") || lower.contains("solidity") || lower.contains("smart contract")
				|| lower.contains("ethereum") || lower.contains("web3") || lower.contains("dapp")
				|| lower.contains("crypto") || lower.contains("evm") || lower.contains("hardhat")) {
			return "BLOCKCHAIN";
		}

		// Game Development
		if (lower.contains("unity") || lower.contains("unreal") || lower.contains("game engine")
				|| lower.contains("gameplay") || lower.contains("rigidbody") || lower.contains("shader")
				|| lower.contains("blender") || lower.contains("3d modeling")) {
			return "GAME_DEVELOPMENT";
		}

		// Robotics & AI
		if (lower.contains("robotics") || lower.contains("ros 2") || lower.contains("ros2")
				|| lower.contains("robot operating system") || lower.contains("lidar") || lower.contains("kinematics")
				|| lower.contains("slam") || lower.contains("sensor fusion")) {
			return "ROBOTICS_AI";
		}

		// IoT & Embedded Systems
		if (lower.contains("iot") || lower.contains("embedded") || lower.contains("microcontroller")
				|| lower.contains("arduino") || lower.contains("raspberry pi") || lower.contains("esp32")
				|| lower.contains("rtos") || lower.contains("gpio") || lower.contains("i2c")
				|| lower.contains("spi") || lower.contains("mqtt")) {
			return "IOT_EMBEDDED";
		}

		// QA & Automation
		if (lower.contains("selenium") || lower.contains("playwright") || lower.contains("cypress")
				|| lower.contains("test automation") || lower.contains("test case") || lower.contains("istqb")
				|| lower.contains("testng") || lower.contains("jmeter") || lower.contains("regression testing")) {
			return "QA_AUTOMATION";
		}

		// Big Data & Data Engineering
		if (lower.contains("big data") || lower.contains("apache spark") || lower.contains("hadoop")
				|| lower.contains("kafka") || lower.contains("airflow") || lower.contains("data lake")
				|| lower.contains("databricks") || lower.contains("mapreduce")) {
			return "BIG_DATA";
		}

		// UI/UX & Design
		if (lower.contains("ui/ux") || lower.contains("figma") || lower.contains("wireframe")
				|| lower.contains("prototyp") || lower.contains("usability") || lower.contains("user experience")
				|| lower.contains("user journey") || lower.contains("design system")) {
			return "UI_UX_DESIGN";
		}

		// Product Management
		if (lower.contains("product manager") || lower.contains("product roadmap") || lower.contains("agile")
				|| lower.contains("scrum") || lower.contains("user story") || lower.contains("sprint")
				|| lower.contains("jira") || lower.contains("product backlog")) {
			return "PRODUCT_MANAGEMENT";
		}

		// Management Consulting & Strategy
		if (lower.contains("consulting") || lower.contains("swot") || lower.contains("porter")
				|| lower.contains("business strategy") || lower.contains("mckinsey") || lower.contains("market research")) {
			return "BUSINESS_MANAGEMENT";
		}

		// Marketing
		if (lower.contains("seo") || lower.contains("sem") || lower.contains("google ads")
				|| lower.contains("digital marketing") || lower.contains("conversion rate") || lower.contains("funnel optimization")) {
			return "MARKETING";
		}

		// Finance
		if (lower.contains("financial analysis") || lower.contains("investment banking") || lower.contains("dcf")
				|| lower.contains("valuation") || lower.contains("equity research") || lower.contains("cfa")
				|| lower.contains("balance sheet") || lower.contains("cash flow statement")) {
			return "FINANCE";
		}

		// Healthcare
		if (lower.contains("health informatics") || lower.contains("ehr") || lower.contains("hipaa")
				|| lower.contains("fhir") || lower.contains("clinical data") || lower.contains("bioinformatics")
				|| lower.contains("biomedical")) {
			return "HEALTHCARE";
		}

		// Human Resources
		if (lower.contains("human resources") || lower.contains("talent acquisition") || lower.contains("recruiting")
				|| lower.contains("workday") || lower.contains("hr analytics") || lower.contains("employee relations")) {
			return "HUMAN_RESOURCES";
		}

		// Personal & Leadership Coaching
		if (lower.contains("executive coaching") || lower.contains("active listening") || lower.contains("emotional intelligence")
				|| lower.contains("leadership development") || lower.contains("conflict resolution")) {
			return "PERSONAL";
		}

		return "GENERAL";
	}

	/**
	 * Resolves question category from question entity or its options. Prefers
	 * question entity's category, then correct option's category, falling back to
	 * smart text detection, and then 'GENERAL'.
	 */
	private String resolveQuestionCategory(Question question) {
		if (question != null && question.getCategory() != null && !question.getCategory().trim().isEmpty()
				&& !question.getCategory().trim().equalsIgnoreCase("GENERAL")) {
			return normalizeCategory(question.getCategory());
		}
		if (question != null && question.getOptions() != null && !question.getOptions().isEmpty()) {
			for (QuestionOption opt : question.getOptions()) {
				if (opt.getScore() != null && opt.getScore() > 0 && opt.getCategory() != null
						&& !opt.getCategory().trim().isEmpty()
						&& !opt.getCategory().trim().equalsIgnoreCase("GENERAL")) {
					return normalizeCategory(opt.getCategory());
				}
			}
			for (QuestionOption opt : question.getOptions()) {
				if (opt.getCategory() != null && !opt.getCategory().trim().isEmpty()
						&& !opt.getCategory().trim().equalsIgnoreCase("GENERAL")) {
					return normalizeCategory(opt.getCategory());
				}
			}
		}
		// Smart text detection if category was GENERAL or missing
		if (question != null && question.getQuestionText() != null) {
			String detected = detectCategoryFromText(question.getQuestionText());
			if (!"GENERAL".equals(detected)) {
				return detected;
			}
		}
		return "GENERAL";
	}

	/**
	 * Resolves question maximum marks from question entity or its options. Prefers
	 * question entity's marks, then positive option score, or default 10.
	 */
	private int resolveQuestionMarks(Question question) {
		if (question != null && question.getMarks() != null && question.getMarks() > 0) {
			return question.getMarks();
		}
		if (question == null || question.getOptions() == null || question.getOptions().isEmpty()) {
			return 10;
		}
		for (QuestionOption opt : question.getOptions()) {
			if (opt.getScore() != null && opt.getScore() > 0) {
				return opt.getScore();
			}
		}
		return 10;
	}

	/**
	 * Category performance tracker for category calculations and tie-breaking.
	 */
	private static class CategoryTracker {
		private final String category;
		private int maximumScore = 0;
		private int obtainedScore = 0;
		private int correctCount = 0;

		CategoryTracker(String category) {
			this.category = category;
		}

		double getPercentage() {
			return maximumScore > 0 ? (obtainedScore * 100.0) / maximumScore : 0.0;
		}
	}

	/**
	 * Deterministic Comparator for category allocation: 1. Higher category
	 * percentage ((obtainedScore * 100.0) / maximumScore) 2. Higher obtained marks
	 * in the category 3. Higher count of correct answers in the category 4. Stable
	 * alphabetical ordering of category name (A beats Z)
	 */
	private static final Comparator<CategoryTracker> CATEGORY_SELECTION_COMPARATOR = (a, b) -> {
		// Criterion 1: Higher category percentage
		int cmp = Double.compare(a.getPercentage(), b.getPercentage());
		if (cmp != 0) {
			return cmp;
		}

		// Criterion 2: Higher obtained marks
		cmp = Integer.compare(a.obtainedScore, b.obtainedScore);
		if (cmp != 0) {
			return cmp;
		}

		// Criterion 3: Higher count of correct answers
		cmp = Integer.compare(a.correctCount, b.correctCount);
		if (cmp != 0) {
			return cmp;
		}

		// Criterion 4: Stable alphabetical ordering (A comes before B, so 'a' beats 'b'
		// when a < b)
		return b.category.compareTo(a.category);
	};
}
