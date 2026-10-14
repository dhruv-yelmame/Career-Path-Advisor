package com.career.dto;

public class CategoryPerformanceResponse {

    private String category;
    private Integer obtainedScore;
    private Integer maximumScore;
    private Double percentage;

    public CategoryPerformanceResponse() {}

    public CategoryPerformanceResponse(String category, Integer obtainedScore, Integer maximumScore, Double percentage) {
        this.category = category;
        this.obtainedScore = obtainedScore;
        this.maximumScore = maximumScore;
        this.percentage = percentage;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String category;
        private Integer obtainedScore;
        private Integer maximumScore;
        private Double percentage;

        public Builder category(String category) {
            this.category = category;
            return this;
        }

        public Builder obtainedScore(Integer obtainedScore) {
            this.obtainedScore = obtainedScore;
            return this;
        }

        public Builder maximumScore(Integer maximumScore) {
            this.maximumScore = maximumScore;
            return this;
        }

        public Builder percentage(Double percentage) {
            this.percentage = percentage;
            return this;
        }

        public CategoryPerformanceResponse build() {
            return new CategoryPerformanceResponse(category, obtainedScore, maximumScore, percentage);
        }
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Integer getObtainedScore() {
        return obtainedScore;
    }

    public void setObtainedScore(Integer obtainedScore) {
        this.obtainedScore = obtainedScore;
    }

    public Integer getMaximumScore() {
        return maximumScore;
    }

    public void setMaximumScore(Integer maximumScore) {
        this.maximumScore = maximumScore;
    }

    public Double getPercentage() {
        return percentage;
    }

    public void setPercentage(Double percentage) {
        this.percentage = percentage;
    }
}
