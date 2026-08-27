package com.career.repository;

import com.career.entity.TestAttemptAnswer;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TestAttemptAnswerRepository
        extends JpaRepository<TestAttemptAnswer, Long> {

    List<TestAttemptAnswer>
    findByAttemptId(
            Long attemptId
    );

    List<TestAttemptAnswer>
    findByAttemptIdOrderByQuestionIdAsc(
            Long attemptId
    );

    Optional<TestAttemptAnswer>
    findByAttemptIdAndQuestionId(
            Long attemptId,
            Long questionId
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