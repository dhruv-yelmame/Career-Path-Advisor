package com.career.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString(exclude = {"test", "question"})
@Entity
@Table(name = "test_questions")
public class TestQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id", nullable = false)
    private Test test;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(nullable = false)
    private Integer questionOrder;

    public TestQuestion() {}

    public TestQuestion(Long id, Test test, Question question, Integer questionOrder) {
        this.id = id;
        this.test = test;
        this.question = question;
        this.questionOrder = questionOrder;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private Test test;
        private Question question;
        private Integer questionOrder;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder test(Test test) { this.test = test; return this; }
        public Builder question(Question question) { this.question = question; return this; }
        public Builder questionOrder(Integer questionOrder) { this.questionOrder = questionOrder; return this; }

        public TestQuestion build() {
            return new TestQuestion(id, test, question, questionOrder);
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Test getTest() { return test; }
    public void setTest(Test test) { this.test = test; }
    public Question getQuestion() { return question; }
    public void setQuestion(Question question) { this.question = question; }
    public Integer getQuestionOrder() { return questionOrder; }
    public void setQuestionOrder(Integer questionOrder) { this.questionOrder = questionOrder; }
}