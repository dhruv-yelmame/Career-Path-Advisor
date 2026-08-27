package com.career.repository;

import com.career.constant.QueryConstants;
import com.career.entity.TestQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TestQuestionRepository extends JpaRepository<TestQuestion, Long> {

    // ==========================================
    // GET QUESTIONS OF TEST
    // ==========================================
    List<TestQuestion> findByTestIdOrderByQuestionOrderAsc(Long testId);

    // ==========================================
    // DELETE QUESTIONS OF TEST
    // ==========================================
    @Modifying
    @Query(QueryConstants.DELETE_TEST_QUESTIONS_BY_TEST_ID)
    int deleteByTestId(@Param("testId") Long testId);

    // ==========================================
    // DELETE QUESTION FROM ALL TESTS
    // ==========================================
    @Modifying
    @Query(QueryConstants.DELETE_QUESTION_FROM_TESTS)
    int deleteByQuestionId(@Param("questionId") Long questionId);
}