package com.career.dto;

import com.career.entity.Role;

public class UserProfileResponse {

    private Long id;
    private String name;
    private String email;
    private Role role;
    private String mobile;
    private String course;
    private String percentage;

    public UserProfileResponse() {}

    public UserProfileResponse(Long id, String name, String email, Role role, String mobile, String course, String percentage) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.mobile = mobile;
        this.course = course;
        this.percentage = percentage;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public String getMobile() { return mobile; }
    public void setMobile(String mobile) { this.mobile = mobile; }
    public String getCourse() { return course; }
    public void setCourse(String course) { this.course = course; }
    public String getPercentage() { return percentage; }
    public void setPercentage(String percentage) { this.percentage = percentage; }
}
