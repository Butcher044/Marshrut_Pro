package ru.tms.core.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ru.tms.common.dto.DriverDto;
import ru.tms.common.dto.LocationDto;
import ru.tms.common.exception.UnauthorizedException;
import ru.tms.core.service.DriverService;

import java.util.List;

/**
 * Контроллер управления водителями.
 * Водитель может обновлять только свой собственный статус и геолокацию.
 */
@RestController
@RequestMapping("/api/drivers")
@RequiredArgsConstructor
@Tag(name = "Водители", description = "Управление профилями водителей, статусами и GPS-геолокацией")
@SecurityRequirement(name = "bearerAuth")
public class DriverController {

    private final DriverService driverService;

    @Operation(
        summary = "Список всех водителей (ADMIN / MANAGER)",
        description = "Возвращает полный список водителей с их статусами и привязанным транспортом."
    )
    @ApiResponse(responseCode = "200", description = "Список получен")
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public List<DriverDto> getAll() {
        return driverService.getAll();
    }

    @Operation(
        summary = "Получить профиль текущего водителя",
        description = "Возвращает профиль водителя для текущего авторизованного пользователя."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Профиль найден"),
        @ApiResponse(responseCode = "404", description = "Профиль водителя не создан для данного пользователя")
    })
    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('DRIVER', 'ADMIN', 'MANAGER')")
    public DriverDto getMe(
            @Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId) {
        return driverService.getByUserId(userId);
    }

    @Operation(
        summary = "Создать профиль водителя (ADMIN)",
        description = "Привязывает аккаунт пользователя (с ролью DRIVER) к профилю водителя в системе."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Профиль создан"),
        @ApiResponse(responseCode = "400", description = "Некорректные данные"),
        @ApiResponse(responseCode = "403", description = "Требуется роль ADMIN"),
        @ApiResponse(responseCode = "409", description = "Профиль для данного пользователя уже существует")
    })
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public DriverDto create(@Valid @RequestBody CreateDriverRequest req) {
        return driverService.createDriver(req.getUserId(), req.getLicenseNo());
    }

    @Operation(
        summary = "Получить водителя по ID (ADMIN / MANAGER)",
        description = "Возвращает профиль водителя по внутреннему ID."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Водитель найден"),
        @ApiResponse(responseCode = "404", description = "Водитель не найден")
    })
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public DriverDto getById(
            @Parameter(description = "ID профиля водителя") @PathVariable Long id) {
        return driverService.getById(id);
    }

    @Operation(
        summary = "Обновить статус водителя",
        description = """
            Допустимые статусы: AVAILABLE (свободен), ON_TRIP (на рейсе), OFF_DUTY (не в смене).
            Водитель может изменить только собственный статус.
            """
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Статус обновлён"),
        @ApiResponse(responseCode = "403", description = "Водитель пытается изменить чужой статус"),
        @ApiResponse(responseCode = "404", description = "Водитель не найден")
    })
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'DRIVER')")
    public DriverDto updateStatus(
            @Parameter(description = "ID профиля водителя") @PathVariable Long id,
            @Parameter(description = "Новый статус: AVAILABLE, ON_TRIP, OFF_DUTY")
            @RequestParam @Pattern(regexp = "AVAILABLE|ON_TRIP|OFF_DUTY",
                    message = "Статус должен быть AVAILABLE, ON_TRIP или OFF_DUTY") String status,
            @Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId,
            @Parameter(hidden = true) @RequestHeader("X-User-Role") String role) {
        // Водитель может изменять только собственный статус
        if (role.contains("DRIVER") && !role.contains("ADMIN") && !role.contains("MANAGER")) {
            DriverDto driver = driverService.getByUserId(userId);
            if (!driver.getId().equals(id)) {
                throw new UnauthorizedException("Водитель может изменять только свой собственный статус");
            }
        }
        return driverService.updateStatus(id, status);
    }

    @Operation(
        summary = "Записать GPS-геолокацию водителя",
        description = "Водитель отправляет текущие координаты. Точка сохраняется в партиционированную таблицу locations_log."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Геолокация записана"),
        @ApiResponse(responseCode = "403", description = "Водитель пытается записать чужую геолокацию")
    })
    @PostMapping("/{id}/location")
    @PreAuthorize("hasRole('DRIVER')")
    public void logLocation(
            @Parameter(description = "ID профиля водителя") @PathVariable Long id,
            @RequestBody LocationDto locationDto,
            @Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId) {
        // Водитель может записывать только свою геолокацию
        DriverDto driver = driverService.getByUserId(userId);
        if (!driver.getId().equals(id)) {
            throw new UnauthorizedException("Водитель может записывать только свою геолокацию");
        }
        driverService.logLocation(id, locationDto);
    }

    /**
     * DTO для создания профиля водителя.
     * Используется только внутри этого контроллера.
     */
    @Data
    static class CreateDriverRequest {
        @NotNull(message = "ID пользователя обязателен")
        private Long userId;

        @NotBlank(message = "Номер водительского удостоверения обязателен")
        private String licenseNo;
    }
}
