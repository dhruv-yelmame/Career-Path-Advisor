package com.career.repository;

import com.career.entity.QuestionOption;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionOptionRepository
        extends JpaRepository<QuestionOption, Long> {

    List<QuestionOption> findByQuestionId(
            Long questionId
    );

    List<QuestionOption>
    findByQuestionIdOrderByIdAsc(
            Long questionId
    );

    void deleteByQuestionId(
            Long questionId
    );
}