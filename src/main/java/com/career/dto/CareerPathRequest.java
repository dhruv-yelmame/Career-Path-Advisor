package com.career.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class CareerPathRequest {

    @NotBlank(message = "Career name is required")
    @Size(max = 100, message = "Career name cannot exceed 100 characters")
    private String careerName;

    @NotBlank(message = "Category is required")
    @Size(max = 50, message = "Category cannot exceed 50 characters")
    private String category;

    @NotBlank(message = "Description is required")
    private String description;

    @NotBlank(message = "Skills are required")
    private String skills;

    @NotBlank(message = "Education details are required")
    private String education;

    @NotBlank(message = "Salary range is required")
    private String salaryRange;

    public CareerPathRequest() {}

    public CareerPathRequest(String careerName, String category, String description, String skills, String education, String salaryRange) {
        this.careerName = careerName;
        this.category = category;
        this.description = description;
        this.skills = skills;
        this.education = education;
        this.salaryRange = salaryRange;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String careerName;
        private String category;
        private String description;
        private String skills;
        private String education;
        private String salaryRange;

        public Builder careerName(String careerName) { this.careerName = careerName; return this; }
        public Builder category(String category) { this.category = category; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder skills(String skills) { this.skills = skills; return this; }
        public Builder education(String education) { this.education = education; return this; }
        public Builder salaryRange(String salaryRange) { this.salaryRange = salaryRange; return this; }

        public CareerPathRequest build() {
            return new CareerPathRequest(careerName, category, description, skills, education, salaryRange);
        }
    }

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