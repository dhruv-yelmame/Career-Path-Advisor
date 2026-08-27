package com.career.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString(exclude = "question")
@Entity
@Table(name = "question_options")
public class QuestionOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String optionText;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private Integer score = 0;

    @Column(nullable = false)
    private Boolean correctAnswer = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    @JsonBackReference
    private Question question;

    public QuestionOption() {}

    public QuestionOption(Long id, String optionText, String category, Integer score, Boolean correctAnswer, Question question) {
        this.id = id;
        this.optionText = optionText;
        this.category = category;
        this.score = score != null ? score : 0;
        this.correctAnswer = correctAnswer != null ? correctAnswer : false;
        this.question = question;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private String optionText;
        private String category;
        private Integer score = 0;
        private Boolean correctAnswer = false;
        private Question question;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder optionText(String optionText) { this.optionText = optionText; return this; }
        public Builder category(String category) { this.category = category; return this; }
        public Builder score(Integer score) { this.score = score; return this; }
        public Builder correctAnswer(Boolean correctAnswer) { this.correctAnswer = correctAnswer; return this; }
        public Builder question(Question question) { this.question = question; return this; }

        public QuestionOption build() {
            return new QuestionOption(id, optionText, category, score, correctAnswer, question);
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
    public Question getQuestion() { return question; }
    public void setQuestion(Question question) { this.question = question; }
}