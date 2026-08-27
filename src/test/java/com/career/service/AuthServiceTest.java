package com.career.service;

import com.career.constant.AppConstants;
import com.career.dto.LoginRequest;
import com.career.dto.LoginResponse;
import com.career.dto.RegisterRequest;
import com.career.entity.Role;
import com.career.entity.User;
import com.career.exception.BadRequestException;
import com.career.exception.DuplicateResourceException;
import com.career.exception.ResourceNotFoundException;
import com.career.repository.UserRepository;
import com.career.security.JwtService;
import com.career.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private AuthServiceImpl authService;

    private User sampleUser;
    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(1L)
                .name("Alex Smith")
                .email("alex@example.com")
                .password("encoded_pass")
                .role(Role.STUDENT)
                .mobile("9876543210")
                .course("Computer Science")
                .percentage("88.5")
                .build();

        registerRequest = RegisterRequest.builder()
                .name("Alex Smith")
                .email("alex@example.com")
                .password("plain_pass")
                .build();

        loginRequest = LoginRequest.builder()
                .email("alex@example.com")
                .password("plain_pass")
                .build();
    }

    @Test
    @DisplayName("Should successfully register a new student and trigger welcome email")
    void testRegister_Success() {
        when(userRepository.existsByEmail("alex@example.com")).thenReturn(false);
        when(passwordEncoder.encode("plain_pass")).thenReturn("encoded_pass");
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);

        String message = authService.register(registerRequest);

        assertNotNull(message);
        assertTrue(message.contains("successful"));
        verify(emailService, times(1)).sendWelcomeEmail(eq("alex@example.com"), eq("Alex Smith"));
    }

    @Test
    @DisplayName("Should throw DuplicateResourceException when registering with an existing email")
    void testRegister_DuplicateEmail() {
        when(userRepository.existsByEmail("alex@example.com")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> authService.register(registerRequest));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should successfully login student with correct credentials")
    void testStudentLogin_Success() {
        when(userRepository.findByEmail("alex@example.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("plain_pass", "encoded_pass")).thenReturn(true);
        when(jwtService.generateToken("alex@example.com", AppConstants.ROLE_STUDENT)).thenReturn("mocked_jwt_token");

        LoginResponse response = authService.studentLogin(loginRequest);

        assertNotNull(response);
        assertEquals("mocked_jwt_token", response.getToken());
        assertEquals(1L, response.getUserId());
        assertEquals("Alex Smith", response.getName());
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when user is not found during student login")
    void testStudentLogin_UserNotFound() {
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());
        loginRequest.setEmail("unknown@example.com");

        assertThrows(ResourceNotFoundException.class, () -> authService.studentLogin(loginRequest));
    }

    @Test
    @DisplayName("Should throw BadRequestException when invalid password is provided")
    void testStudentLogin_InvalidPassword() {
        when(userRepository.findByEmail("alex@example.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("wrong_pass", "encoded_pass")).thenReturn(false);
        loginRequest.setPassword("wrong_pass");

        assertThrows(BadRequestException.class, () -> authService.studentLogin(loginRequest));
    }
}
