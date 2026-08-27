package com.career.dto;

public class StudentOptionResponse {

    private Long id;
    private String optionText;

    public StudentOptionResponse() {}

    public StudentOptionResponse(Long id, String optionText) {
        this.id = id;
        this.optionText = optionText;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private String optionText;
        public Builder id(Long id) { this.id = id; return this; }
        public Builder optionText(String optionText) { this.optionText = optionText; return this; }
        public StudentOptionResponse build() { return new StudentOptionResponse(id, optionText); }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getOptionText() { return optionText; }
    public void setOptionText(String optionText) { this.optionText = optionText; }
}