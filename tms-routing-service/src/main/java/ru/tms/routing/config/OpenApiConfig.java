package ru.tms.routing.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Configuration;

/**
 * Конфигурация OpenAPI (Swagger) для сервиса маршрутизации и геокодирования.
 * Swagger UI доступен по адресу: /swagger-ui/index.html
 */
@OpenAPIDefinition(
    info = @Info(
        title = "TMS — Сервис маршрутизации и геокодирования",
        version = "1.0",
        description = """
            API сервиса построения маршрутов и геокодирования.

            **Возможности:**
            - Построение оптимальных маршрутов через Яндекс Routing API v2
            - Геокодирование адресов (текст → координаты) через Яндекс Geocoder
            - Матрица расстояний между несколькими точками
            - Кеширование результатов в Redis (геокоды — 24ч, маршруты — 1ч)

            **Интеграции:** Яндекс Routing API v2, Яндекс Geocoder API
            """,
        contact = @Contact(name = "Маршруты Про", url = "https://marshrutpro.ru")
    ),
    security = @SecurityRequirement(name = "bearerAuth"),
    servers = {
        @Server(url = "http://localhost:8083", description = "Локальная разработка (прямое подключение)"),
        @Server(url = "http://localhost:8080", description = "Через API Gateway (требует JWT)")
    }
)
@SecurityScheme(
    name = "bearerAuth",
    type = SecuritySchemeType.HTTP,
    scheme = "bearer",
    bearerFormat = "JWT",
    description = "JWT access-токен от Auth Service"
)
@Configuration
public class OpenApiConfig {
    // Конфигурация задаётся через аннотации выше
}
