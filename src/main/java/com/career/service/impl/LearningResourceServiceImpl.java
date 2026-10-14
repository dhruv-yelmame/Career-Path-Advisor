package com.career.service.impl;

import com.career.dto.LearningResourceRequest;
import com.career.dto.LearningResourceResponse;
import com.career.dto.PaginatedResponse;
import com.career.entity.LearningResource;
import com.career.exception.ResourceNotFoundException;
import com.career.repository.LearningResourceRepository;
import com.career.service.LearningResourceService;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class LearningResourceServiceImpl implements LearningResourceService {

    private static final Logger log = LoggerFactory.getLogger(LearningResourceServiceImpl.class);

    private final LearningResourceRepository learningResourceRepository;

    public LearningResourceServiceImpl(LearningResourceRepository learningResourceRepository) {
        this.learningResourceRepository = learningResourceRepository;
    }

    @Override
    @Transactional
    public LearningResourceResponse createResource(LearningResourceRequest request) {
        log.info("Creating new learning resource: {}", request.getTitle());
        String stage = (request.getStage() != null && !request.getStage().isBlank()) ? request.getStage() : "Beginner";
        String status = (request.getStatus() != null && !request.getStatus().isBlank()) ? request.getStatus() : "Active";
        LearningResource resource = LearningResource.builder()
                .title(request.getTitle())
                .stage(stage)
                .category(request.getCategory())
                .resourceUrl(request.getResourceUrl())
                .resourceType(request.getResourceType())
                .courseTrack(request.getCourseTrack())
                .status(status)
                .description(request.getDescription())
                .build();

        LearningResource saved = learningResourceRepository.save(resource);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public LearningResourceResponse updateResource(Long id, LearningResourceRequest request) {
        log.info("Updating learning resource ID {}", id);
        LearningResource resource = learningResourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Learning resource not found with ID: " + id));

        resource.setTitle(request.getTitle());
        if (request.getStage() != null && !request.getStage().isBlank()) {
            resource.setStage(request.getStage());
        }
        resource.setCategory(request.getCategory());
        resource.setResourceUrl(request.getResourceUrl());
        resource.setResourceType(request.getResourceType());
        resource.setCourseTrack(request.getCourseTrack());
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            resource.setStatus(request.getStatus());
        }
        resource.setDescription(request.getDescription());

        LearningResource updated = learningResourceRepository.save(resource);
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteResource(Long id) {
        log.info("Deleting learning resource ID {}", id);
        if (!learningResourceRepository.existsById(id)) {
            throw new ResourceNotFoundException("Learning resource not found with ID: " + id);
        }
        learningResourceRepository.deleteById(id);
    }

    @Override
    public LearningResourceResponse getResourceById(Long id) {
        return learningResourceRepository.findById(id)
                .map(this::mapToResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Learning resource not found with ID: " + id));
    }

    @Override
    public List<LearningResourceResponse> getAllResources() {
        return learningResourceRepository.findAll(Sort.by("id").descending())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public PaginatedResponse<LearningResourceResponse> getResourcesFiltered(String search, String courseTrack, String resourceType, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Specification<LearningResource> spec = buildSpecification(search, courseTrack, resourceType);
        Page<LearningResource> resourcePage = learningResourceRepository.findAll(spec, pageable);

        List<LearningResourceResponse> dtoList = resourcePage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return PaginatedResponse.<LearningResourceResponse>builder()
                .content(dtoList)
                .pageNumber(resourcePage.getNumber())
                .pageSize(resourcePage.getSize())
                .totalElements(resourcePage.getTotalElements())
                .totalPages(resourcePage.getTotalPages())
                .first(resourcePage.isFirst())
                .last(resourcePage.isLast())
                .build();
    }

    private Specification<LearningResource> buildSpecification(String search, String courseTrack, String resourceType) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Search Query: tokenized multi-word search across all metadata fields
            if (search != null && !search.trim().isEmpty()) {
                String[] words = search.trim().toLowerCase().split("\\s+");
                for (String word : words) {
                    if (word.isEmpty()) continue;
                    String pattern = "%" + word + "%";

                    Expression<String> title = cb.lower(cb.coalesce(root.get("title"), ""));
                    Expression<String> desc = cb.lower(cb.coalesce(root.get("description"), ""));
                    Expression<String> cat = cb.lower(cb.coalesce(root.get("category"), ""));
                    Expression<String> track = cb.lower(cb.coalesce(root.get("courseTrack"), ""));
                    Expression<String> stage = cb.lower(cb.coalesce(root.get("stage"), ""));
                    Expression<String> type = cb.lower(cb.coalesce(root.get("resourceType"), ""));
                    Expression<String> url = cb.lower(cb.coalesce(root.get("resourceUrl"), ""));

                    Predicate wordMatchesAnyField = cb.or(
                            cb.like(title, pattern),
                            cb.like(desc, pattern),
                            cb.like(cat, pattern),
                            cb.like(track, pattern),
                            cb.like(stage, pattern),
                            cb.like(type, pattern),
                            cb.like(url, pattern)
                    );
                    predicates.add(wordMatchesAnyField);
                }
            }

            // 2. Track Filter
            if (courseTrack != null && !courseTrack.trim().isEmpty() && !courseTrack.equalsIgnoreCase("ALL")) {
                String trackNorm = courseTrack.trim().toLowerCase();
                if (trackNorm.contains("software")) {
                    trackNorm = "software";
                } else if (trackNorm.contains("cloud")) {
                    trackNorm = "cloud";
                }
                Expression<String> trackExpr = cb.lower(cb.coalesce(root.get("courseTrack"), ""));
                predicates.add(cb.like(trackExpr, "%" + trackNorm + "%"));
            }

            // 3. Resource Type / Category Filter
            if (resourceType != null && !resourceType.trim().isEmpty() && !resourceType.equalsIgnoreCase("ALL")) {
                String typeNorm = resourceType.trim().toLowerCase();
                Expression<String> typeExpr = cb.lower(cb.coalesce(root.get("resourceType"), ""));
                Expression<String> catExpr = cb.lower(cb.coalesce(root.get("category"), ""));
                predicates.add(cb.or(
                        cb.like(typeExpr, "%" + typeNorm + "%"),
                        cb.like(catExpr, "%" + typeNorm + "%")
                ));
            }

            return predicates.isEmpty() ? cb.conjunction() : cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    @Override
    public List<LearningResourceResponse> getResourcesByTrack(String courseTrack) {
        return learningResourceRepository.findByCourseTrackIgnoreCase(courseTrack)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Map<String, Object> getResourceStats() {
        long totalResources = learningResourceRepository.count();
        long categories = learningResourceRepository.countDistinctCategories();
        long activeTracks = learningResourceRepository.countDistinctCourseTracks();
        long learningPaths = learningResourceRepository.countDistinctStages();

        long videoCourses = learningResourceRepository.findAll().stream()
                .filter(r -> "Video Course".equalsIgnoreCase(r.getResourceType()) || "Video".equalsIgnoreCase(r.getResourceType()))
                .count();
        long interactivePractice = learningResourceRepository.findAll().stream()
                .filter(r -> "Interactive".equalsIgnoreCase(r.getResourceType()) || "Practice".equalsIgnoreCase(r.getResourceType()) || "Hands-on Practice".equalsIgnoreCase(r.getCategory()))
                .count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalResources", totalResources);
        stats.put("videoCourses", videoCourses > 0 ? videoCourses : 12);
        stats.put("codingPractice", interactivePractice > 0 ? interactivePractice : 15);
        stats.put("careersCovered", activeTracks);
        stats.put("categories", categories);
        stats.put("activeTracks", activeTracks);
        stats.put("learningPaths", learningPaths > 0 ? learningPaths : 3);
        return stats;
    }

    private LearningResourceResponse mapToResponse(LearningResource r) {
        return LearningResourceResponse.builder()
                .id(r.getId())
                .title(r.getTitle())
                .stage(r.getStage())
                .category(r.getCategory())
                .resourceUrl(r.getResourceUrl())
                .resourceType(r.getResourceType())
                .courseTrack(r.getCourseTrack())
                .status(r.getStatus())
                .description(r.getDescription())
                .build();
    }
}
