package com.career.controller;

import com.career.dto.LoginRequest;
import com.career.dto.LoginResponse;
import com.career.dto.RegisterRequest;
import com.career.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
@Tag(name = "Authentication", description = "Authentication & Registration endpoints for Students and Admins")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @Operation(summary = "Register student", description = "Registers a new student and creates account")
    @ApiResponse(responseCode = "201", description = "Student successfully registered")
    public ResponseEntity<String> register(@Valid @RequestBody RegisterRequest request) {
        log.info("REST: Register request for email {}", request.getEmail());
        String message = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(message);
    }

    @PostMapping("/login")
    @Operation(summary = "Student Login", description = "Authenticates a student and returns JWT token")
    @ApiResponse(responseCode = "200", description = "Student authenticated successfully")
    public ResponseEntity<LoginResponse> studentLogin(@Valid @RequestBody LoginRequest request) {
        log.info("REST: Student login request for email {}", request.getEmail());
        LoginResponse response = authService.studentLogin(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/admin/login")
    @Operation(summary = "Admin Login", description = "Authenticates an administrator and returns JWT token")
    @ApiResponse(responseCode = "200", description = "Admin authenticated successfully")
    public ResponseEntity<LoginResponse> adminLogin(@Valid @RequestBody LoginRequest request) {
        log.info("REST: Admin login request for email {}", request.getEmail());
        LoginResponse response = authService.adminLogin(request);
        return ResponseEntity.ok(response);
    }
}