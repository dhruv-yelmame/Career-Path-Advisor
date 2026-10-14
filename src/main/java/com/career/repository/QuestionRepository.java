package com.career.repository;

import com.career.constant.QueryConstants;
import com.career.entity.Question;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface QuestionRepository extends JpaRepository<Question, Long> {

    @Modifying
    @Query(QueryConstants.DELETE_QUESTION_FROM_TESTS)
    int removeQuestionFromTests(@Param("questionId") Long questionId);

    @Query(QueryConstants.SEARCH_QUESTIONS)
    Page<Question> searchQuestions(
            @Param("search") String search,
            Pageable pageable);
}