package com.career.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@ToString
public class TestRequest {

    @NotBlank(message = "Test name is required")
    private String testName;

    private String description;

    @NotNull(message = "Question count is required")
    @Min(value = 1, message = "Question count must be at least 1")
    private Integer questionCount;

    @NotNull(message = "Time limit is required")
    @Min(value = 1, message = "Time limit must be at least 1 minute")
    private Integer timeLimitMinutes;

    private Boolean active = true;

    private Boolean randomQuestions = false;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    @NotEmpty(message = "Please select questions for this test")
    private List<Long> questionIds;

    public TestRequest() {}

    public TestRequest(String testName, String description, Integer questionCount, Integer timeLimitMinutes,
                       Boolean active, Boolean randomQuestions, LocalDateTime startTime, LocalDateTime endTime,
                       List<Long> questionIds) {
        this.testName = testName;
        this.description = description;
        this.questionCount = questionCount;
        this.timeLimitMinutes = timeLimitMinutes;
        this.active = active != null ? active : true;
        this.randomQuestions = randomQuestions != null ? randomQuestions : false;
        this.startTime = startTime;
        this.endTime = endTime;
        this.questionIds = questionIds;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String testName;
        private String description;
        private Integer questionCount;
        private Integer timeLimitMinutes;
        private Boolean active = true;
        private Boolean randomQuestions = false;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private List<Long> questionIds;

        public Builder testName(String testName) { this.testName = testName; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder questionCount(Integer questionCount) { this.questionCount = questionCount; return this; }
        public Builder timeLimitMinutes(Integer timeLimitMinutes) { this.timeLimitMinutes = timeLimitMinutes; return this; }
        public Builder active(Boolean active) { this.active = active; return this; }
        public Builder randomQuestions(Boolean randomQuestions) { this.randomQuestions = randomQuestions; return this; }
        public Builder startTime(LocalDateTime startTime) { this.startTime = startTime; return this; }
        public Builder endTime(LocalDateTime endTime) { this.endTime = endTime; return this; }
        public Builder questionIds(List<Long> questionIds) { this.questionIds = questionIds; return this; }

        public TestRequest build() {
            return new TestRequest(testName, description, questionCount, timeLimitMinutes, active, randomQuestions, startTime, endTime, questionIds);
        }
    }

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
    public List<Long> getQuestionIds() { return questionIds; }
    public void setQuestionIds(List<Long> questionIds) { this.questionIds = questionIds; }
}