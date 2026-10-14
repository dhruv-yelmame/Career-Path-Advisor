package com.career.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDateTime;

@Getter
@Setter
@ToString(exclude = {"student", "attempt"})
@Entity
@Table(name = "assessment_results")
public class AssessmentResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_id")
    private TestAttempt attempt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "career_path_id")
    private CareerPath recommendedCareer;

    @Column
    private String category;

    @Column(name = "score_precentage", nullable = false)
    private Integer score = 0;

    @Column(name = "correct_quetions", nullable = false)
    private Integer interestScore = 0;

    @Column(name = "total_score", nullable = false)
    private Integer knowledgeScore = 0;

    @Column(nullable = false)
    private LocalDateTime completedAt = LocalDateTime.now();

    public AssessmentResult() {}

    public AssessmentResult(Long id, User student, TestAttempt attempt, CareerPath recommendedCareer, String category,
                            Integer score, Integer interestScore, Integer knowledgeScore, LocalDateTime completedAt) {
        this.id = id;
        this.student = student;
        this.attempt = attempt;
        this.recommendedCareer = recommendedCareer;
        this.category = category;
        this.score = score != null ? score : 0;
        this.interestScore = interestScore != null ? interestScore : 0;
        this.knowledgeScore = knowledgeScore != null ? knowledgeScore : 0;
        this.completedAt = completedAt != null ? completedAt : LocalDateTime.now();
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private User student;
        private TestAttempt attempt;
        private CareerPath recommendedCareer;
        private String category;
        private Integer score = 0;
        private Integer interestScore = 0;
        private Integer knowledgeScore = 0;
        private LocalDateTime completedAt = LocalDateTime.now();

        public Builder id(Long id) { this.id = id; return this; }
        public Builder student(User student) { this.student = student; return this; }
        public Builder attempt(TestAttempt attempt) { this.attempt = attempt; return this; }
        public Builder recommendedCareer(CareerPath recommendedCareer) { this.recommendedCareer = recommendedCareer; return this; }
        public Builder category(String category) { this.category = category; return this; }
        public Builder score(Integer score) { this.score = score; return this; }
        public Builder scorePercentage(Integer scorePercentage) { this.score = scorePercentage; return this; }
        public Builder interestScore(Integer interestScore) { this.interestScore = interestScore; return this; }
        public Builder correctQuestions(Integer correctQuestions) { this.interestScore = correctQuestions; return this; }
        public Builder knowledgeScore(Integer knowledgeScore) { this.knowledgeScore = knowledgeScore; return this; }
        public Builder totalScore(Integer totalScore) { this.knowledgeScore = totalScore; return this; }
        public Builder completedAt(LocalDateTime completedAt) { this.completedAt = completedAt; return this; }

        public AssessmentResult build() {
            return new AssessmentResult(id, student, attempt, recommendedCareer, category, score, interestScore, knowledgeScore, completedAt);
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getStudent() { return student; }
    public void setStudent(User student) { this.student = student; }
    public TestAttempt getAttempt() { return attempt; }
    public void setAttempt(TestAttempt attempt) { this.attempt = attempt; }
    public CareerPath getRecommendedCareer() { return recommendedCareer; }
    public void setRecommendedCareer(CareerPath recommendedCareer) { this.recommendedCareer = recommendedCareer; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }
    public Integer getScorePercentage() { return score; }
    public void setScorePercentage(Integer scorePercentage) { this.score = scorePercentage; }
    public Integer getInterestScore() { return interestScore; }
    public void setInterestScore(Integer interestScore) { this.interestScore = interestScore; }
    public Integer getCorrectQuestions() { return interestScore; }
    public void setCorrectQuestions(Integer correctQuestions) { this.interestScore = correctQuestions; }
    public Integer getKnowledgeScore() { return knowledgeScore; }
    public void setKnowledgeScore(Integer knowledgeScore) { this.knowledgeScore = knowledgeScore; }
    public Integer getTotalScore() { return knowledgeScore; }
    public void setTotalScore(Integer totalScore) { this.knowledgeScore = totalScore; }
    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
}