package com.career.repository;

import com.career.entity.AssessmentAnswer;
import com.career.entity.AssessmentResult;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AssessmentAnswerRepository
        extends JpaRepository<AssessmentAnswer, Long> {

    List<AssessmentAnswer> findByResult(
            AssessmentResult result
    );

    void deleteByResult(
            AssessmentResult result
    );
}