package com.career.dto;

import java.util.List;

public class StudentQuestionResponse {

    private Long id;
    private Integer questionOrder;
    private String questionText;
    private Integer marks;
    private String category;
    private List<StudentOptionResponse> options;

    public StudentQuestionResponse() {}

    public StudentQuestionResponse(Long id, Integer questionOrder, String questionText, List<StudentOptionResponse> options) {
        this(id, questionOrder, questionText, 10, null, options);
    }

    public StudentQuestionResponse(Long id, Integer questionOrder, String questionText, Integer marks, String category, List<StudentOptionResponse> options) {
        this.id = id;
        this.questionOrder = questionOrder;
        this.questionText = questionText;
        this.marks = marks != null ? marks : 10;
        this.category = category;
        this.options = options;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private Integer questionOrder;
        private String questionText;
        private Integer marks = 10;
        private String category;
        private List<StudentOptionResponse> options;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder questionOrder(Integer questionOrder) { this.questionOrder = questionOrder; return this; }
        public Builder questionText(String questionText) { this.questionText = questionText; return this; }
        public Builder marks(Integer marks) { this.marks = marks != null ? marks : 10; return this; }
        public Builder category(String category) { this.category = category; return this; }
        public Builder options(List<StudentOptionResponse> options) { this.options = options; return this; }

        public StudentQuestionResponse build() {
            return new StudentQuestionResponse(id, questionOrder, questionText, marks, category, options);
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Integer getQuestionOrder() { return questionOrder; }
    public void setQuestionOrder(Integer questionOrder) { this.questionOrder = questionOrder; }
    public String getQuestionText() { return questionText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }
    public Integer getMarks() { return marks; }
    public void setMarks(Integer marks) { this.marks = marks != null ? marks : 10; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public List<StudentOptionResponse> getOptions() { return options; }
    public void setOptions(List<StudentOptionResponse> options) { this.options = options; }
}