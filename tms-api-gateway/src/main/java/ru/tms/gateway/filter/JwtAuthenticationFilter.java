package ru.tms.gateway.filter;

import lombok.RequiredArgsConstructor;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import ru.tms.common.security.JwtUtil;

import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter implements GlobalFilter, Ordered {

    private static final List<String> PUBLIC_PATHS = List.of(
            "/api/auth/login",
            "/api/auth/register",
            "/api/auth/refresh",
            "/login/oauth2",
            "/oauth2/authorization",
            "/actuator"
    );

    private final JwtUtil jwtUtil;
    private final ReactiveStringRedisTemplate redisTemplate;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();

        // Always strip incoming X-User-* headers — clients must never inject these
        ServerWebExchange sanitized = exchange.mutate()
                .request(r -> r.headers(h -> {
                    h.remove("X-User-Id");
                    h.remove("X-User-Email");
                    h.remove("X-User-Role");
                }))
                .build();

        if (isPublicPath(path)) {
            return chain.filter(sanitized);
        }

        String authHeader = sanitized.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            sanitized.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return sanitized.getResponse().setComplete();
        }

        String token = authHeader.substring(7);

        if (!jwtUtil.validateAccessToken(token)) {
            sanitized.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return sanitized.getResponse().setComplete();
        }

        String jti = jwtUtil.extractJti(token);

        return redisTemplate.hasKey("blacklist:" + jti)
                .flatMap(isBlacklisted -> {
                    if (Boolean.TRUE.equals(isBlacklisted)) {
                        sanitized.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                        return sanitized.getResponse().setComplete();
                    }

                    String userId = String.valueOf(jwtUtil.extractUserId(token));
                    String email  = jwtUtil.extractEmail(token);
                    String role   = jwtUtil.extractRole(token);

                    ServerWebExchange authed = sanitized.mutate()
                            .request(r -> r
                                    .header("X-User-Id",    userId)
                                    .header("X-User-Email", email)
                                    .header("X-User-Role",  role))
                            .build();

                    return chain.filter(authed);
                });
    }

    private boolean isPublicPath(String path) {
        return PUBLIC_PATHS.stream().anyMatch(path::startsWith);
    }

    @Override
    public int getOrder() {
        return -1;
    }
}
