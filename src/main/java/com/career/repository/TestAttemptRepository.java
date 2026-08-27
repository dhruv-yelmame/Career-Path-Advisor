package com.career.repository;

import com.career.entity.AttemptStatus;
import com.career.entity.TestAttempt;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TestAttemptRepository extends JpaRepository<TestAttempt, Long> {

    Optional<TestAttempt> findTopByStudentIdAndTestIdOrderByStartedAtDesc(
            Long studentId,
            Long testId
    );

    boolean existsByStudentIdAndTestIdAndStartedAtAfter(
            Long studentId,
            Long testId,
            LocalDateTime time
    );

    long countByTestId(Long testId);

    long countByStudentId(Long studentId);

    long countByStudentIdAndStatus(Long studentId, AttemptStatus status);

    List<TestAttempt> findByStudentIdOrderByStartedAtDesc(Long studentId);

    Page<TestAttempt> findByStudentIdOrderByStartedAtDesc(Long studentId, Pageable pageable);

    long countByStatus(AttemptStatus status);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query(com.career.constant.QueryConstants.UPDATE_TEST_ATTEMPT_STATUS)
    int updateAttemptStatus(
            @org.springframework.data.repository.query.Param("id") Long id,
            @org.springframework.data.repository.query.Param("status") AttemptStatus status,
            @org.springframework.data.repository.query.Param("submittedAt") LocalDateTime submittedAt,
            @org.springframework.data.repository.query.Param("score") Integer score
    );
}