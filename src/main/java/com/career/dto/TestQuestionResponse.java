package com.career.dto;

import java.util.ArrayList;
import java.util.List;

public class TestQuestionResponse {

    private Long questionId;
    private Integer questionOrder;
    private String questionText;
    private Integer marks;
    private String category;
    private List<TestOptionResponse> options = new ArrayList<>();

    public TestQuestionResponse() {}

    public TestQuestionResponse(Long questionId, Integer questionOrder, String questionText, List<TestOptionResponse> options) {
        this(questionId, questionOrder, questionText, 10, null, options);
    }

    public TestQuestionResponse(Long questionId, Integer questionOrder, String questionText, Integer marks, String category, List<TestOptionResponse> options) {
        this.questionId = questionId;
        this.questionOrder = questionOrder;
        this.questionText = questionText;
        this.marks = marks != null ? marks : 10;
        this.category = category;
        this.options = options != null ? options : new ArrayList<>();
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long questionId;
        private Integer questionOrder;
        private String questionText;
        private Integer marks = 10;
        private String category;
        private List<TestOptionResponse> options = new ArrayList<>();

        public Builder id(Long questionId) { this.questionId = questionId; return this; }
        public Builder questionId(Long questionId) { this.questionId = questionId; return this; }
        public Builder questionOrder(Integer questionOrder) { this.questionOrder = questionOrder; return this; }
        public Builder questionText(String questionText) { this.questionText = questionText; return this; }
        public Builder marks(Integer marks) { this.marks = marks != null ? marks : 10; return this; }
        public Builder category(String category) { this.category = category; return this; }
        public Builder options(List<TestOptionResponse> options) { this.options = options != null ? options : new ArrayList<>(); return this; }

        public TestQuestionResponse build() {
            return new TestQuestionResponse(questionId, questionOrder, questionText, marks, category, options);
        }
    }

    public Long getQuestionId() { return questionId; }
    public void setQuestionId(Long questionId) { this.questionId = questionId; }
    public Integer getQuestionOrder() { return questionOrder; }
    public void setQuestionOrder(Integer questionOrder) { this.questionOrder = questionOrder; }
    public String getQuestionText() { return questionText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }
    public Integer getMarks() { return marks; }
    public void setMarks(Integer marks) { this.marks = marks != null ? marks : 10; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public List<TestOptionResponse> getOptions() { return options; }
    public void setOptions(List<TestOptionResponse> options) { this.options = options; }
}