package com.career.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class StudentResponse {

    private Long id;
    private String name;
    private String email;
    private String maskedEmail;
    private String role;
    private Long testsAttempted;
    private Long testsCompleted;
    private String latestRecommendation;
    private String mobile;
    private String course;
    private String percentage;

    public StudentResponse() {}

    public StudentResponse(Long id, String name, String email, String maskedEmail, String role,
                           Long testsAttempted, Long testsCompleted, String latestRecommendation,
                           String mobile, String course, String percentage) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.maskedEmail = maskedEmail;
        this.role = role;
        this.testsAttempted = testsAttempted;
        this.testsCompleted = testsCompleted;
        this.latestRecommendation = latestRecommendation;
        this.mobile = mobile;
        this.course = course;
        this.percentage = percentage;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private String name;
        private String email;
        private String maskedEmail;
        private String role;
        private Long testsAttempted;
        private Long testsCompleted;
        private String latestRecommendation;
        private String mobile;
        private String course;
        private String percentage;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder name(String name) { this.name = name; return this; }
        public Builder email(String email) { this.email = email; return this; }
        public Builder maskedEmail(String maskedEmail) { this.maskedEmail = maskedEmail; return this; }
        public Builder role(String role) { this.role = role; return this; }
        public Builder testsAttempted(Long testsAttempted) { this.testsAttempted = testsAttempted; return this; }
        public Builder testsCompleted(Long testsCompleted) { this.testsCompleted = testsCompleted; return this; }
        public Builder latestRecommendation(String latestRecommendation) { this.latestRecommendation = latestRecommendation; return this; }
        public Builder mobile(String mobile) { this.mobile = mobile; return this; }
        public Builder course(String course) { this.course = course; return this; }
        public Builder percentage(String percentage) { this.percentage = percentage; return this; }

        public StudentResponse build() {
            return new StudentResponse(id, name, email, maskedEmail, role, testsAttempted, testsCompleted, latestRecommendation, mobile, course, percentage);
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getMaskedEmail() { return maskedEmail; }
    public void setMaskedEmail(String maskedEmail) { this.maskedEmail = maskedEmail; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public Long getTestsAttempted() { return testsAttempted; }
    public void setTestsAttempted(Long testsAttempted) { this.testsAttempted = testsAttempted; }
    public Long getTestsCompleted() { return testsCompleted; }
    public void setTestsCompleted(Long testsCompleted) { this.testsCompleted = testsCompleted; }
    public String getLatestRecommendation() { return latestRecommendation; }
    public void setLatestRecommendation(String latestRecommendation) { this.latestRecommendation = latestRecommendation; }
    public String getMobile() { return mobile; }
    public void setMobile(String mobile) { this.mobile = mobile; }
    public String getCourse() { return course; }
    public void setCourse(String course) { this.course = course; }
    public String getPercentage() { return percentage; }
    public void setPercentage(String percentage) { this.percentage = percentage; }
}
