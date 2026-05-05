package ru.tms.core.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ru.tms.common.dto.VehicleDto;
import ru.tms.core.service.VehicleService;

import java.util.List;

/**
 * Контроллер управления транспортными средствами (автопарком).
 * Просмотр — ADMIN и MANAGER. Изменение — только ADMIN.
 */
@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
@Tag(name = "Транспорт", description = "Управление транспортными средствами (автопарком компании)")
@SecurityRequirement(name = "bearerAuth")
public class VehicleController {

    private final VehicleService vehicleService;

    @Operation(
        summary = "Список всех транспортных средств",
        description = "Возвращает все ТС с их характеристиками и текущим статусом."
    )
    @ApiResponse(responseCode = "200", description = "Список получен")
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public List<VehicleDto> getAll() {
        return vehicleService.getAll();
    }

    @Operation(
        summary = "Получить транспортное средство по ID"
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "ТС найдено"),
        @ApiResponse(responseCode = "404", description = "ТС не найдено")
    })
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public VehicleDto getById(
            @Parameter(description = "ID транспортного средства") @PathVariable Long id) {
        return vehicleService.getById(id);
    }

    @Operation(
        summary = "Добавить транспортное средство (ADMIN)",
        description = "Создаёт новое ТС в системе. Начальный статус: AVAILABLE."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "ТС создано"),
        @ApiResponse(responseCode = "400", description = "Некорректные данные"),
        @ApiResponse(responseCode = "403", description = "Требуется роль ADMIN"),
        @ApiResponse(responseCode = "409", description = "Государственный номер уже существует")
    })
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public VehicleDto create(@Valid @RequestBody VehicleDto dto) {
        return vehicleService.create(dto);
    }

    @Operation(
        summary = "Обновить данные транспортного средства (ADMIN)",
        description = "Полностью заменяет данные ТС (PUT-семантика)."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "ТС обновлено"),
        @ApiResponse(responseCode = "403", description = "Требуется роль ADMIN"),
        @ApiResponse(responseCode = "404", description = "ТС не найдено")
    })
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public VehicleDto update(
            @Parameter(description = "ID транспортного средства") @PathVariable Long id,
            @Valid @RequestBody VehicleDto dto) {
        return vehicleService.update(id, dto);
    }

    @Operation(
        summary = "Удалить транспортное средство (ADMIN)",
        description = "Безвозвратно удаляет ТС из системы."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "ТС удалено"),
        @ApiResponse(responseCode = "403", description = "Требуется роль ADMIN"),
        @ApiResponse(responseCode = "404", description = "ТС не найдено")
    })
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(
            @Parameter(description = "ID транспортного средства") @PathVariable Long id) {
        vehicleService.delete(id);
    }
}
