package com.career.service;

import com.career.dto.AssessmentResultResponse;
import com.career.dto.PaginatedResponse;
import com.career.dto.StudentResultResponse;
import com.career.dto.TestResultSummaryResponse;

import java.util.List;

public interface ResultService {

    AssessmentResultResponse getResult(Long resultId);

    List<AssessmentResultResponse> getStudentResults(Long studentId);

    PaginatedResponse<AssessmentResultResponse> getStudentResultsPaged(Long studentId, int page, int size);

    PaginatedResponse<StudentResultResponse> getAllResultsPaged(int page, int size);

    PaginatedResponse<StudentResultResponse> getAllResultsPaged(Long testId, String search, int page, int size);

    List<TestResultSummaryResponse> getTestsSummary();
}