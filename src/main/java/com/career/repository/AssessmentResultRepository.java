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

    @Query(value = QueryConstants.FIND_RESULTS_BY_TEST_AND_SEARCH, countQuery = QueryConstants.COUNT_RESULTS_BY_TEST_AND_SEARCH)
    Page<AssessmentResult> findResultsByTestIdAndSearchPaged(
            @Param("testId") Long testId,
            @Param("search") String search,
            Pageable pageable);

    @Query("SELECT r FROM AssessmentResult r JOIN FETCH r.student LEFT JOIN FETCH r.recommendedCareer JOIN r.attempt a WHERE a.test.id = :testId ORDER BY r.completedAt DESC")
    List<AssessmentResult> findResultsByTestId(@Param("testId") Long testId);

    @Query("SELECT COUNT(r) FROM AssessmentResult r JOIN r.attempt a WHERE a.test.id = :testId")
    long countResultsByTestId(@Param("testId") Long testId);
}