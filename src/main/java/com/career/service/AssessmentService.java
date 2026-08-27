package com.career.service;

import com.career.dto.AssessmentAnswerRequest;
import com.career.dto.AssessmentResultResponse;
import com.career.entity.Question;

import java.util.List;

public interface AssessmentService {

    List<Question> getQuestions();

    AssessmentResultResponse submitAssessment(
            Long studentId,
            List<AssessmentAnswerRequest> answers
    );
}