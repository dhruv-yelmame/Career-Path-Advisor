package com.career.service;

import com.career.dto.PaginatedResponse;
import com.career.dto.TestQuestionResponse;
import com.career.dto.TestRequest;
import com.career.dto.TestResponse;
import com.career.entity.Test;

import java.util.List;

public interface TestService {

    Test createTest(TestRequest request);

    List<TestResponse> getAllTests();

    PaginatedResponse<TestResponse> getTestsPaged(int page, int size, String search);

    Test getTestById(Long id);

    List<TestQuestionResponse> getTestQuestions(Long id);

    Test updateTest(Long id, TestRequest request);

    void deleteTest(Long id);

    Test activateTest(Long id);

    Test deactivateTest(Long id);

    TestResponse convertToResponse(Test test);
}