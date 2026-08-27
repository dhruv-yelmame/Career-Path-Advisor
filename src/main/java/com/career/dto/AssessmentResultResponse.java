package com.career.dto;

import java.time.LocalDateTime;

public class AssessmentResultResponse {

    private Long resultId;
    private Long attemptId;
    private Long testId;
    private String testName;
    private String recommendedCareer;
    private String category;
    private Integer interestScore;
    private Integer knowledgeScore;
    private Integer totalScore;
    private String description;
    private String skills;
    private String education;
    private String salaryRange;
    private LocalDateTime completedAt;

    public AssessmentResultResponse() {}

    public AssessmentResultResponse(Long resultId, Long attemptId, Long testId, String testName,
                                    String recommendedCareer, String category,
                                    Integer interestScore, Integer knowledgeScore, Integer totalScore,
                                    String description, String skills, String education, String salaryRange,
                                    LocalDateTime completedAt) {
        this.resultId = resultId;
        this.attemptId = attemptId;
        this.testId = testId;
        this.testName = testName;
        this.recommendedCareer = recommendedCareer;
        this.category = category;
        this.interestScore = interestScore;
        this.knowledgeScore = knowledgeScore;
        this.totalScore = totalScore;
        this.description = description;
        this.skills = skills;
        this.education = education;
        this.salaryRange = salaryRange;
        this.completedAt = completedAt;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long resultId;
        private Long attemptId;
        private Long testId;
        private String testName;
        private String recommendedCareer;
        private String category;
        private Integer interestScore;
        private Integer knowledgeScore;
        private Integer totalScore;
        private String description;
        private String skills;
        private String education;
        private String salaryRange;
        private LocalDateTime completedAt;

        public Builder resultId(Long resultId) { this.resultId = resultId; return this; }
        public Builder attemptId(Long attemptId) { this.attemptId = attemptId; return this; }
        public Builder testId(Long testId) { this.testId = testId; return this; }
        public Builder testName(String testName) { this.testName = testName; return this; }
        public Builder recommendedCareer(String recommendedCareer) { this.recommendedCareer = recommendedCareer; return this; }
        public Builder category(String category) { this.category = category; return this; }
        public Builder interestScore(Integer interestScore) { this.interestScore = interestScore; return this; }
        public Builder knowledgeScore(Integer knowledgeScore) { this.knowledgeScore = knowledgeScore; return this; }
        public Builder totalScore(Integer totalScore) { this.totalScore = totalScore; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder skills(String skills) { this.skills = skills; return this; }
        public Builder education(String education) { this.education = education; return this; }
        public Builder salaryRange(String salaryRange) { this.salaryRange = salaryRange; return this; }
        public Builder completedAt(LocalDateTime completedAt) { this.completedAt = completedAt; return this; }

        public AssessmentResultResponse build() {
            return new AssessmentResultResponse(resultId, attemptId, testId, testName, recommendedCareer, category, interestScore, knowledgeScore, totalScore, description, skills, education, salaryRange, completedAt);
        }
    }

    public Long getResultId() { return resultId; }
    public void setResultId(Long resultId) { this.resultId = resultId; }
    public Long getAttemptId() { return attemptId; }
    public void setAttemptId(Long attemptId) { this.attemptId = attemptId; }
    public Long getTestId() { return testId; }
    public void setTestId(Long testId) { this.testId = testId; }
    public String getTestName() { return testName; }
    public void setTestName(String testName) { this.testName = testName; }
    public String getRecommendedCareer() { return recommendedCareer; }
    public void setRecommendedCareer(String recommendedCareer) { this.recommendedCareer = recommendedCareer; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public Integer getInterestScore() { return interestScore; }
    public void setInterestScore(Integer interestScore) { this.interestScore = interestScore; }
    public Integer getKnowledgeScore() { return knowledgeScore; }
    public void setKnowledgeScore(Integer knowledgeScore) { this.knowledgeScore = knowledgeScore; }
    public Integer getTotalScore() { return totalScore; }
    public void setTotalScore(Integer totalScore) { this.totalScore = totalScore; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getSkills() { return skills; }
    public void setSkills(String skills) { this.skills = skills; }
    public String getEducation() { return education; }
    public void setEducation(String education) { this.education = education; }
    public String getSalaryRange() { return salaryRange; }
    public void setSalaryRange(String salaryRange) { this.salaryRange = salaryRange; }
    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
}