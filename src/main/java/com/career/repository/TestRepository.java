package com.career.repository;

import com.career.constant.QueryConstants;
import com.career.entity.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface TestRepository extends JpaRepository<Test, Long> {

    List<Test> findByActiveTrue();

    long countByActiveTrue();

    List<Test> findByActiveTrueAndStartTimeIsNull();

    List<Test> findByActiveTrueAndStartTimeBeforeAndEndTimeAfter(
            LocalDateTime now1,
            LocalDateTime now2
    );

    List<Test> findByOrderByCreatedAtDesc();

    Page<Test> findByActiveTrue(Pageable pageable);

    @Query(QueryConstants.SEARCH_TESTS)
    Page<Test> searchTests(@Param("search") String search, Pageable pageable);

    @org.springframework.data.jpa.repository.Modifying
    @Query(QueryConstants.UPDATE_TEST_ACTIVE_STATUS)
    int updateActiveStatus(@Param("id") Long id, @Param("active") Boolean active);
}