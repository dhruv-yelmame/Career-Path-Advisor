package com.career.dto;

import jakarta.validation.constraints.NotBlank;

public class QuestionOptionRequest {

    @NotBlank(message = "Option text is required")
    private String optionText;

    private String category = "";

    private Integer score = 10;

    public QuestionOptionRequest() {}

    public QuestionOptionRequest(String optionText, String category, Integer score) {
        this.optionText = optionText;
        this.category = category;
        this.score = score != null ? score : 10;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String optionText;
        private String category = "";
        private Integer score = 10;

        public Builder optionText(String optionText) { this.optionText = optionText; return this; }
        public Builder category(String category) { this.category = category; return this; }
        public Builder score(Integer score) { this.score = score; return this; }

        public QuestionOptionRequest build() {
            return new QuestionOptionRequest(optionText, category, score);
        }
    }

    public String getOptionText() { return optionText; }
    public void setOptionText(String optionText) { this.optionText = optionText; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }
}