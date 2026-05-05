package ru.tms.common.security;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {
    private String secret;
    private long accessExpiration = 900000;    // 15 minutes in ms
    private long refreshExpiration = 604800000; // 7 days in ms
}
