package com.career.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.util.List;

@Getter
@Setter
@ToString
public class QuestionRequest {

    @NotBlank(message = "Question text is required")
    private String questionText;

    @NotNull(message = "Question type is required (INTEREST or CORRECT_ANSWER)")
    private String questionType;

    @NotEmpty(message = "Question must have at least one option")
    @Valid
    private List<QuestionOptionRequest> options;

    public QuestionRequest() {}

    public QuestionRequest(String questionText, String questionType, List<QuestionOptionRequest> options) {
        this.questionText = questionText;
        this.questionType = questionType;
        this.options = options;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String questionText;
        private String questionType;
        private List<QuestionOptionRequest> options;

        public Builder questionText(String questionText) { this.questionText = questionText; return this; }
        public Builder questionType(String questionType) { this.questionType = questionType; return this; }
        public Builder options(List<QuestionOptionRequest> options) { this.options = options; return this; }

        public QuestionRequest build() {
            return new QuestionRequest(questionText, questionType, options);
        }
    }

    public String getQuestionText() { return questionText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }
    public String getQuestionType() { return questionType; }
    public void setQuestionType(String questionType) { this.questionType = questionType; }
    public List<QuestionOptionRequest> getOptions() { return options; }
    public void setOptions(List<QuestionOptionRequest> options) { this.options = options; }
}