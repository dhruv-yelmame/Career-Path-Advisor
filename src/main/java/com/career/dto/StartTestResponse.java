package com.career.dto;

import java.time.LocalDateTime;
import java.util.List;

public class StartTestResponse {

    private Long attemptId;
    private Long testId;
    private String testName;
    private Integer timeLimitMinutes;
    private LocalDateTime startedAt;
    private LocalDateTime expiresAt;
    private List<StudentQuestionResponse> questions;

    public StartTestResponse() {}

    public StartTestResponse(Long attemptId, Long testId, String testName, Integer timeLimitMinutes,
                             LocalDateTime startedAt, LocalDateTime expiresAt, List<StudentQuestionResponse> questions) {
        this.attemptId = attemptId;
        this.testId = testId;
        this.testName = testName;
        this.timeLimitMinutes = timeLimitMinutes;
        this.startedAt = startedAt;
        this.expiresAt = expiresAt;
        this.questions = questions;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long attemptId;
        private Long testId;
        private String testName;
        private Integer timeLimitMinutes;
        private LocalDateTime startedAt;
        private LocalDateTime expiresAt;
        private List<StudentQuestionResponse> questions;

        public Builder attemptId(Long attemptId) { this.attemptId = attemptId; return this; }
        public Builder testId(Long testId) { this.testId = testId; return this; }
        public Builder testName(String testName) { this.testName = testName; return this; }
        public Builder timeLimitMinutes(Integer timeLimitMinutes) { this.timeLimitMinutes = timeLimitMinutes; return this; }
        public Builder startedAt(LocalDateTime startedAt) { this.startedAt = startedAt; return this; }
        public Builder expiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; return this; }
        public Builder questions(List<StudentQuestionResponse> questions) { this.questions = questions; return this; }

        public StartTestResponse build() {
            return new StartTestResponse(attemptId, testId, testName, timeLimitMinutes, startedAt, expiresAt, questions);
        }
    }

    public Long getAttemptId() { return attemptId; }
    public void setAttemptId(Long attemptId) { this.attemptId = attemptId; }
    public Long getTestId() { return testId; }
    public void setTestId(Long testId) { this.testId = testId; }
    public String getTestName() { return testName; }
    public void setTestName(String testName) { this.testName = testName; }
    public Integer getTimeLimitMinutes() { return timeLimitMinutes; }
    public void setTimeLimitMinutes(Integer timeLimitMinutes) { this.timeLimitMinutes = timeLimitMinutes; }
    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
    public List<StudentQuestionResponse> getQuestions() { return questions; }
    public void setQuestions(List<StudentQuestionResponse> questions) { this.questions = questions; }
}