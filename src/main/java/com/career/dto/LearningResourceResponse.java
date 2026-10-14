package com.career.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class LearningResourceResponse {

    private Long id;
    private String title;
    private String stage;
    private String category;
    private String resourceUrl;
    private String resourceType;
    private String courseTrack;
    private String status;
    private String description;

    public LearningResourceResponse() {}

    public LearningResourceResponse(Long id, String title, String stage, String category, String resourceUrl,
                                    String resourceType, String courseTrack, String status, String description) {
        this.id = id;
        this.title = title;
        this.stage = stage;
        this.category = category;
        this.resourceUrl = resourceUrl;
        this.resourceType = resourceType;
        this.courseTrack = courseTrack;
        this.status = status;
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
        private String status;
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

        public LearningResourceResponse build() {
            return new LearningResourceResponse(id, title, stage, category, resourceUrl, resourceType, courseTrack, status, description);
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
