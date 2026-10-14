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
    private String keyword;
    private String category;
    private Integer marks;
    private Long testId;
    private String testName;
    private List<QuestionOptionResponse> options;

    public QuestionResponse() {}

    public QuestionResponse(Long id, String questionText, List<QuestionOptionResponse> options) {
        this(id, questionText, null, null, 10, null, null, options);
    }

    public QuestionResponse(Long id, String questionText, String keyword, String category, List<QuestionOptionResponse> options) {
        this(id, questionText, keyword, category, 10, null, null, options);
    }

    public QuestionResponse(Long id, String questionText, String keyword, String category,
                            Integer marks, Long testId, String testName, List<QuestionOptionResponse> options) {
        this.id = id;
        this.questionText = questionText;
        this.keyword = keyword != null ? keyword : category;
        this.category = category != null ? category : keyword;
        this.marks = marks != null ? marks : 10;
        this.testId = testId;
        this.testName = testName;
        this.options = options;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private String questionText;
        private String keyword;
        private String category;
        private Integer marks = 10;
        private Long testId;
        private String testName;
        private List<QuestionOptionResponse> options;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder questionText(String questionText) { this.questionText = questionText; return this; }
        public Builder keyword(String keyword) { this.keyword = keyword; this.category = keyword; return this; }
        public Builder category(String category) { this.category = category; this.keyword = category; return this; }
        public Builder marks(Integer marks) { this.marks = marks != null ? marks : 10; return this; }
        public Builder testId(Long testId) { this.testId = testId; return this; }
        public Builder testName(String testName) { this.testName = testName; return this; }
        public Builder options(List<QuestionOptionResponse> options) { this.options = options; return this; }

        public QuestionResponse build() {
            return new QuestionResponse(id, questionText, keyword, category, marks, testId, testName, options);
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getQuestionText() { return questionText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }
    public String getKeyword() { return keyword != null ? keyword : category; }
    public void setKeyword(String keyword) { this.keyword = keyword; if (this.category == null) this.category = keyword; }
    public String getCategory() { return category != null ? category : keyword; }
    public void setCategory(String category) { this.category = category; if (this.keyword == null) this.keyword = category; }
    public Integer getMarks() { return marks; }
    public void setMarks(Integer marks) { this.marks = marks; }
    public Long getTestId() { return testId; }
    public void setTestId(Long testId) { this.testId = testId; }
    public String getTestName() { return testName; }
    public void setTestName(String testName) { this.testName = testName; }
    public List<QuestionOptionResponse> getOptions() { return options; }
    public void setOptions(List<QuestionOptionResponse> options) { this.options = options; }
}