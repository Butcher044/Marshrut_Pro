package ru.tms.common.security;

import io.jsonwebtoken.ExpiredJwtException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

class JwtUtilTest {

    private JwtUtil jwtUtil;
    private JwtProperties props;

    @BeforeEach
    void setUp() {
        props = new JwtProperties();
        props.setSecret("test-secret-key-at-least-32-chars-long!");
        props.setAccessExpiration(900_000L);   // 15 min
        props.setRefreshExpiration(604_800_000L);
        jwtUtil = new JwtUtil(props);
    }

    @Test
    void generateAndValidateAccessToken() {
        String token = jwtUtil.generateAccessToken(1L, "user@test.com", "CLIENT");

        assertThat(jwtUtil.validateAccessToken(token)).isTrue();
    }

    @Test
    void extractClaimsFromAccessToken() {
        String token = jwtUtil.generateAccessToken(42L, "admin@test.com", "ADMIN");

        assertThat(jwtUtil.extractUserId(token)).isEqualTo(42L);
        assertThat(jwtUtil.extractEmail(token)).isEqualTo("admin@test.com");
        assertThat(jwtUtil.extractRole(token)).isEqualTo("ADMIN");
        assertThat(jwtUtil.extractJti(token)).isNotBlank();
    }

    @Test
    void expiredTokenIsInvalid() {
        JwtProperties shortLived = new JwtProperties();
        shortLived.setSecret("test-secret-key-at-least-32-chars-long!");
        shortLived.setAccessExpiration(-1L); // already expired
        shortLived.setRefreshExpiration(604_800_000L);
        JwtUtil shortUtil = new JwtUtil(shortLived);

        String token = shortUtil.generateAccessToken(1L, "user@test.com", "CLIENT");

        assertThat(shortUtil.validateAccessToken(token)).isFalse();
    }

    @Test
    void invalidTokenIsInvalid() {
        assertThat(jwtUtil.validateAccessToken("not.a.jwt")).isFalse();
        assertThat(jwtUtil.validateAccessToken("")).isFalse();
    }

    @Test
    void generateRefreshTokenIsUuid() {
        String r1 = jwtUtil.generateRefreshToken();
        String r2 = jwtUtil.generateRefreshToken();

        assertThat(r1).isNotBlank();
        assertThat(r2).isNotBlank();
        assertThat(r1).isNotEqualTo(r2);
    }

    @Test
    void tokenRemainingMillisIsPositiveForFreshToken() {
        String token = jwtUtil.generateAccessToken(1L, "user@test.com", "CLIENT");
        long remaining = jwtUtil.getTokenRemainingMillis(token);

        assertThat(remaining).isGreaterThan(0).isLessThanOrEqualTo(900_000L);
    }
}
