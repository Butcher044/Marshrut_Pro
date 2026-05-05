package ru.tms.auth.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Configuration;

/**
 * Конфигурация OpenAPI (Swagger) для сервиса аутентификации.
 * Swagger UI доступен по адресу: /swagger-ui/index.html
 */
@OpenAPIDefinition(
    info = @Info(
        title = "TMS — Сервис аутентификации",
        version = "1.0",
        description = """
            API сервиса аутентификации и управления пользователями.

            **Возможности:**
            - Регистрация и вход по email/паролю
            - Авторизация через Яндекс OAuth2
            - Выдача и обновление JWT-токенов
            - Управление пользователями (только для ADMIN)

            **Получение токена:** POST /api/auth/login → скопировать accessToken → нажать "Authorize"
            """,
        contact = @Contact(name = "Маршруты Про", url = "https://marshrutpro.ru")
    ),
    security = @SecurityRequirement(name = "bearerAuth"),
    servers = {
        @Server(url = "http://localhost:8081", description = "Локальная разработка"),
        @Server(url = "https://marshrutpro.ru", description = "Продакшн (через Gateway)")
    }
)
@SecurityScheme(
    name = "bearerAuth",
    type = SecuritySchemeType.HTTP,
    scheme = "bearer",
    bearerFormat = "JWT",
    description = "JWT access-токен, получаемый через POST /api/auth/login"
)
@Configuration
public class OpenApiConfig {
    // Конфигурация задаётся через аннотации выше
}
