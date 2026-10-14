package com.career.dto;

import java.time.LocalDateTime;

public class TestResultSummaryResponse {

    private Long testId;
    private String testName;
    private String description;
    private Long totalStudents;
    private Long totalSubmissions;
    private Double averageScore;
    private Integer highestScore;
    private Integer lowestScore;
    private LocalDateTime latestCompletedAt;

    public TestResultSummaryResponse() {}

    public TestResultSummaryResponse(Long testId, String testName, String description, Long totalStudents,
                                    Double averageScore, Integer highestScore, Integer lowestScore,
                                    LocalDateTime latestCompletedAt) {
        this(testId, testName, description, totalStudents, totalStudents, averageScore, highestScore, lowestScore, latestCompletedAt);
    }

    public TestResultSummaryResponse(Long testId, String testName, String description, Long totalStudents,
                                    Long totalSubmissions,
                                    Double averageScore, Integer highestScore, Integer lowestScore,
                                    LocalDateTime latestCompletedAt) {
        this.testId = testId;
        this.testName = testName;
        this.description = description;
        this.totalStudents = totalStudents != null ? totalStudents : 0L;
        this.totalSubmissions = totalSubmissions != null ? totalSubmissions : (totalStudents != null ? totalStudents : 0L);
        this.averageScore = averageScore != null ? averageScore : 0.0;
        this.highestScore = highestScore != null ? highestScore : 0;
        this.lowestScore = lowestScore != null ? lowestScore : 0;
        this.latestCompletedAt = latestCompletedAt;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long testId;
        private String testName;
        private String description;
        private Long totalStudents = 0L;
        private Long totalSubmissions = 0L;
        private Double averageScore = 0.0;
        private Integer highestScore = 0;
        private Integer lowestScore = 0;
        private LocalDateTime latestCompletedAt;

        public Builder testId(Long testId) { this.testId = testId; return this; }
        public Builder testName(String testName) { this.testName = testName; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder totalStudents(Long totalStudents) { this.totalStudents = totalStudents; return this; }
        public Builder totalSubmissions(Long totalSubmissions) { this.totalSubmissions = totalSubmissions; return this; }
        public Builder averageScore(Double averageScore) { this.averageScore = averageScore; return this; }
        public Builder highestScore(Integer highestScore) { this.highestScore = highestScore; return this; }
        public Builder lowestScore(Integer lowestScore) { this.lowestScore = lowestScore; return this; }
        public Builder latestCompletedAt(LocalDateTime latestCompletedAt) { this.latestCompletedAt = latestCompletedAt; return this; }

        public TestResultSummaryResponse build() {
            return new TestResultSummaryResponse(testId, testName, description, totalStudents, totalSubmissions, averageScore, highestScore, lowestScore, latestCompletedAt);
        }
    }

    public Long getTestId() { return testId; }
    public void setTestId(Long testId) { this.testId = testId; }

    public String getTestName() { return testName; }
    public void setTestName(String testName) { this.testName = testName; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Long getTotalStudents() { return totalStudents; }
    public void setTotalStudents(Long totalStudents) { this.totalStudents = totalStudents; }

    public Long getTotalSubmissions() { return totalSubmissions; }
    public void setTotalSubmissions(Long totalSubmissions) { this.totalSubmissions = totalSubmissions; }

    public Double getAverageScore() { return averageScore; }
    public void setAverageScore(Double averageScore) { this.averageScore = averageScore; }

    public Integer getHighestScore() { return highestScore; }
    public void setHighestScore(Integer highestScore) { this.highestScore = highestScore; }

    public Integer getLowestScore() { return lowestScore; }
    public void setLowestScore(Integer lowestScore) { this.lowestScore = lowestScore; }

    public LocalDateTime getLatestCompletedAt() { return latestCompletedAt; }
    public void setLatestCompletedAt(LocalDateTime latestCompletedAt) { this.latestCompletedAt = latestCompletedAt; }
}
