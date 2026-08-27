package com.career.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDateTime;

@Getter
@Setter
@ToString(exclude = {"student", "test"})
@Entity
@Table(name = "test_attempts")
public class TestAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "test_id", nullable = false)
    private Test test;

    @Column(nullable = false)
    private LocalDateTime startedAt = LocalDateTime.now();

    @Column
    private LocalDateTime submittedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AttemptStatus status;

    @Column(nullable = false)
    private Integer score = 0;

    public TestAttempt() {}

    public TestAttempt(Long id, User student, Test test, LocalDateTime startedAt, LocalDateTime submittedAt, AttemptStatus status, Integer score) {
        this.id = id;
        this.student = student;
        this.test = test;
        this.startedAt = startedAt != null ? startedAt : LocalDateTime.now();
        this.submittedAt = submittedAt;
        this.status = status;
        this.score = score != null ? score : 0;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private User student;
        private Test test;
        private LocalDateTime startedAt = LocalDateTime.now();
        private LocalDateTime submittedAt;
        private AttemptStatus status;
        private Integer score = 0;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder student(User student) { this.student = student; return this; }
        public Builder test(Test test) { this.test = test; return this; }
        public Builder startedAt(LocalDateTime startedAt) { this.startedAt = startedAt; return this; }
        public Builder submittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; return this; }
        public Builder status(AttemptStatus status) { this.status = status; return this; }
        public Builder score(Integer score) { this.score = score; return this; }

        public TestAttempt build() {
            return new TestAttempt(id, student, test, startedAt, submittedAt, status, score);
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getStudent() { return student; }
    public void setStudent(User student) { this.student = student; }
    public Test getTest() { return test; }
    public void setTest(Test test) { this.test = test; }
    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }
    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
    public AttemptStatus getStatus() { return status; }
    public void setStatus(AttemptStatus status) { this.status = status; }
    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }
}