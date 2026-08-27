package com.career.controller;

import com.career.constant.AppConstants;
import com.career.dto.CareerPathRequest;
import com.career.dto.CareerPathResponse;
import com.career.dto.PaginatedResponse;
import com.career.service.CareerPathService;
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

@RestController
@RequestMapping("/api/admin/career-paths")
@CrossOrigin(origins = "*")
@Tag(name = "Admin - Career Paths", description = "Endpoints for managing career paths and recommendations")
@SecurityRequirement(name = "Bearer Authentication")
public class CareerPathController {

    private static final Logger log = LoggerFactory.getLogger(CareerPathController.class);

    private final CareerPathService careerPathService;

    public CareerPathController(CareerPathService careerPathService) {
        this.careerPathService = careerPathService;
    }

    @PostMapping
    @Operation(summary = "Add career path", description = "Creates a new career recommendation profile")
    public ResponseEntity<CareerPathResponse> addCareerPath(@Valid @RequestBody CareerPathRequest request) {
        log.info("REST: Add career path {}", request.getCareerName());
        CareerPathResponse response = careerPathService.addCareerPath(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @Operation(summary = "Get all career paths", description = "Returns list of all career paths (or paged if requested)")
    public ResponseEntity<?> getAllCareerPaths(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false, defaultValue = AppConstants.DEFAULT_PAGE_SIZE) int size,
            @RequestParam(required = false) String search) {

        log.debug("REST: Fetching career paths. page={}, size={}, search={}", page, size, search);
        if (page != null) {
            PaginatedResponse<CareerPathResponse> paged = careerPathService.getCareerPathsPaged(page, size, search);
            return ResponseEntity.ok(paged);
        }

        List<CareerPathResponse> all = careerPathService.getAllCareerPaths();
        return ResponseEntity.ok(all);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get career path by ID")
    public ResponseEntity<CareerPathResponse> getCareerPathById(@PathVariable Long id) {
        return ResponseEntity.ok(careerPathService.getCareerPathById(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update career path")
    public ResponseEntity<CareerPathResponse> updateCareerPath(
            @PathVariable Long id,
            @Valid @RequestBody CareerPathRequest request) {
        log.info("REST: Update career path ID {}", id);
        return ResponseEntity.ok(careerPathService.updateCareerPath(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete career path")
    public ResponseEntity<String> deleteCareerPath(@PathVariable Long id) {
        log.info("REST: Delete career path ID {}", id);
        careerPathService.deleteCareerPath(id);
        return ResponseEntity.ok("Career path deleted successfully");
    }
}