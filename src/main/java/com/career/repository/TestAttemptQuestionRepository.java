package com.career.repository;

import com.career.entity.TestAttemptQuestion;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TestAttemptQuestionRepository
        extends JpaRepository<TestAttemptQuestion, Long> {

    List<TestAttemptQuestion>
    findByAttemptIdOrderByQuestionOrderAsc(
            Long attemptId
    );

    boolean existsByAttemptIdAndQuestionId(
            Long attemptId,
            Long questionId
    );

    long countByAttemptId(
            Long attemptId
    );

    void deleteByAttemptId(
            Long attemptId
    );
}