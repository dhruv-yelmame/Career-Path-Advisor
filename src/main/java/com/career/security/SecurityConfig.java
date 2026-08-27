package com.career.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // =================================
                        // PUBLIC STATIC ASSETS & PAGES
                        // =================================
                        .requestMatchers(
                                "/",
                                "/index.html",
                                "/student-login.html",
                                "/student-register.html",
                                "/admin-login.html",
                                "/admin-dashboard.html",
                                "/add-question.html",
                                "/view-question.html",
                                "/create-test.html",
                                "/view-tests.html",
                                "/test-details.html",
                                "/career-paths.html",
                                "/students.html",
                                "/student-details.html",
                                "/results.html",
                                "/admin-profile.html",
                                "/student-dashboard.html",
                                "/available-tests.html",
                                "/take-test.html",
                                "/student-test.html",
                                "/assessment-result.html",
                                "/result.html",
                                "/student-results.html",
                                "/career-paths-student.html",
                                "/student-profile.html",
                                "/css/**",
                                "/js/**",
                                "/images/**",
                                "/favicon.ico"
                        ).permitAll()

                        // =================================
                        // SWAGGER OPENAPI
                        // =================================
                        .requestMatchers(
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/swagger-resources/**",
                                "/webjars/**"
                        ).permitAll()

                        // =================================
                        // AUTH API
                        // =================================
                        .requestMatchers("/api/auth/**").permitAll()

                        // =================================
                        // ADMIN API
                        // =================================
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // =================================
                        // SHARED RESULTS API (ADMIN & STUDENT)
                        // =================================
                        .requestMatchers("/api/student/results/**").hasAnyRole("ADMIN", "STUDENT")

                        // =================================
                        // STUDENT API
                        // =================================
                        .requestMatchers("/api/student/**").hasAnyRole("STUDENT", "ADMIN")

                        // =================================
                        // ALL OTHER REQUESTS
                        // =================================
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}