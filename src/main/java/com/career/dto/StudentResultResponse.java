package com.career.dto;

import java.time.LocalDateTime;

public class StudentResultResponse {

    private Long resultId;
    private Long testId;
    private String testName;
    private String studentName;
    private String studentEmail;
    private String recommendedCareer;
    private String category;
    private Integer interestScore;
    private Integer knowledgeScore;
    private Integer totalScore;
    private LocalDateTime completedAt;

    public StudentResultResponse() {}

    public StudentResultResponse(Long resultId, Long testId, String testName, String studentName, String studentEmail,
                                 String recommendedCareer, String category, Integer interestScore, Integer knowledgeScore,
                                 Integer totalScore, LocalDateTime completedAt) {
        this.resultId = resultId;
        this.testId = testId;
        this.testName = testName;
        this.studentName = studentName;
        this.studentEmail = studentEmail;
        this.recommendedCareer = recommendedCareer;
        this.category = category;
        this.interestScore = interestScore;
        this.knowledgeScore = knowledgeScore;
        this.totalScore = totalScore;
        this.completedAt = completedAt;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long resultId;
        private Long testId;
        private String testName;
        private String studentName;
        private String studentEmail;
        private String recommendedCareer;
        private String category;
        private Integer interestScore;
        private Integer knowledgeScore;
        private Integer totalScore;
        private LocalDateTime completedAt;

        public Builder resultId(Long resultId) { this.resultId = resultId; return this; }
        public Builder testId(Long testId) { this.testId = testId; return this; }
        public Builder testName(String testName) { this.testName = testName; return this; }
        public Builder studentName(String studentName) { this.studentName = studentName; return this; }
        public Builder studentEmail(String studentEmail) { this.studentEmail = studentEmail; return this; }
        public Builder recommendedCareer(String recommendedCareer) { this.recommendedCareer = recommendedCareer; return this; }
        public Builder category(String category) { this.category = category; return this; }
        public Builder interestScore(Integer interestScore) { this.interestScore = interestScore; return this; }
        public Builder knowledgeScore(Integer knowledgeScore) { this.knowledgeScore = knowledgeScore; return this; }
        public Builder totalScore(Integer totalScore) { this.totalScore = totalScore; return this; }
        public Builder completedAt(LocalDateTime completedAt) { this.completedAt = completedAt; return this; }

        public StudentResultResponse build() {
            return new StudentResultResponse(resultId, testId, testName, studentName, studentEmail, recommendedCareer, category, interestScore, knowledgeScore, totalScore, completedAt);
        }
    }

    public Long getResultId() { return resultId; }
    public void setResultId(Long resultId) { this.resultId = resultId; }
    public Long getTestId() { return testId; }
    public void setTestId(Long testId) { this.testId = testId; }
    public String getTestName() { return testName; }
    public void setTestName(String testName) { this.testName = testName; }
    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }
    public String getStudentEmail() { return studentEmail; }
    public void setStudentEmail(String studentEmail) { this.studentEmail = studentEmail; }
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
    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
}