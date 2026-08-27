package com.career.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.util.List;

@Getter
@Setter
@ToString
public class QuestionResponse {

    private Long id;
    private String questionText;
    private String questionType;
    private Boolean active;
    private List<QuestionOptionResponse> options;

    public QuestionResponse() {}

    public QuestionResponse(Long id, String questionText, String questionType, Boolean active, List<QuestionOptionResponse> options) {
        this.id = id;
        this.questionText = questionText;
        this.questionType = questionType;
        this.active = active;
        this.options = options;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private String questionText;
        private String questionType;
        private Boolean active;
        private List<QuestionOptionResponse> options;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder questionText(String questionText) { this.questionText = questionText; return this; }
        public Builder questionType(String questionType) { this.questionType = questionType; return this; }
        public Builder active(Boolean active) { this.active = active; return this; }
        public Builder options(List<QuestionOptionResponse> options) { this.options = options; return this; }

        public QuestionResponse build() {
            return new QuestionResponse(id, questionText, questionType, active, options);
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getQuestionText() { return questionText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }
    public String getQuestionType() { return questionType; }
    public void setQuestionType(String questionType) { this.questionType = questionType; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public List<QuestionOptionResponse> getOptions() { return options; }
    public void setOptions(List<QuestionOptionResponse> options) { this.options = options; }
}