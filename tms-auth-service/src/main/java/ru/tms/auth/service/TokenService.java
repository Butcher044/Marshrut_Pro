package ru.tms.auth.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import ru.tms.auth.entity.User;
import ru.tms.common.security.JwtProperties;
import ru.tms.common.security.JwtUtil;

import java.time.Duration;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TokenService {

    private final JwtUtil jwtUtil;
    private final JwtProperties jwtProperties;
    private final StringRedisTemplate redisTemplate;

    public String issueAccessToken(User user) {
        return jwtUtil.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name());
    }

    public String issueRefreshToken(User user) {
        String refreshToken = UUID.randomUUID().toString();
        String key = "refresh:" + user.getId() + ":" + refreshToken;
        redisTemplate.opsForValue().set(
                key,
                String.valueOf(user.getId()),
                Duration.ofMillis(jwtProperties.getRefreshExpiration())
        );
        return refreshToken;
    }

    /** Revoke all existing refresh tokens for a user (call on login to limit session count). */
    public void revokeAllRefreshTokens(Long userId) {
        Set<String> keys = redisTemplate.keys("refresh:" + userId + ":*");
        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
        }
    }

    public Long validateRefreshToken(String refreshToken, Long userId) {
        String pattern = "refresh:" + userId + ":" + refreshToken;
        String value = redisTemplate.opsForValue().get(pattern);
        if (value == null) return null;
        return Long.parseLong(value);
    }

    public void revokeRefreshToken(String refreshToken, Long userId) {
        String key = "refresh:" + userId + ":" + refreshToken;
        redisTemplate.delete(key);
    }

    public void blacklistAccessToken(String token) {
        String jti = jwtUtil.extractJti(token);
        long ttl = jwtUtil.getTokenRemainingMillis(token);
        if (ttl > 0) {
            redisTemplate.opsForValue().set(
                    "blacklist:" + jti,
                    "1",
                    Duration.ofMillis(ttl)
            );
        }
    }

    public String findUserIdByRefreshToken(Long userId, String refreshToken) {
        String key = "refresh:" + userId + ":" + refreshToken;
        return redisTemplate.opsForValue().get(key);
    }
}
