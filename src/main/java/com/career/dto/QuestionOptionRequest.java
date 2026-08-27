package com.career.dto;

import jakarta.validation.constraints.NotBlank;

public class QuestionOptionRequest {

    @NotBlank(message = "Option text is required")
    private String optionText;

    private String category = "";

    private Integer score = 0;

    private Boolean correctAnswer = false;

    public QuestionOptionRequest() {}

    public QuestionOptionRequest(String optionText, String category, Integer score, Boolean correctAnswer) {
        this.optionText = optionText;
        this.category = category;
        this.score = score != null ? score : 0;
        this.correctAnswer = correctAnswer != null ? correctAnswer : false;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String optionText;
        private String category = "";
        private Integer score = 0;
        private Boolean correctAnswer = false;

        public Builder optionText(String optionText) { this.optionText = optionText; return this; }
        public Builder category(String category) { this.category = category; return this; }
        public Builder score(Integer score) { this.score = score; return this; }
        public Builder correctAnswer(Boolean correctAnswer) { this.correctAnswer = correctAnswer; return this; }

        public QuestionOptionRequest build() {
            return new QuestionOptionRequest(optionText, category, score, correctAnswer);
        }
    }

    public String getOptionText() { return optionText; }
    public void setOptionText(String optionText) { this.optionText = optionText; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }
    public Boolean getCorrectAnswer() { return correctAnswer; }
    public void setCorrectAnswer(Boolean correctAnswer) { this.correctAnswer = correctAnswer; }
}