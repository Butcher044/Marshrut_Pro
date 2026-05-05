package ru.tms.auth.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import ru.tms.common.security.JwtProperties;
import ru.tms.common.security.JwtUtil;

@Configuration
public class JwtConfig {

    @Bean
    public JwtUtil jwtUtil(JwtProperties jwtProperties) {
        return new JwtUtil(jwtProperties);
    }
}
