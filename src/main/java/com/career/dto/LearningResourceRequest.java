package com.career.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class LearningResourceRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String stage;

    @NotBlank(message = "Category is required")
    private String category;

    @NotBlank(message = "Resource URL is required")
    private String resourceUrl;

    @NotBlank(message = "Resource type is required")
    private String resourceType;

    @NotBlank(message = "Course track is required")
    private String courseTrack;

    private String status;

    private String description;

    public LearningResourceRequest() {}

    public LearningResourceRequest(String title, String stage, String category, String resourceUrl,
                                   String resourceType, String courseTrack, String status, String description) {
        this.title = title;
        this.stage = stage;
        this.category = category;
        this.resourceUrl = resourceUrl;
        this.resourceType = resourceType;
        this.courseTrack = courseTrack;
        this.status = status != null ? status : "Active";
        this.description = description;
    }

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
