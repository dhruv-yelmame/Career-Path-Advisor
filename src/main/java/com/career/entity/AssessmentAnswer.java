package com.career.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString(exclude = {"result", "question", "selectedOption"})
@Entity
@Table(name = "assessment_answers")
public class AssessmentAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "result_id", nullable = false)
    private AssessmentResult result;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "selected_option_id")
    private QuestionOption selectedOption;

    public AssessmentAnswer() {}

    public AssessmentAnswer(Long id, AssessmentResult result, Question question, QuestionOption selectedOption) {
        this.id = id;
        this.result = result;
        this.question = question;
        this.selectedOption = selectedOption;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private AssessmentResult result;
        private Question question;
        private QuestionOption selectedOption;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder result(AssessmentResult result) { this.result = result; return this; }
        public Builder question(Question question) { this.question = question; return this; }
        public Builder selectedOption(QuestionOption selectedOption) { this.selectedOption = selectedOption; return this; }

        public AssessmentAnswer build() {
            return new AssessmentAnswer(id, result, question, selectedOption);
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public AssessmentResult getResult() { return result; }
    public void setResult(AssessmentResult result) { this.result = result; }
    public Question getQuestion() { return question; }
    public void setQuestion(Question question) { this.question = question; }
    public QuestionOption getSelectedOption() { return selectedOption; }
    public void setSelectedOption(QuestionOption selectedOption) { this.selectedOption = selectedOption; }
}