package com.career.repository;

import com.career.constant.QueryConstants;
import com.career.entity.Question;
import com.career.entity.QuestionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {

    @Modifying
    @Query(QueryConstants.DELETE_QUESTION_FROM_TESTS)
    int removeQuestionFromTests(@Param("questionId") Long questionId);

    List<Question> findByActiveTrue();

    List<Question> findByQuestionType(QuestionType questionType);

    Page<Question> findByActiveTrue(Pageable pageable);

    @Query(QueryConstants.SEARCH_QUESTIONS)
    Page<Question> searchQuestions(
            @Param("search") String search,
            @Param("type") QuestionType type,
            Pageable pageable);

    @Modifying
    @Query(QueryConstants.UPDATE_QUESTION_ACTIVE_STATUS)
    int updateActiveStatus(@Param("id") Long id, @Param("active") Boolean active);
}