package com.career.config;

import com.career.entity.Role;
import com.career.entity.User;
import com.career.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    @Bean
    CommandLineRunner initializeData(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {

        return args -> {
            // Ensure default baseline Admin account exists
            String adminEmail = "admin@gmail.com";
            String adminPassword = "admin123";

            if (!userRepository.existsByEmail(adminEmail)) {
                User admin = User.builder()
                        .name("Administrator")
                        .email(adminEmail)
                        .password(passwordEncoder.encode(adminPassword))
                        .role(Role.ADMIN)
                        .build();

                userRepository.save(admin);
                log.info("Default Admin account initialized: {}", adminEmail);
            }
        };
    }
}
