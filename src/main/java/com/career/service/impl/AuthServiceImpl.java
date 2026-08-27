package com.career.service.impl;

import com.career.dto.LoginRequest;
import com.career.dto.LoginResponse;
import com.career.dto.RegisterRequest;
import com.career.entity.Role;
import com.career.entity.User;
import com.career.exception.BadRequestException;
import com.career.exception.DuplicateResourceException;
import com.career.exception.ResourceNotFoundException;
import com.career.exception.UnauthorizedException;
import com.career.repository.UserRepository;
import com.career.security.JwtService;
import com.career.service.AuthService;
import com.career.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class AuthServiceImpl implements AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;

    public AuthServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder,
                           JwtService jwtService, EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.emailService = emailService;
    }

    @Override
    @Transactional
    public String register(RegisterRequest request) {
        log.info("Processing registration for email: {}", request.getEmail());
        String email = Optional.ofNullable(request.getEmail())
                .map(String::trim)
                .map(String::toLowerCase)
                .orElseThrow(() -> new BadRequestException("Email is required"));

        if (userRepository.existsByEmail(email)) {
            log.warn("Registration rejected: Email {} is already registered", email);
            throw new DuplicateResourceException("Email already registered: " + email);
        }

        User user = User.builder()
                .name(request.getName().trim())
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.STUDENT)
                .build();

        userRepository.save(user);
        log.info("Student successfully registered with ID: {}", user.getId());

        try {
            emailService.sendWelcomeEmail(user.getEmail(), user.getName());
        } catch (Exception e) {
            log.warn("Could not dispatch welcome email to {}: {}", user.getEmail(), e.getMessage());
        }

        return "Student registered successfully";
    }

    @Override
    public LoginResponse studentLogin(LoginRequest request) {
        String email = Optional.ofNullable(request.getEmail())
                .map(String::trim)
                .map(String::toLowerCase)
                .orElseThrow(() -> new BadRequestException("Email is required"));

        log.debug("Authenticating student: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Student email not found: " + email));

        if (user.getRole() != Role.STUDENT) {
            log.warn("Account {} is not a student account", email);
            throw new UnauthorizedException("This account is not a student account");
        }

        validatePassword(request.getPassword(), user.getPassword());
        log.info("Student {} logged in successfully", email);

        return createLoginResponse(user);
    }

    @Override
    public LoginResponse adminLogin(LoginRequest request) {
        String email = Optional.ofNullable(request.getEmail())
                .map(String::trim)
                .map(String::toLowerCase)
                .orElseThrow(() -> new BadRequestException("Email is required"));

        log.debug("Authenticating admin: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Admin email not found: " + email));

        if (user.getRole() != Role.ADMIN) {
            log.warn("Account {} is not an admin account", email);
            throw new UnauthorizedException("This account is not an admin account");
        }

        validatePassword(request.getPassword(), user.getPassword());
        log.info("Admin {} logged in successfully", email);

        return createLoginResponse(user);
    }

    private void validatePassword(String rawPassword, String encodedPassword) {
        if (rawPassword == null || rawPassword.isBlank()) {
            throw new BadRequestException("Password is required");
        }

        if (encodedPassword == null || encodedPassword.isBlank()) {
            throw new BadRequestException("User password is not configured");
        }

        if (!passwordEncoder.matches(rawPassword, encodedPassword)) {
            throw new BadRequestException("Invalid email or password");
        }
    }

    private LoginResponse createLoginResponse(User user) {
        String token = jwtService.generateToken(user.getEmail(), user.getRole().name());

        return LoginResponse.builder()
                .token(token)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }
}