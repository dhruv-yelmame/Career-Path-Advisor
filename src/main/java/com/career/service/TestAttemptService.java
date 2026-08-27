package com.career.service;

import com.career.dto.AssessmentAnswerRequest;
import com.career.dto.AssessmentResultResponse;
import com.career.dto.StartTestResponse;
import com.career.entity.TestAttempt;

import java.util.List;

public interface TestAttemptService {

    // ==========================================
    // START TEST
    // ==========================================

    StartTestResponse startTest(
            Long studentId,
            Long testId
    );


    // ==========================================
    // SUBMIT TEST
    // ==========================================

    AssessmentResultResponse submitTest(
            Long studentId,
            Long attemptId,
            List<AssessmentAnswerRequest> answers
    );


    // ==========================================
    // GET CURRENT ATTEMPT
    // ==========================================

    TestAttempt getAttempt(
            Long studentId,
            Long attemptId
    );


    // ==========================================
    // AUTO SUBMIT
    // ==========================================

    AssessmentResultResponse autoSubmitTest(
            Long studentId,
            Long attemptId
    );


    // ==========================================
    // CHECK WHETHER STUDENT CAN ATTEMPT
    // ==========================================

    boolean canAttemptTest(
            Long studentId,
            Long testId
    );


    // ==========================================
    // GET REMAINING TIME
    // ==========================================

    long getRemainingSeconds(
            Long studentId,
            Long attemptId
    );
}