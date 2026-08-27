package com.career.controller;

import com.career.dto.*;
import com.career.entity.CareerPath;
import com.career.entity.Role;
import com.career.entity.User;
import com.career.exception.ResourceNotFoundException;
import com.career.repository.CareerPathRepository;
import com.career.repository.TestAttemptRepository;
import com.career.repository.TestRepository;
import com.career.repository.UserRepository;
import com.career.service.CareerPathService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/student")
@CrossOrigin(origins = "*")
@Tag(name = "Student - Profile & Dashboard", description = "Endpoints for managing student profile, statistics, and career exploration")
@SecurityRequirement(name = "Bearer Authentication")
public class StudentProfileController {

    private static final Logger log = LoggerFactory.getLogger(StudentProfileController.class);

    private final UserRepository userRepository;
    private final TestRepository testRepository;
    private final TestAttemptRepository testAttemptRepository;
    private final CareerPathService careerPathService;
    private final PasswordEncoder passwordEncoder;

    public StudentProfileController(UserRepository userRepository,
                                    TestRepository testRepository,
                                    TestAttemptRepository testAttemptRepository,
                                    CareerPathService careerPathService,
                                    PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.testRepository = testRepository;
        this.testAttemptRepository = testAttemptRepository;
        this.careerPathService = careerPathService;
        this.passwordEncoder = passwordEncoder;
    }

    private User getAuthenticatedStudent() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            throw new ResourceNotFoundException("Unauthenticated request");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof User) {
            return (User) principal;
        }

        String email = authentication.getName();
        if (email != null && !email.equalsIgnoreCase("anonymousUser")) {
            return userRepository.findByEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("Student account not found for email: " + email));
        }

        throw new ResourceNotFoundException("Unauthenticated request");
    }

    @GetMapping("/profile")
    @Operation(summary = "Get current student profile")
    public ResponseEntity<UserProfileResponse> getProfile() {
        User student = getAuthenticatedStudent();
        return ResponseEntity.ok(new UserProfileResponse(
                student.getId(),
                student.getName(),
                student.getEmail(),
                student.getRole(),
                student.getMobile(),
                student.getCourse(),
                student.getPercentage()
        ));
    }

    @PutMapping("/profile")
    @Operation(summary = "Update student profile details")
    public ResponseEntity<UserProfileResponse> updateProfile(@Valid @RequestBody StudentProfileRequest request) {
        User student = getAuthenticatedStudent();

        if (!student.getEmail().equalsIgnoreCase(request.getEmail().trim()) &&
                userRepository.existsByEmail(request.getEmail().trim())) {
            throw new IllegalArgumentException("Email " + request.getEmail() + " is already in use by another account.");
        }

        student.setName(request.getName().trim());
        student.setEmail(request.getEmail().trim());
        if (request.getMobile() != null) {
            student.setMobile(request.getMobile().trim());
        }
        if (request.getCourse() != null) {
            student.setCourse(request.getCourse().trim());
        }
        if (request.getPercentage() != null) {
            student.setPercentage(request.getPercentage().trim());
        }

        User updated = userRepository.save(student);
        log.info("REST: Student profile updated successfully for ID {}", updated.getId());

        return ResponseEntity.ok(new UserProfileResponse(
                updated.getId(),
                updated.getName(),
                updated.getEmail(),
                updated.getRole(),
                updated.getMobile(),
                updated.getCourse(),
                updated.getPercentage()
        ));
    }

    @PutMapping("/profile/password")
    @Operation(summary = "Change student password")
    public ResponseEntity<String> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        User student = getAuthenticatedStudent();

        if (!passwordEncoder.matches(request.getCurrentPassword(), student.getPassword())) {
            throw new IllegalArgumentException("Current password does not match.");
        }

        student.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(student);
        log.info("REST: Password successfully updated for student ID {}", student.getId());

        return ResponseEntity.ok("Password updated successfully.");
    }

    @GetMapping("/career-paths")
    @Operation(summary = "Get all career paths for student exploration")
    public ResponseEntity<List<CareerPathResponse>> getCareerPaths() {
        return ResponseEntity.ok(careerPathService.getAllCareerPaths());
    }

    @GetMapping("/stats")
    @Operation(summary = "Get student dashboard statistics")
    public ResponseEntity<Map<String, Object>> getStudentStats(@RequestParam(required = false) Long studentId) {
        Long resolvedId = studentId;
        if (resolvedId == null) {
            try {
                User student = getAuthenticatedStudent();
                resolvedId = student.getId();
            } catch (Exception e) {
                // Ignore if fallback
            }
        }

        long availableTests = testRepository.countByActiveTrue();
        long attemptedTests = resolvedId != null ? testAttemptRepository.countByStudentId(resolvedId) : 0;
        long completedTests = resolvedId != null ? testAttemptRepository.countByStudentIdAndStatus(resolvedId, com.career.entity.AttemptStatus.COMPLETED) : 0;
        long totalCareers = careerPathService.getAllCareerPaths().size();

        Map<String, Object> stats = new HashMap<>();
        stats.put("availableTests", availableTests);
        stats.put("attemptedTests", attemptedTests);
        stats.put("completedTests", completedTests);
        stats.put("totalCareers", totalCareers);

        return ResponseEntity.ok(stats);
    }
}
