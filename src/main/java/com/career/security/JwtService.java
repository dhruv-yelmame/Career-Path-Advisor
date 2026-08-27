package com.career.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Optional;

@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);

    @Value("${app.jwt.secret:CareerPathAdviserSecretKeyForJwtAuthentication2026SuperSecureKeyWithSufficientLength}")
    private String secretKeyString;

    @Value("${app.jwt.expiration-ms:86400000}")
    private long expirationTime;

    private SecretKey key;

    @PostConstruct
    public void init() {
        this.key = Keys.hmacShaKeyFor(secretKeyString.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(String email, String role) {
        log.debug("Generating JWT token for email: {} with role: {}", email, role);
        return Jwts.builder()
                .subject(email)
                .claim("role", role.toUpperCase())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationTime))
                .signWith(key)
                .compact();
    }

    public String extractEmail(String token) {
        return extractClaims(token)
                .map(Claims::getSubject)
                .orElse(null);
    }

    public String extractRole(String token) {
        return extractClaims(token)
                .map(claims -> claims.get("role", String.class))
                .orElse(null);
    }

    public boolean isTokenValid(String token) {
        try {
            Optional<Claims> claimsOpt = extractClaims(token);
            if (claimsOpt.isEmpty()) {
                return false;
            }
            Date expiration = claimsOpt.get().getExpiration();
            return expiration != null && expiration.after(new Date());
        } catch (Exception e) {
            log.warn("Invalid JWT token provided: {}", e.getMessage());
            return false;
        }
    }

    private Optional<Claims> extractClaims(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return Optional.ofNullable(claims);
        } catch (Exception e) {
            log.debug("Failed to extract claims from JWT token: {}", e.getMessage());
            return Optional.empty();
        }
    }
}