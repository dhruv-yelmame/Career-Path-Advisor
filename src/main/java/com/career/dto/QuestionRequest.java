package com.career.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
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

    private String keyword;

    private String category;

    private Integer marks = 10;

    private Long testId;

    @NotEmpty(message = "Question must have at least one option")
    @Valid
    private List<QuestionOptionRequest> options;

    public QuestionRequest() {}

    public QuestionRequest(String questionText, List<QuestionOptionRequest> options) {
        this(questionText, null, 10, null, options);
    }

    public QuestionRequest(String questionText, String category, Integer marks, Long testId, List<QuestionOptionRequest> options) {
        this.questionText = questionText;
        this.keyword = category;
        this.category = category;
        this.marks = marks != null ? marks : 10;
        this.testId = testId;
        this.options = options;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String questionText;
        private String keyword;
        private String category;
        private Integer marks = 10;
        private Long testId;
        private List<QuestionOptionRequest> options;

        public Builder questionText(String questionText) { this.questionText = questionText; return this; }
        public Builder keyword(String keyword) { this.keyword = keyword; this.category = keyword; return this; }
        public Builder category(String category) { this.category = category; this.keyword = category; return this; }
        public Builder marks(Integer marks) { this.marks = marks != null ? marks : 10; return this; }
        public Builder testId(Long testId) { this.testId = testId; return this; }
        public Builder options(List<QuestionOptionRequest> options) { this.options = options; return this; }

        public QuestionRequest build() {
            return new QuestionRequest(questionText, category != null ? category : keyword, marks, testId, options);
        }
    }

    public String getQuestionText() { return questionText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }
    public String getKeyword() { return keyword != null ? keyword : category; }
    public void setKeyword(String keyword) { this.keyword = keyword; if (this.category == null) this.category = keyword; }
    public String getCategory() { return category != null ? category : keyword; }
    public void setCategory(String category) { this.category = category; if (this.keyword == null) this.keyword = category; }
    public Integer getMarks() { return marks; }
    public void setMarks(Integer marks) { this.marks = marks != null ? marks : 10; }
    public Long getTestId() { return testId; }
    public void setTestId(Long testId) { this.testId = testId; }
    public List<QuestionOptionRequest> getOptions() { return options; }
    public void setOptions(List<QuestionOptionRequest> options) { this.options = options; }
}