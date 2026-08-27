package com.career.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDateTime;

@Getter
@Setter
@ToString
public class TestResponse {

    private Long id;
    private String testName;
    private String description;
    private Integer questionCount;
    private Integer timeLimitMinutes;
    private Boolean active;
    private Boolean randomQuestions;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private LocalDateTime createdAt;
    private Long studentCount;

    public TestResponse() {}

    public TestResponse(Long id, String testName, String description, Integer questionCount, Integer timeLimitMinutes,
                        Boolean active, Boolean randomQuestions, LocalDateTime startTime, LocalDateTime endTime,
                        LocalDateTime createdAt, Long studentCount) {
        this.id = id;
        this.testName = testName;
        this.description = description;
        this.questionCount = questionCount;
        this.timeLimitMinutes = timeLimitMinutes;
        this.active = active;
        this.randomQuestions = randomQuestions;
        this.startTime = startTime;
        this.endTime = endTime;
        this.createdAt = createdAt;
        this.studentCount = studentCount;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private String testName;
        private String description;
        private Integer questionCount;
        private Integer timeLimitMinutes;
        private Boolean active;
        private Boolean randomQuestions;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private LocalDateTime createdAt;
        private Long studentCount;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder testName(String testName) { this.testName = testName; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder questionCount(Integer questionCount) { this.questionCount = questionCount; return this; }
        public Builder timeLimitMinutes(Integer timeLimitMinutes) { this.timeLimitMinutes = timeLimitMinutes; return this; }
        public Builder active(Boolean active) { this.active = active; return this; }
        public Builder randomQuestions(Boolean randomQuestions) { this.randomQuestions = randomQuestions; return this; }
        public Builder startTime(LocalDateTime startTime) { this.startTime = startTime; return this; }
        public Builder endTime(LocalDateTime endTime) { this.endTime = endTime; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder studentCount(Long studentCount) { this.studentCount = studentCount; return this; }

        public TestResponse build() {
            return new TestResponse(id, testName, description, questionCount, timeLimitMinutes, active, randomQuestions, startTime, endTime, createdAt, studentCount);
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTestName() { return testName; }
    public void setTestName(String testName) { this.testName = testName; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Integer getQuestionCount() { return questionCount; }
    public void setQuestionCount(Integer questionCount) { this.questionCount = questionCount; }
    public Integer getTimeLimitMinutes() { return timeLimitMinutes; }
    public void setTimeLimitMinutes(Integer timeLimitMinutes) { this.timeLimitMinutes = timeLimitMinutes; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public Boolean getRandomQuestions() { return randomQuestions; }
    public void setRandomQuestions(Boolean randomQuestions) { this.randomQuestions = randomQuestions; }
    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public Long getStudentCount() { return studentCount; }
    public void setStudentCount(Long studentCount) { this.studentCount = studentCount; }
}