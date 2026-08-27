package com.career.service;

import com.career.dto.AssessmentResultResponse;
import com.career.dto.PaginatedResponse;
import com.career.dto.StudentResultResponse;

import java.util.List;

public interface ResultService {

    AssessmentResultResponse getResult(Long resultId);

    List<AssessmentResultResponse> getStudentResults(Long studentId);

    PaginatedResponse<AssessmentResultResponse> getStudentResultsPaged(Long studentId, int page, int size);

    PaginatedResponse<StudentResultResponse> getAllResultsPaged(int page, int size);
}