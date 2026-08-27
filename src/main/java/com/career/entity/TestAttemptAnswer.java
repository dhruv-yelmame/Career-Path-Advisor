package com.career.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString(exclude = {"attempt", "question", "selectedOption"})
@Entity
@Table(name = "test_attempt_answers")
public class TestAttemptAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_id", nullable = false)
    private TestAttempt attempt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "selected_option_id")
    private QuestionOption selectedOption;

    public TestAttemptAnswer() {}

    public TestAttemptAnswer(Long id, TestAttempt attempt, Question question, QuestionOption selectedOption) {
        this.id = id;
        this.attempt = attempt;
        this.question = question;
        this.selectedOption = selectedOption;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private TestAttempt attempt;
        private Question question;
        private QuestionOption selectedOption;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder attempt(TestAttempt attempt) { this.attempt = attempt; return this; }
        public Builder question(Question question) { this.question = question; return this; }
        public Builder selectedOption(QuestionOption selectedOption) { this.selectedOption = selectedOption; return this; }

        public TestAttemptAnswer build() {
            return new TestAttemptAnswer(id, attempt, question, selectedOption);
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public TestAttempt getAttempt() { return attempt; }
    public void setAttempt(TestAttempt attempt) { this.attempt = attempt; }
    public Question getQuestion() { return question; }
    public void setQuestion(Question question) { this.question = question; }
    public QuestionOption getSelectedOption() { return selectedOption; }
    public void setSelectedOption(QuestionOption selectedOption) { this.selectedOption = selectedOption; }
}