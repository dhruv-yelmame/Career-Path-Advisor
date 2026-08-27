package com.career.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public class SubmitTestRequest {

    @NotNull(message = "Attempt ID is required")
    private Long attemptId;

    @NotNull(message = "Student ID is required")
    private Long studentId;

    @Valid
    private List<AssessmentAnswerRequest> answers;

    public SubmitTestRequest() {}

    public SubmitTestRequest(Long attemptId, Long studentId, List<AssessmentAnswerRequest> answers) {
        this.attemptId = attemptId;
        this.studentId = studentId;
        this.answers = answers;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long attemptId;
        private Long studentId;
        private List<AssessmentAnswerRequest> answers;

        public Builder attemptId(Long attemptId) { this.attemptId = attemptId; return this; }
        public Builder studentId(Long studentId) { this.studentId = studentId; return this; }
        public Builder answers(List<AssessmentAnswerRequest> answers) { this.answers = answers; return this; }

        public SubmitTestRequest build() {
            return new SubmitTestRequest(attemptId, studentId, answers);
        }
    }

    public Long getAttemptId() { return attemptId; }
    public void setAttemptId(Long attemptId) { this.attemptId = attemptId; }
    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }
    public List<AssessmentAnswerRequest> getAnswers() { return answers; }
    public void setAnswers(List<AssessmentAnswerRequest> answers) { this.answers = answers; }
}