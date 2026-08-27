package com.career.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.util.Map;

@Getter
@Setter
@ToString
public class DashboardStatsResponse {

    private long totalStudents;
    private long totalQuestions;
    private long totalTests;
    private long activeTests;
    private long totalCareerPaths;
    private long totalAttempts;
    private long completedAttempts;
    private Map<String, Long> careerPathDistribution;

    public DashboardStatsResponse() {}

    public DashboardStatsResponse(long totalStudents, long totalQuestions, long totalTests, long activeTests, long totalCareerPaths, long totalAttempts, long completedAttempts, Map<String, Long> careerPathDistribution) {
        this.totalStudents = totalStudents;
        this.totalQuestions = totalQuestions;
        this.totalTests = totalTests;
        this.activeTests = activeTests;
        this.totalCareerPaths = totalCareerPaths;
        this.totalAttempts = totalAttempts;
        this.completedAttempts = completedAttempts;
        this.careerPathDistribution = careerPathDistribution;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private long totalStudents;
        private long totalQuestions;
        private long totalTests;
        private long activeTests;
        private long totalCareerPaths;
        private long totalAttempts;
        private long completedAttempts;
        private Map<String, Long> careerPathDistribution;

        public Builder totalStudents(long totalStudents) { this.totalStudents = totalStudents; return this; }
        public Builder totalQuestions(long totalQuestions) { this.totalQuestions = totalQuestions; return this; }
        public Builder totalTests(long totalTests) { this.totalTests = totalTests; return this; }
        public Builder activeTests(long activeTests) { this.activeTests = activeTests; return this; }
        public Builder totalCareerPaths(long totalCareerPaths) { this.totalCareerPaths = totalCareerPaths; return this; }
        public Builder totalAttempts(long totalAttempts) { this.totalAttempts = totalAttempts; return this; }
        public Builder completedAttempts(long completedAttempts) { this.completedAttempts = completedAttempts; return this; }
        public Builder careerPathDistribution(Map<String, Long> careerPathDistribution) { this.careerPathDistribution = careerPathDistribution; return this; }

        public DashboardStatsResponse build() {
            return new DashboardStatsResponse(totalStudents, totalQuestions, totalTests, activeTests, totalCareerPaths, totalAttempts, completedAttempts, careerPathDistribution);
        }
    }

    public long getTotalStudents() { return totalStudents; }
    public void setTotalStudents(long totalStudents) { this.totalStudents = totalStudents; }
    public long getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(long totalQuestions) { this.totalQuestions = totalQuestions; }
    public long getTotalTests() { return totalTests; }
    public void setTotalTests(long totalTests) { this.totalTests = totalTests; }
    public long getActiveTests() { return activeTests; }
    public void setActiveTests(long activeTests) { this.activeTests = activeTests; }
    public long getTotalCareerPaths() { return totalCareerPaths; }
    public void setTotalCareerPaths(long totalCareerPaths) { this.totalCareerPaths = totalCareerPaths; }
    public long getTotalAttempts() { return totalAttempts; }
    public void setTotalAttempts(long totalAttempts) { this.totalAttempts = totalAttempts; }
    public long getCompletedAttempts() { return completedAttempts; }
    public void setCompletedAttempts(long completedAttempts) { this.completedAttempts = completedAttempts; }
    public Map<String, Long> getCareerPathDistribution() { return careerPathDistribution; }
    public void setCareerPathDistribution(Map<String, Long> careerPathDistribution) { this.careerPathDistribution = careerPathDistribution; }
}
