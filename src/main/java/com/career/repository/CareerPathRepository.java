package com.career.repository;

import com.career.constant.QueryConstants;
import com.career.entity.CareerPath;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CareerPathRepository extends JpaRepository<CareerPath, Long> {

    Optional<CareerPath> findByCategory(String category);

    Optional<CareerPath> findByCareerName(String careerName);

    boolean existsByCategory(String category);

    boolean existsByCareerName(String careerName);

    List<CareerPath> findAllByOrderByCareerNameAsc();

    @Query(QueryConstants.FIND_ALL_CAREER_PATHS_ORDERED)
    Page<CareerPath> findAllOrdered(Pageable pageable);

    @Query(QueryConstants.SEARCH_CAREER_PATHS)
    Page<CareerPath> searchCareerPaths(@Param("search") String search, Pageable pageable);
}