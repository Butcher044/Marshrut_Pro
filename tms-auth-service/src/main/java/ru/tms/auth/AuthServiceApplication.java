package ru.tms.auth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import ru.tms.common.security.JwtProperties;

@SpringBootApplication(scanBasePackages = {"ru.tms.auth", "ru.tms.common"})
@EnableConfigurationProperties(JwtProperties.class)
public class AuthServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(AuthServiceApplication.class, args);
    }
}
