package com.career.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@ToString(exclude = "testQuestions")
@Entity
@Table(name = "tests")
public class Test {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String testName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Integer questionCount;

    @Column(nullable = false)
    private Integer timeLimitMinutes;

    @Convert(converter = com.career.config.YesNoBooleanConverter.class)
    @Column(nullable = false, length = 10)
    private Boolean active = true;

    @Convert(converter = com.career.config.YesNoBooleanConverter.class)
    @Column(nullable = false, length = 10)
    private Boolean randomQuestions = false;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "test", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TestQuestion> testQuestions = new ArrayList<>();

    public Test() {}

    public Test(Long id, String testName, String description, Integer questionCount, Integer timeLimitMinutes,
                Boolean active, Boolean randomQuestions,
                LocalDateTime createdAt, List<TestQuestion> testQuestions) {
        this.id = id;
        this.testName = testName;
        this.description = description;
        this.questionCount = questionCount;
        this.timeLimitMinutes = timeLimitMinutes;
        this.active = active != null ? active : true;
        this.randomQuestions = randomQuestions != null ? randomQuestions : false;
        this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
        this.testQuestions = testQuestions != null ? testQuestions : new ArrayList<>();
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private String testName;
        private String description;
        private Integer questionCount;
        private Integer timeLimitMinutes;
        private Boolean active = true;
        private Boolean randomQuestions = false;
        private LocalDateTime createdAt = LocalDateTime.now();
        private List<TestQuestion> testQuestions = new ArrayList<>();

        public Builder id(Long id) { this.id = id; return this; }
        public Builder testName(String testName) { this.testName = testName; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder questionCount(Integer questionCount) { this.questionCount = questionCount; return this; }
        public Builder timeLimitMinutes(Integer timeLimitMinutes) { this.timeLimitMinutes = timeLimitMinutes; return this; }
        public Builder active(Boolean active) { this.active = active; return this; }
        public Builder randomQuestions(Boolean randomQuestions) { this.randomQuestions = randomQuestions; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder testQuestions(List<TestQuestion> testQuestions) { this.testQuestions = testQuestions; return this; }

        public Test build() {
            return new Test(id, testName, description, questionCount, timeLimitMinutes, active, randomQuestions, createdAt, testQuestions);
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTestName() { return testName; }
    public void setTestName(String testName) { this.testName = testName; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Integer getQuestionCount() { return questionCount; }
    public void setQuestionCount(Integer questionCount) { this.questionCount = questionCount; }
    public Integer getTimeLimitMinutes() { return timeLimitMinutes; }
    public void setTimeLimitMinutes(Integer timeLimitMinutes) { this.timeLimitMinutes = timeLimitMinutes; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public Boolean getRandomQuestions() { return randomQuestions; }
    public void setRandomQuestions(Boolean randomQuestions) { this.randomQuestions = randomQuestions; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public List<TestQuestion> getTestQuestions() { return testQuestions; }
    public void setTestQuestions(List<TestQuestion> testQuestions) { this.testQuestions = testQuestions; }
}