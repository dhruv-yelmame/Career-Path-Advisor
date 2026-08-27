package com.career.controller;

import com.career.dto.AdminProfileRequest;
import com.career.dto.ChangePasswordRequest;
import com.career.dto.UserProfileResponse;
import com.career.entity.Role;
import com.career.entity.User;
import com.career.exception.ResourceNotFoundException;
import com.career.repository.UserRepository;
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

@RestController
@RequestMapping("/api/admin/profile")
@CrossOrigin(origins = "*")
@Tag(name = "Admin - Profile", description = "Endpoints for managing admin account and credentials")
@SecurityRequirement(name = "Bearer Authentication")
public class AdminProfileController {

    private static final Logger log = LoggerFactory.getLogger(AdminProfileController.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminProfileController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    private User getAuthenticatedAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication != null ? authentication.getName() : null;
        if (email != null && !email.equalsIgnoreCase("anonymousUser")) {
            return userRepository.findByEmail(email)
                    .orElseGet(() -> userRepository.findByRole(Role.ADMIN).stream().findFirst()
                            .orElseThrow(() -> new ResourceNotFoundException("Admin account not found")));
        }
        return userRepository.findByRole(Role.ADMIN).stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Admin account not found"));
    }

    @GetMapping
    @Operation(summary = "Get current admin profile")
    public ResponseEntity<UserProfileResponse> getProfile() {
        User admin = getAuthenticatedAdmin();
        return ResponseEntity.ok(new UserProfileResponse(
                admin.getId(),
                admin.getName(),
                admin.getEmail(),
                admin.getRole(),
                admin.getMobile(),
                admin.getCourse(),
                admin.getPercentage()
        ));
    }

    @PutMapping
    @Operation(summary = "Update admin profile details")
    public ResponseEntity<UserProfileResponse> updateProfile(@Valid @RequestBody AdminProfileRequest request) {
        User admin = getAuthenticatedAdmin();

        if (!admin.getEmail().equalsIgnoreCase(request.getEmail().trim()) &&
                userRepository.existsByEmail(request.getEmail().trim())) {
            throw new IllegalArgumentException("Email " + request.getEmail() + " is already in use by another user.");
        }

        admin.setName(request.getName().trim());
        admin.setEmail(request.getEmail().trim());
        if (request.getMobile() != null) {
            admin.setMobile(request.getMobile().trim());
        }

        User updated = userRepository.save(admin);
        log.info("REST: Admin profile updated successfully for ID {}", updated.getId());

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

    @PutMapping("/password")
    @Operation(summary = "Change admin password")
    public ResponseEntity<String> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        User admin = getAuthenticatedAdmin();

        if (!passwordEncoder.matches(request.getCurrentPassword(), admin.getPassword())) {
            throw new IllegalArgumentException("Current password does not match.");
        }

        admin.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(admin);
        log.info("REST: Password successfully updated for admin ID {}", admin.getId());

        return ResponseEntity.ok("Password updated successfully.");
    }
}
