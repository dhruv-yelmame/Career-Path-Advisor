package com.career.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@Entity
@Table(name = "learning_resources")
public class LearningResource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String stage; // e.g. "Stage 01", "Stage 02", "Stage 03"

    @Column(nullable = false)
    private String category; // e.g. "Official Docs & Guides", "Video Course", "Hands-on Practice"

    @Column(nullable = false, length = 1000)
    private String resourceUrl;

    @Column(nullable = false)
    private String resourceType; // e.g. "Documentation", "Video Course", "Interactive", "Article"

    @Column(nullable = false)
    private String courseTrack; // e.g. "Software Developer", "Data Analyst", "UI/UX Designer"

    @Column(nullable = false)
    private String status = "Active"; // "Active", "Draft"

    @Column(length = 1000)
    private String description;

    public LearningResource() {}

    public LearningResource(Long id, String title, String stage, String category, String resourceUrl,
                            String resourceType, String courseTrack, String status, String description) {
        this.id = id;
        this.title = title;
        this.stage = stage;
        this.category = category;
        this.resourceUrl = resourceUrl;
        this.resourceType = resourceType;
        this.courseTrack = courseTrack;
        this.status = status != null ? status : "Active";
        this.description = description;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private String title;
        private String stage;
        private String category;
        private String resourceUrl;
        private String resourceType;
        private String courseTrack;
        private String status = "Active";
        private String description;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder title(String title) { this.title = title; return this; }
        public Builder stage(String stage) { this.stage = stage; return this; }
        public Builder category(String category) { this.category = category; return this; }
        public Builder resourceUrl(String resourceUrl) { this.resourceUrl = resourceUrl; return this; }
        public Builder resourceType(String resourceType) { this.resourceType = resourceType; return this; }
        public Builder courseTrack(String courseTrack) { this.courseTrack = courseTrack; return this; }
        public Builder status(String status) { this.status = status; return this; }
        public Builder description(String description) { this.description = description; return this; }

        public LearningResource build() {
            return new LearningResource(id, title, stage, category, resourceUrl, resourceType, courseTrack, status, description);
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getStage() { return stage; }
    public void setStage(String stage) { this.stage = stage; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getResourceUrl() { return resourceUrl; }
    public void setResourceUrl(String resourceUrl) { this.resourceUrl = resourceUrl; }
    public String getResourceType() { return resourceType; }
    public void setResourceType(String resourceType) { this.resourceType = resourceType; }
    public String getCourseTrack() { return courseTrack; }
    public void setCourseTrack(String courseTrack) { this.courseTrack = courseTrack; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
