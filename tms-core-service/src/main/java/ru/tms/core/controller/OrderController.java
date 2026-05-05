package ru.tms.core.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ru.tms.common.dto.OrderCreateDto;
import ru.tms.common.dto.OrderDto;
import ru.tms.common.dto.OrderStatusUpdateDto;
import ru.tms.core.service.OrderService;

/**
 * Контроллер управления заказами на перевозку.
 * Все операции требуют авторизации через JWT-токен.
 */
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Tag(name = "Заказы", description = "Создание, просмотр и управление заказами на перевозку")
@SecurityRequirement(name = "bearerAuth")
public class OrderController {

    private final OrderService orderService;

    @Operation(
        summary = "Создать новый заказ",
        description = "Создаёт заказ на перевозку. Клиент становится владельцем заказа. Статус при создании: PENDING."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Заказ создан"),
        @ApiResponse(responseCode = "400", description = "Некорректные данные"),
        @ApiResponse(responseCode = "403", description = "Роль не позволяет создавать заказы")
    })
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'CLIENT')")
    public OrderDto create(
            @Valid @RequestBody OrderCreateDto dto,
            @Parameter(hidden = true) @RequestHeader("X-User-Id") Long clientId) {
        return orderService.create(dto, clientId);
    }

    @Operation(
        summary = "Получить заказ по ID",
        description = "Возвращает полные данные заказа. Доступен любому авторизованному пользователю."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Заказ найден"),
        @ApiResponse(responseCode = "404", description = "Заказ не найден")
    })
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public OrderDto getById(
            @Parameter(description = "ID заказа") @PathVariable Long id) {
        return orderService.getById(id);
    }

    @Operation(
        summary = "Список всех заказов (ADMIN / MANAGER)",
        description = "Возвращает постраничный список заказов с опциональной фильтрацией по статусу."
    )
    @ApiResponse(responseCode = "200", description = "Список получен")
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public Page<OrderDto> getAll(
            @Parameter(description = "Фильтр по статусу: PENDING, ASSIGNED, IN_PROGRESS, DELIVERED, CANCELLED")
            @RequestParam(required = false) String status,
            Pageable pageable) {
        return orderService.getAll(status, pageable);
    }

    @Operation(
        summary = "Мои заказы (CLIENT)",
        description = "Возвращает заказы текущего клиента."
    )
    @ApiResponse(responseCode = "200", description = "Список получен")
    @GetMapping("/my")
    @PreAuthorize("hasRole('CLIENT')")
    public Page<OrderDto> getMyOrders(
            @Parameter(hidden = true) @RequestHeader("X-User-Id") Long clientId,
            Pageable pageable) {
        return orderService.getByClient(clientId, pageable);
    }

    @Operation(
        summary = "Мои рейсы (DRIVER)",
        description = "Возвращает заказы, назначенные текущему водителю."
    )
    @ApiResponse(responseCode = "200", description = "Список получен")
    @GetMapping("/my-trips")
    @PreAuthorize("hasRole('DRIVER')")
    public Page<OrderDto> getMyTrips(
            @Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId,
            Pageable pageable) {
        return orderService.getByDriverUserId(userId, pageable);
    }

    @Operation(
        summary = "Обновить статус заказа",
        description = """
            Переводит заказ в новый статус.

            Допустимые переходы:
            - PENDING → ASSIGNED (авто при назначении водителя)
            - ASSIGNED → IN_PROGRESS (водитель принял груз)
            - IN_PROGRESS → DELIVERED (груз доставлен)
            - Любой → CANCELLED (отмена менеджером/администратором)
            """
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Статус обновлён"),
        @ApiResponse(responseCode = "400", description = "Недопустимый переход статуса"),
        @ApiResponse(responseCode = "404", description = "Заказ не найден")
    })
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'DRIVER')")
    public OrderDto updateStatus(
            @Parameter(description = "ID заказа") @PathVariable Long id,
            @Valid @RequestBody OrderStatusUpdateDto dto) {
        return orderService.updateStatus(id, dto.getStatus());
    }

    @Operation(
        summary = "Автоматически назначить водителя",
        description = "Система находит ближайшего свободного водителя через PostGIS ST_DWithin и строит маршрут."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Водитель назначен, маршрут построен"),
        @ApiResponse(responseCode = "400", description = "Нет доступных водителей в радиусе 50 км"),
        @ApiResponse(responseCode = "404", description = "Заказ не найден")
    })
    @PostMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public OrderDto assignDriver(
            @Parameter(description = "ID заказа") @PathVariable Long id) {
        return orderService.assignDriver(id);
    }

    @Operation(
        summary = "Удалить заказ",
        description = "Безвозвратно удаляет заказ. Доступно только ADMIN и MANAGER."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Заказ удалён"),
        @ApiResponse(responseCode = "404", description = "Заказ не найден")
    })
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public void delete(
            @Parameter(description = "ID заказа") @PathVariable Long id) {
        orderService.delete(id);
    }
}
