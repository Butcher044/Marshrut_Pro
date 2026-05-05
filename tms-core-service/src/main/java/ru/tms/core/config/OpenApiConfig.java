package ru.tms.core.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Configuration;

/**
 * Конфигурация OpenAPI (Swagger) для основного сервиса бизнес-логики.
 * Swagger UI доступен по адресу: /swagger-ui/index.html
 */
@OpenAPIDefinition(
    info = @Info(
        title = "TMS — Основной сервис (заказы, водители, транспорт)",
        version = "1.0",
        description = """
            API основного сервиса TMS — управление заказами, водителями и транспортным парком.

            **Возможности:**
            - Создание и управление заказами на перевозку
            - Автоматическое назначение ближайшего водителя через PostGIS
            - Управление профилями водителей и их геолокацией
            - CRUD транспортных средств
            - Сводная статистика по системе

            **Важно:** все запросы требуют заголовок `Authorization: Bearer <token>`.
            Токен передаётся через API Gateway, который добавляет X-User-* заголовки.
            """,
        contact = @Contact(name = "Маршруты Про", url = "https://marshrutpro.ru")
    ),
    security = @SecurityRequirement(name = "bearerAuth"),
    servers = {
        @Server(url = "http://localhost:8082", description = "Локальная разработка (прямое подключение)"),
        @Server(url = "http://localhost:8080", description = "Через API Gateway (требует JWT)")
    }
)
@SecurityScheme(
    name = "bearerAuth",
    type = SecuritySchemeType.HTTP,
    scheme = "bearer",
    bearerFormat = "JWT",
    description = "JWT access-токен от Auth Service. Передаётся через Gateway, который добавляет X-User-Id, X-User-Email, X-User-Role"
)
@Configuration
public class OpenApiConfig {
    // Конфигурация задаётся через аннотации выше
}
