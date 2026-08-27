package com.career.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString(exclude = {"attempt", "question"})
@Entity
@Table(name = "test_attempt_questions")
public class TestAttemptQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_id", nullable = false)
    private TestAttempt attempt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(nullable = false)
    private Integer questionOrder;

    public TestAttemptQuestion() {}

    public TestAttemptQuestion(Long id, TestAttempt attempt, Question question, Integer questionOrder) {
        this.id = id;
        this.attempt = attempt;
        this.question = question;
        this.questionOrder = questionOrder;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private TestAttempt attempt;
        private Question question;
        private Integer questionOrder;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder attempt(TestAttempt attempt) { this.attempt = attempt; return this; }
        public Builder question(Question question) { this.question = question; return this; }
        public Builder questionOrder(Integer questionOrder) { this.questionOrder = questionOrder; return this; }

        public TestAttemptQuestion build() {
            return new TestAttemptQuestion(id, attempt, question, questionOrder);
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public TestAttempt getAttempt() { return attempt; }
    public void setAttempt(TestAttempt attempt) { this.attempt = attempt; }
    public Question getQuestion() { return question; }
    public void setQuestion(Question question) { this.question = question; }
    public Integer getQuestionOrder() { return questionOrder; }
    public void setQuestionOrder(Integer questionOrder) { this.questionOrder = questionOrder; }
}