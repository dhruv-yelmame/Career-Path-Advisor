package com.career.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@ToString(exclude = "options")
@Entity
@Table(name = "questions")
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String questionText;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private Integer marks = 10;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id")
    private Test test;

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference
    private List<QuestionOption> options = new ArrayList<>();

    public Question() {}

    public Question(Long id, String questionText, String category, Integer marks, Test test, List<QuestionOption> options) {
        this.id = id;
        this.questionText = questionText;
        this.category = category;
        this.marks = marks != null ? marks : 10;
        this.test = test;
        this.options = options != null ? options : new ArrayList<>();
    }

    public Question(Long id, String questionText, List<QuestionOption> options) {
        this(id, questionText, null, 10, null, options);
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private String questionText;
        private String category;
        private Integer marks = 10;
        private Test test;
        private List<QuestionOption> options = new ArrayList<>();

        public Builder id(Long id) { this.id = id; return this; }
        public Builder questionText(String questionText) { this.questionText = questionText; return this; }
        public Builder category(String category) { this.category = category; return this; }
        public Builder marks(Integer marks) { this.marks = marks != null ? marks : 10; return this; }
        public Builder test(Test test) { this.test = test; return this; }
        public Builder options(List<QuestionOption> options) { this.options = options; return this; }

        public Question build() {
            return new Question(id, questionText, category, marks, test, options);
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getQuestionText() { return questionText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public Integer getMarks() { return marks; }
    public void setMarks(Integer marks) { this.marks = marks != null ? marks : 10; }
    public Test getTest() { return test; }
    public void setTest(Test test) { this.test = test; }
    public List<QuestionOption> getOptions() { return options; }
    public void setOptions(List<QuestionOption> options) { this.options = options; }
}