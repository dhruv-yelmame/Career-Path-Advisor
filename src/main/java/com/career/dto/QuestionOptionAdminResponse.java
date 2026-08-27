package com.career.dto;

public class QuestionOptionAdminResponse {

    private Long id;
    private String optionText;
    private String category;
    private Integer score;
    private Boolean correctAnswer;

    public QuestionOptionAdminResponse() {}

    public QuestionOptionAdminResponse(Long id, String optionText, String category, Integer score, Boolean correctAnswer) {
        this.id = id;
        this.optionText = optionText;
        this.category = category;
        this.score = score;
        this.correctAnswer = correctAnswer;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private String optionText;
        private String category;
        private Integer score;
        private Boolean correctAnswer;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder optionText(String optionText) { this.optionText = optionText; return this; }
        public Builder category(String category) { this.category = category; return this; }
        public Builder score(Integer score) { this.score = score; return this; }
        public Builder correctAnswer(Boolean correctAnswer) { this.correctAnswer = correctAnswer; return this; }

        public QuestionOptionAdminResponse build() {
            return new QuestionOptionAdminResponse(id, optionText, category, score, correctAnswer);
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getOptionText() { return optionText; }
    public void setOptionText(String optionText) { this.optionText = optionText; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }
    public Boolean getCorrectAnswer() { return correctAnswer; }
    public void setCorrectAnswer(Boolean correctAnswer) { this.correctAnswer = correctAnswer; }
}