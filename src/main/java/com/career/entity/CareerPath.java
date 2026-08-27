package com.career.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@Entity
@Table(name = "career_paths")
public class CareerPath {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String careerName;

    @Column(nullable = false, unique = true)
    private String category;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String skills;

    @Column(columnDefinition = "TEXT")
    private String education;

    @Column(name = "salary_range")
    private String salaryRange;

    public CareerPath() {}

    public CareerPath(Long id, String careerName, String category, String description, String skills, String education, String salaryRange) {
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

        public CareerPath build() {
            return new CareerPath(id, careerName, category, description, skills, education, salaryRange);
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