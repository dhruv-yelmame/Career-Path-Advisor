package com.career.controller;

import com.career.dto.LearningResourceRequest;
import com.career.dto.LearningResourceResponse;
import com.career.dto.PaginatedResponse;
import com.career.service.LearningResourceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
@Tag(name = "Learning Resources", description = "Endpoints for managing and exploring learning materials, courses, and roadmaps")
@SecurityRequirement(name = "Bearer Authentication")
public class LearningResourceController {

    private static final Logger log = LoggerFactory.getLogger(LearningResourceController.class);

    private final LearningResourceService learningResourceService;

    public LearningResourceController(LearningResourceService learningResourceService) {
        this.learningResourceService = learningResourceService;
    }

    // ==========================================
    // ADMIN ENDPOINTS
    // ==========================================

    @GetMapping("/api/admin/resources")
    @Operation(summary = "Get filtered learning resources (Admin)")
    public ResponseEntity<PaginatedResponse<LearningResourceResponse>> getResources(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String courseTrack,
            @RequestParam(required = false) String resourceType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(learningResourceService.getResourcesFiltered(search, courseTrack, resourceType, page, size));
    }

    @GetMapping("/api/admin/resources/stats")
    @Operation(summary = "Get learning resource catalog statistics")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(learningResourceService.getResourceStats());
    }

    @GetMapping("/api/admin/resources/{id}")
    @Operation(summary = "Get resource by ID")
    public ResponseEntity<LearningResourceResponse> getResourceById(@PathVariable Long id) {
        return ResponseEntity.ok(learningResourceService.getResourceById(id));
    }

    @PostMapping("/api/admin/resources")
    @Operation(summary = "Create learning resource")
    public ResponseEntity<LearningResourceResponse> createResource(@Valid @RequestBody LearningResourceRequest request) {
        log.info("REST: Admin creating resource '{}'", request.getTitle());
        return ResponseEntity.status(HttpStatus.CREATED).body(learningResourceService.createResource(request));
    }

    @PutMapping("/api/admin/resources/{id}")
    @Operation(summary = "Update learning resource")
    public ResponseEntity<LearningResourceResponse> updateResource(@PathVariable Long id, @Valid @RequestBody LearningResourceRequest request) {
        log.info("REST: Admin updating resource ID {}", id);
        return ResponseEntity.ok(learningResourceService.updateResource(id, request));
    }

    @DeleteMapping("/api/admin/resources/{id}")
    @Operation(summary = "Delete learning resource")
    public ResponseEntity<Void> deleteResource(@PathVariable Long id) {
        log.info("REST: Admin deleting resource ID {}", id);
        learningResourceService.deleteResource(id);
        return ResponseEntity.noContent().build();
    }

    // ==========================================
    // STUDENT ENDPOINTS
    // ==========================================

    @GetMapping("/api/student/resources")
    @Operation(summary = "Get learning resources for student roadmap")
    public ResponseEntity<List<LearningResourceResponse>> getStudentResources(@RequestParam(required = false) String track) {
        if (track != null && !track.trim().isEmpty() && !track.equalsIgnoreCase("ALL")) {
            return ResponseEntity.ok(learningResourceService.getResourcesByTrack(track.trim()));
        }
        return ResponseEntity.ok(learningResourceService.getAllResources());
    }
}
