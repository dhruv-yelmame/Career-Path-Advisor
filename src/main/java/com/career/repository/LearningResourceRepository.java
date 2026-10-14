package com.career.repository;

import com.career.entity.LearningResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LearningResourceRepository extends JpaRepository<LearningResource, Long>, JpaSpecificationExecutor<LearningResource> {

    List<LearningResource> findByCourseTrackIgnoreCase(String courseTrack);

    List<LearningResource> findByStatusIgnoreCase(String status);

    @Query("SELECT r FROM LearningResource r WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(r.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(r.description) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(r.category) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(r.courseTrack) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(r.stage) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(r.resourceType) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:courseTrack IS NULL OR :courseTrack = '' OR LOWER(r.courseTrack) LIKE LOWER(CONCAT('%', :courseTrack, '%'))) AND " +
           "(:resourceType IS NULL OR :resourceType = '' OR LOWER(r.resourceType) LIKE LOWER(CONCAT('%', :resourceType, '%')))")
    Page<LearningResource> filterResources(@Param("search") String search,
                                           @Param("courseTrack") String courseTrack,
                                           @Param("resourceType") String resourceType,
                                           Pageable pageable);

    @Query("SELECT COUNT(DISTINCT r.category) FROM LearningResource r")
    long countDistinctCategories();

    @Query("SELECT COUNT(DISTINCT r.courseTrack) FROM LearningResource r")
    long countDistinctCourseTracks();

    @Query("SELECT COUNT(DISTINCT r.stage) FROM LearningResource r")
    long countDistinctStages();
}
