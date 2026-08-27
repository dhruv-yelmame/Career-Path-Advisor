package com.career.repository;

import com.career.constant.QueryConstants;
import com.career.entity.AssessmentResult;
import com.career.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AssessmentResultRepository extends JpaRepository<AssessmentResult, Long> {

    List<AssessmentResult> findByStudent(User student);

    List<AssessmentResult> findByStudentIdOrderByCompletedAtDesc(Long studentId);

    @Query(QueryConstants.FIND_RESULTS_BY_STUDENT)
    Page<AssessmentResult> findByStudentIdPaged(@Param("studentId") Long studentId, Pageable pageable);

    Optional<AssessmentResult> findTopByStudentIdOrderByCompletedAtDesc(Long studentId);

    Optional<AssessmentResult> findByAttemptId(Long attemptId);

    List<AssessmentResult> findByRecommendedCareerId(Long careerPathId);

    long countByRecommendedCareerId(Long careerPathId);

    @Query(QueryConstants.FIND_ALL_RESULTS_WITH_DETAILS)
    Page<AssessmentResult> findAllResultsPaged(Pageable pageable);
}