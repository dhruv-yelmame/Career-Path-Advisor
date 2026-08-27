package com.career.service;

import com.career.dto.PaginatedResponse;
import com.career.dto.QuestionRequest;
import com.career.dto.QuestionResponse;
import com.career.entity.Question;

import java.util.List;

public interface QuestionService {

    Question addQuestion(QuestionRequest request);

    List<Question> addQuestionsBatch(List<QuestionRequest> requests);

    List<Question> getAllQuestions();

    PaginatedResponse<QuestionResponse> getQuestionsPaged(int page, int size, String search, String type);

    Question getQuestionById(Long id);

    Question updateQuestion(Long id, QuestionRequest request);

    void deleteQuestion(Long id);

    QuestionResponse convertToResponse(Question question);
}