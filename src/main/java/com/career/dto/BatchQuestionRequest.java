package com.career.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public class BatchQuestionRequest {

    @NotEmpty(message = "Question list cannot be empty")
    @Valid
    private List<QuestionRequest> questions;

    public BatchQuestionRequest() {}

    public BatchQuestionRequest(List<QuestionRequest> questions) {
        this.questions = questions;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private List<QuestionRequest> questions;
        public Builder questions(List<QuestionRequest> questions) { this.questions = questions; return this; }
        public BatchQuestionRequest build() { return new BatchQuestionRequest(questions); }
    }

    public List<QuestionRequest> getQuestions() { return questions; }
    public void setQuestions(List<QuestionRequest> questions) { this.questions = questions; }
}
