package com.career.dto;

import jakarta.validation.constraints.NotNull;

public class AssessmentAnswerRequest {

    @NotNull(message = "Question ID is required")
    private Long questionId;

    private Long optionId;

    public AssessmentAnswerRequest() {}

    public AssessmentAnswerRequest(Long questionId, Long optionId) {
        this.questionId = questionId;
        this.optionId = optionId;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long questionId;
        private Long optionId;
        public Builder questionId(Long questionId) { this.questionId = questionId; return this; }
        public Builder optionId(Long optionId) { this.optionId = optionId; return this; }
        public AssessmentAnswerRequest build() { return new AssessmentAnswerRequest(questionId, optionId); }
    }

    public Long getQuestionId() { return questionId; }
    public void setQuestionId(Long questionId) { this.questionId = questionId; }
    public Long getOptionId() { return optionId; }
    public void setOptionId(Long optionId) { this.optionId = optionId; }
}