package com.career.dto;

import com.career.entity.QuestionType;
import java.util.List;

public class StudentQuestionResponse {

    private Long id;
    private Integer questionOrder;
    private String questionText;
    private QuestionType questionType;
    private List<StudentOptionResponse> options;

    public StudentQuestionResponse() {}

    public StudentQuestionResponse(Long id, Integer questionOrder, String questionText, QuestionType questionType, List<StudentOptionResponse> options) {
        this.id = id;
        this.questionOrder = questionOrder;
        this.questionText = questionText;
        this.questionType = questionType;
        this.options = options;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private Integer questionOrder;
        private String questionText;
        private QuestionType questionType;
        private List<StudentOptionResponse> options;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder questionOrder(Integer questionOrder) { this.questionOrder = questionOrder; return this; }
        public Builder questionText(String questionText) { this.questionText = questionText; return this; }
        public Builder questionType(QuestionType questionType) { this.questionType = questionType; return this; }
        public Builder options(List<StudentOptionResponse> options) { this.options = options; return this; }

        public StudentQuestionResponse build() {
            return new StudentQuestionResponse(id, questionOrder, questionText, questionType, options);
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Integer getQuestionOrder() { return questionOrder; }
    public void setQuestionOrder(Integer questionOrder) { this.questionOrder = questionOrder; }
    public String getQuestionText() { return questionText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }
    public QuestionType getQuestionType() { return questionType; }
    public void setQuestionType(QuestionType questionType) { this.questionType = questionType; }
    public List<StudentOptionResponse> getOptions() { return options; }
    public void setOptions(List<StudentOptionResponse> options) { this.options = options; }
}