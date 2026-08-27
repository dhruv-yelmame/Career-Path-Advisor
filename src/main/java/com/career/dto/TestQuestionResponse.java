package com.career.dto;

import java.util.ArrayList;
import java.util.List;

public class TestQuestionResponse {

    private Long questionId;
    private Integer questionOrder;
    private String questionText;
    private String questionType;
    private List<TestOptionResponse> options = new ArrayList<>();

    public TestQuestionResponse() {}

    public TestQuestionResponse(Long questionId, Integer questionOrder, String questionText, String questionType, List<TestOptionResponse> options) {
        this.questionId = questionId;
        this.questionOrder = questionOrder;
        this.questionText = questionText;
        this.questionType = questionType;
        this.options = options != null ? options : new ArrayList<>();
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long questionId;
        private Integer questionOrder;
        private String questionText;
        private String questionType;
        private List<TestOptionResponse> options = new ArrayList<>();

        public Builder questionId(Long questionId) { this.questionId = questionId; return this; }
        public Builder questionOrder(Integer questionOrder) { this.questionOrder = questionOrder; return this; }
        public Builder questionText(String questionText) { this.questionText = questionText; return this; }
        public Builder questionType(String questionType) { this.questionType = questionType; return this; }
        public Builder options(List<TestOptionResponse> options) { this.options = options != null ? options : new ArrayList<>(); return this; }

        public TestQuestionResponse build() {
            return new TestQuestionResponse(questionId, questionOrder, questionText, questionType, options);
        }
    }

    public Long getQuestionId() { return questionId; }
    public void setQuestionId(Long questionId) { this.questionId = questionId; }
    public Integer getQuestionOrder() { return questionOrder; }
    public void setQuestionOrder(Integer questionOrder) { this.questionOrder = questionOrder; }
    public String getQuestionText() { return questionText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }
    public String getQuestionType() { return questionType; }
    public void setQuestionType(String questionType) { this.questionType = questionType; }
    public List<TestOptionResponse> getOptions() { return options; }
    public void setOptions(List<TestOptionResponse> options) { this.options = options; }
}