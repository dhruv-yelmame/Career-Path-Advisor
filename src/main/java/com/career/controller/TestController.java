package com.career.controller;

import com.career.constant.AppConstants;
import com.career.dto.PaginatedResponse;
import com.career.dto.TestQuestionResponse;
import com.career.dto.TestRequest;
import com.career.dto.TestResponse;
import com.career.entity.Test;
import com.career.service.TestService;
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
@RequestMapping("/api/admin/tests")
@CrossOrigin(origins = "*")
@Tag(name = "Admin - Test Management", description = "Endpoints for creating and managing assessments and tests")
@SecurityRequirement(name = "Bearer Authentication")
public class TestController {

    private static final Logger log = LoggerFactory.getLogger(TestController.class);

    private final TestService testService;

    public TestController(TestService testService) {
        this.testService = testService;
    }

    @PostMapping
    @Operation(summary = "Create test", description = "Creates a new assessment test with selected questions")
    public ResponseEntity<TestResponse> createTest(@Valid @RequestBody TestRequest request) {
        log.info("REST: Create test {}", request.getTestName());
        Test test = testService.createTest(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(testService.convertToResponse(test));
    }

    @GetMapping
    @Operation(summary = "Get all tests", description = "Returns list of all tests (or paginated when page param is given)")
    public ResponseEntity<?> getAllTests(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false, defaultValue = AppConstants.DEFAULT_PAGE_SIZE) int size,
            @RequestParam(required = false) String search) {

        log.debug("REST: Fetching tests. page={}, size={}, search={}", page, size, search);
        if (page != null) {
            PaginatedResponse<TestResponse> paged = testService.getTestsPaged(page, size, search);
            return ResponseEntity.ok(paged);
        }

        List<TestResponse> tests = testService.getAllTests();
        return ResponseEntity.ok(tests);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get test by ID")
    public ResponseEntity<TestResponse> getTestById(@PathVariable Long id) {
        Test test = testService.getTestById(id);
        return ResponseEntity.ok(testService.convertToResponse(test));
    }

    @GetMapping("/{id}/questions")
    @Operation(summary = "Get test questions by test ID")
    public ResponseEntity<List<TestQuestionResponse>> getTestQuestions(@PathVariable Long id) {
        return ResponseEntity.ok(testService.getTestQuestions(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update test")
    public ResponseEntity<TestResponse> updateTest(
            @PathVariable Long id,
            @Valid @RequestBody TestRequest request) {
        log.info("REST: Update test ID {}", id);
        Test test = testService.updateTest(id, request);
        return ResponseEntity.ok(testService.convertToResponse(test));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete test")
    public ResponseEntity<String> deleteTest(@PathVariable Long id) {
        log.info("REST: Delete test ID {}", id);
        testService.deleteTest(id);
        return ResponseEntity.ok("Test deleted successfully");
    }

    @PutMapping("/{id}/activate")
    @Operation(summary = "Activate test")
    public ResponseEntity<TestResponse> activateTest(@PathVariable Long id) {
        log.info("REST: Activate test ID {}", id);
        Test test = testService.activateTest(id);
        return ResponseEntity.ok(testService.convertToResponse(test));
    }

    @PutMapping("/{id}/deactivate")
    @Operation(summary = "Deactivate test")
    public ResponseEntity<TestResponse> deactivateTest(@PathVariable Long id) {
        log.info("REST: Deactivate test ID {}", id);
        Test test = testService.deactivateTest(id);
        return ResponseEntity.ok(testService.convertToResponse(test));
    }
}