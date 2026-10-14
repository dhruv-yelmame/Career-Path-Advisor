package com.career.dto;

import com.career.entity.AssessmentAnswer;
import com.career.entity.CareerPath;

import java.util.ArrayList;
import java.util.List;

public class CareerAllocationResult {

    private int totalQuestions;
    private int attemptedQuestions;
    private int correctAnswers;
    private int wrongAnswers;
    private int unansweredQuestions;

    private int maximumScore;
    private int obtainedScore;
    private double percentage;
    private double careerMatchPercentage;

    private String highestCategory;
    private CareerPath recommendedCareer;
    private List<CategoryPerformanceResponse> categoryPerformance = new ArrayList<>();
    private List<AssessmentAnswer> evaluatedAnswers = new ArrayList<>();

    public CareerAllocationResult() {}

    public CareerAllocationResult(int totalQuestions, int attemptedQuestions, int correctAnswers,
                                  int wrongAnswers, int unansweredQuestions, int maximumScore,
                                  int obtainedScore, double percentage, double careerMatchPercentage,
                                  String highestCategory, CareerPath recommendedCareer,
                                  List<CategoryPerformanceResponse> categoryPerformance,
                                  List<AssessmentAnswer> evaluatedAnswers) {
        this.totalQuestions = totalQuestions;
        this.attemptedQuestions = attemptedQuestions;
        this.correctAnswers = correctAnswers;
        this.wrongAnswers = wrongAnswers;
        this.unansweredQuestions = unansweredQuestions;
        this.maximumScore = maximumScore;
        this.obtainedScore = obtainedScore;
        this.percentage = percentage;
        this.careerMatchPercentage = careerMatchPercentage;
        this.highestCategory = highestCategory;
        this.recommendedCareer = recommendedCareer;
        this.categoryPerformance = categoryPerformance != null ? categoryPerformance : new ArrayList<>();
        this.evaluatedAnswers = evaluatedAnswers != null ? evaluatedAnswers : new ArrayList<>();
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private int totalQuestions;
        private int attemptedQuestions;
        private int correctAnswers;
        private int wrongAnswers;
        private int unansweredQuestions;
        private int maximumScore;
        private int obtainedScore;
        private double percentage;
        private double careerMatchPercentage;
        private String highestCategory;
        private CareerPath recommendedCareer;
        private List<CategoryPerformanceResponse> categoryPerformance = new ArrayList<>();
        private List<AssessmentAnswer> evaluatedAnswers = new ArrayList<>();

        public Builder totalQuestions(int totalQuestions) { this.totalQuestions = totalQuestions; return this; }
        public Builder attemptedQuestions(int attemptedQuestions) { this.attemptedQuestions = attemptedQuestions; return this; }
        public Builder correctAnswers(int correctAnswers) { this.correctAnswers = correctAnswers; return this; }
        public Builder wrongAnswers(int wrongAnswers) { this.wrongAnswers = wrongAnswers; return this; }
        public Builder unansweredQuestions(int unansweredQuestions) { this.unansweredQuestions = unansweredQuestions; return this; }
        public Builder maximumScore(int maximumScore) { this.maximumScore = maximumScore; return this; }
        public Builder obtainedScore(int obtainedScore) { this.obtainedScore = obtainedScore; return this; }
        public Builder percentage(double percentage) { this.percentage = percentage; return this; }
        public Builder careerMatchPercentage(double careerMatchPercentage) { this.careerMatchPercentage = careerMatchPercentage; return this; }
        public Builder highestCategory(String highestCategory) { this.highestCategory = highestCategory; return this; }
        public Builder recommendedCareer(CareerPath recommendedCareer) { this.recommendedCareer = recommendedCareer; return this; }
        public Builder categoryPerformance(List<CategoryPerformanceResponse> categoryPerformance) {
            this.categoryPerformance = categoryPerformance;
            return this;
        }
        public Builder evaluatedAnswers(List<AssessmentAnswer> evaluatedAnswers) {
            this.evaluatedAnswers = evaluatedAnswers;
            return this;
        }

        public CareerAllocationResult build() {
            return new CareerAllocationResult(totalQuestions, attemptedQuestions, correctAnswers,
                    wrongAnswers, unansweredQuestions, maximumScore, obtainedScore, percentage,
                    careerMatchPercentage, highestCategory, recommendedCareer, categoryPerformance, evaluatedAnswers);
        }
    }

    public int getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(int totalQuestions) { this.totalQuestions = totalQuestions; }
    public int getAttemptedQuestions() { return attemptedQuestions; }
    public void setAttemptedQuestions(int attemptedQuestions) { this.attemptedQuestions = attemptedQuestions; }
    public int getCorrectAnswers() { return correctAnswers; }
    public void setCorrectAnswers(int correctAnswers) { this.correctAnswers = correctAnswers; }
    public int getWrongAnswers() { return wrongAnswers; }
    public void setWrongAnswers(int wrongAnswers) { this.wrongAnswers = wrongAnswers; }
    public int getUnansweredQuestions() { return unansweredQuestions; }
    public void setUnansweredQuestions(int unansweredQuestions) { this.unansweredQuestions = unansweredQuestions; }
    public int getMaximumScore() { return maximumScore; }
    public void setMaximumScore(int maximumScore) { this.maximumScore = maximumScore; }
    public int getObtainedScore() { return obtainedScore; }
    public void setObtainedScore(int obtainedScore) { this.obtainedScore = obtainedScore; }
    public double getPercentage() { return percentage; }
    public void setPercentage(double percentage) { this.percentage = percentage; }
    public double getCareerMatchPercentage() { return careerMatchPercentage; }
    public void setCareerMatchPercentage(double careerMatchPercentage) { this.careerMatchPercentage = careerMatchPercentage; }
    public String getHighestCategory() { return highestCategory; }
    public void setHighestCategory(String highestCategory) { this.highestCategory = highestCategory; }
    public CareerPath getRecommendedCareer() { return recommendedCareer; }
    public void setRecommendedCareer(CareerPath recommendedCareer) { this.recommendedCareer = recommendedCareer; }
    public List<CategoryPerformanceResponse> getCategoryPerformance() { return categoryPerformance; }
    public void setCategoryPerformance(List<CategoryPerformanceResponse> categoryPerformance) { this.categoryPerformance = categoryPerformance; }
    public List<AssessmentAnswer> getEvaluatedAnswers() { return evaluatedAnswers; }
    public void setEvaluatedAnswers(List<AssessmentAnswer> evaluatedAnswers) { this.evaluatedAnswers = evaluatedAnswers; }
}
