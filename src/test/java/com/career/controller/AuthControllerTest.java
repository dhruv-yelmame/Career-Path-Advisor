package com.career.controller;

import com.career.constant.AppConstants;
import com.career.dto.LoginRequest;
import com.career.dto.LoginResponse;
import com.career.dto.RegisterRequest;
import com.career.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private AuthService authService;

    @InjectMocks
    private AuthController authController;

    private LoginResponse mockResponse;

    @BeforeEach
    void setUp() {
        mockResponse = LoginResponse.builder()
                .token("mock_token")
                .userId(1L)
                .name("Alex Smith")
                .email("alex@example.com")
                .role(AppConstants.ROLE_STUDENT)
                .build();
    }

    @Test
    @DisplayName("Should return 200 OK and LoginResponse on valid student login")
    void testStudentLogin() {
        when(authService.studentLogin(any(LoginRequest.class))).thenReturn(mockResponse);

        LoginRequest request = LoginRequest.builder()
                .email("alex@example.com")
                .password("password123")
                .build();

        ResponseEntity<LoginResponse> response = authController.studentLogin(request);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertEquals("mock_token", response.getBody().getToken());
        assertEquals("Alex Smith", response.getBody().getName());
    }

    @Test
    @DisplayName("Should return 200 OK and LoginResponse on valid admin login")
    void testAdminLogin() {
        when(authService.adminLogin(any(LoginRequest.class))).thenReturn(mockResponse);

        LoginRequest request = LoginRequest.builder()
                .email("admin@example.com")
                .password("admin123")
                .build();

        ResponseEntity<LoginResponse> response = authController.adminLogin(request);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertEquals("mock_token", response.getBody().getToken());
    }

    @Test
    @DisplayName("Should return 201 CREATED on valid registration")
    void testRegister() {
        when(authService.register(any(RegisterRequest.class))).thenReturn("User registered successfully");

        RegisterRequest request = RegisterRequest.builder()
                .name("Alex Smith")
                .email("alex@example.com")
                .password("password123")
                .build();

        ResponseEntity<String> response = authController.register(request);

        assertNotNull(response);
        assertEquals(201, response.getStatusCode().value());
        assertEquals("User registered successfully", response.getBody());
    }
}
