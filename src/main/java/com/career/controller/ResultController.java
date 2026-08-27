package com.career.controller;

import com.career.constant.AppConstants;
import com.career.dto.AssessmentResultResponse;
import com.career.dto.PaginatedResponse;
import com.career.dto.StudentResultResponse;
import com.career.entity.User;
import com.career.repository.UserRepository;
import com.career.service.ResultService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/student/results")
@CrossOrigin(origins = "*")
@Tag(name = "Student & Admin - Results", description = "Endpoints for viewing assessment results and reports")
@SecurityRequirement(name = "Bearer Authentication")
public class ResultController {

    private static final Logger log = LoggerFactory.getLogger(ResultController.class);

    private final ResultService resultService;
    private final UserRepository userRepository;

    public ResultController(ResultService resultService, UserRepository userRepository) {
        this.resultService = resultService;
        this.userRepository = userRepository;
    }

    @GetMapping({"", "/", "/my-results"})
    @Operation(summary = "Get current authenticated student results")
    public ResponseEntity<List<AssessmentResultResponse>> getMyResults() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null) {
            if (authentication.getPrincipal() instanceof User) {
                User student = (User) authentication.getPrincipal();
                log.debug("REST: Fetching authenticated results for student ID {}", student.getId());
                return ResponseEntity.ok(resultService.getStudentResults(student.getId()));
            }
            String email = authentication.getName();
            if (email != null && !email.equalsIgnoreCase("anonymousUser")) {
                User student = userRepository.findByEmail(email).orElse(null);
                if (student != null) {
                    log.debug("REST: Fetching authenticated results for student ID {}", student.getId());
                    return ResponseEntity.ok(resultService.getStudentResults(student.getId()));
                }
            }
        }
        return ResponseEntity.ok(List.of());
    }

    @GetMapping("/{resultId:\\d+}")
    @Operation(summary = "Get result by ID")
    public ResponseEntity<AssessmentResultResponse> getResult(@PathVariable Long resultId) {
        log.debug("REST: Fetching result ID {}", resultId);
        return ResponseEntity.ok(resultService.getResult(resultId));
    }

    @GetMapping("/student/{studentId:\\d+}")
    @Operation(summary = "Get results by student ID (supports pagination)")
    public ResponseEntity<?> getStudentResults(
            @PathVariable Long studentId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false, defaultValue = AppConstants.DEFAULT_PAGE_SIZE) int size) {

        log.debug("REST: Fetching student results. studentId={}, page={}", studentId, page);
        if (page != null) {
            PaginatedResponse<AssessmentResultResponse> paged = resultService.getStudentResultsPaged(studentId, page, size);
            return ResponseEntity.ok(paged);
        }

        List<AssessmentResultResponse> list = resultService.getStudentResults(studentId);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/all")
    @Operation(summary = "Get all assessment results across students (Admin/Student report)")
    public ResponseEntity<PaginatedResponse<StudentResultResponse>> getAllResultsPaged(
            @RequestParam(required = false, defaultValue = AppConstants.DEFAULT_PAGE_NUMBER) int page,
            @RequestParam(required = false, defaultValue = AppConstants.DEFAULT_PAGE_SIZE) int size) {

        log.debug("REST: Fetching all results paged. page={}, size={}", page, size);
        return ResponseEntity.ok(resultService.getAllResultsPaged(page, size));
    }
}