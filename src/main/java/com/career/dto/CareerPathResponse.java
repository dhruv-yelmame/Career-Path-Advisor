package com.career.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class CareerPathResponse {

    private Long id;
    private String careerName;
    private String category;
    private String description;
    private String skills;
    private String education;
    private String salaryRange;

    public CareerPathResponse() {}

    public CareerPathResponse(Long id, String careerName, String category, String description, String skills, String education, String salaryRange) {
        this.id = id;
        this.careerName = careerName;
        this.category = category;
        this.description = description;
        this.skills = skills;
        this.education = education;
        this.salaryRange = salaryRange;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private String careerName;
        private String category;
        private String description;
        private String skills;
        private String education;
        private String salaryRange;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder careerName(String careerName) { this.careerName = careerName; return this; }
        public Builder category(String category) { this.category = category; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder skills(String skills) { this.skills = skills; return this; }
        public Builder education(String education) { this.education = education; return this; }
        public Builder salaryRange(String salaryRange) { this.salaryRange = salaryRange; return this; }

        public CareerPathResponse build() {
            return new CareerPathResponse(id, careerName, category, description, skills, education, salaryRange);
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCareerName() { return careerName; }
    public void setCareerName(String careerName) { this.careerName = careerName; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getSkills() { return skills; }
    public void setSkills(String skills) { this.skills = skills; }
    public String getEducation() { return education; }
    public void setEducation(String education) { this.education = education; }
    public String getSalaryRange() { return salaryRange; }
    public void setSalaryRange(String salaryRange) { this.salaryRange = salaryRange; }
}
