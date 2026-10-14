package com.career.service;

import com.career.dto.AssessmentAnswerRequest;
import com.career.dto.CareerAllocationResult;
import com.career.entity.Question;

import java.util.List;

public interface CareerAllocationService {

    /**
     * Evaluates a collection of questions against student submitted answers,
     * calculates overall and category-level metrics, and deterministically allocates
     * the highest-matching career path recommendation.
     *
     * @param questions List of questions associated with the test or assessment
     * @param answers   List of answers submitted by the student
     * @return Detailed CareerAllocationResult including question statistics, category breakdowns, and career recommendation
     */
    CareerAllocationResult evaluateAndAllocate(List<Question> questions, List<AssessmentAnswerRequest> answers);
}
