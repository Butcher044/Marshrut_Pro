package ru.tms.routing.controller;

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
import ru.tms.common.dto.RouteDto;
import ru.tms.routing.dto.DistanceMatrixRequestDto;
import ru.tms.routing.dto.DistanceMatrixResponseDto;
import ru.tms.routing.dto.GeocodeRequestDto;
import ru.tms.routing.dto.RouteRequestDto;
import ru.tms.routing.service.RouteService;

import java.util.Map;

/**
 * Контроллер маршрутизации и геокодирования.
 * Использует Yandex Routing API v2 и Yandex Geocoder API.
 * Результаты кэшируются в Redis.
 */
@RestController
@RequestMapping("/api/routes")
@RequiredArgsConstructor
@Tag(name = "Маршруты и геокодирование", description = "Построение маршрутов через Yandex Routing API и геокодирование адресов")
@SecurityRequirement(name = "bearerAuth")
public class RouteController {

    private final RouteService routeService;

    @Operation(
        summary = "Построить маршрут для заказа (ADMIN / MANAGER)",
        description = "Вызывает Yandex Routing API v2 (режим truck) и сохраняет маршрут в БД. " +
                      "Учитывает вес и габариты груза. Результат кэшируется в Redis на 1 час."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Маршрут построен и сохранён"),
        @ApiResponse(responseCode = "400", description = "Нет доступного маршрута между точками"),
        @ApiResponse(responseCode = "404", description = "Заказ не найден")
    })
    @PostMapping("/build")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public RouteDto buildRoute(@RequestBody RouteRequestDto request) {
        return routeService.buildRoute(request);
    }

    @Operation(
        summary = "Получить маршрут по ID заказа",
        description = "Возвращает ранее построенный маршрут с точками и polyline."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Маршрут найден"),
        @ApiResponse(responseCode = "404", description = "Маршрут для данного заказа не существует")
    })
    @GetMapping("/{orderId}")
    @PreAuthorize("isAuthenticated()")
    public RouteDto getByOrderId(
            @Parameter(description = "ID заказа") @PathVariable Long orderId) {
        return routeService.getByOrderId(orderId);
    }

    @Operation(
        summary = "Геокодировать адрес",
        description = "Конвертирует текстовый адрес в координаты (lat/lon) через Yandex Geocoder API. " +
                      "Результат кэшируется в Redis на 24 часа."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Координаты получены"),
        @ApiResponse(responseCode = "400", description = "Адрес не найден или некорректен")
    })
    @PostMapping("/geocode")
    @PreAuthorize("isAuthenticated()")
    public Map<String, Double> geocode(@Valid @RequestBody GeocodeRequestDto request) {
        double[] coords = routeService.geocodeAddress(request.getAddress());
        return Map.of("lat", coords[0], "lon", coords[1]);
    }

    @Operation(
        summary = "Матрица расстояний (ADMIN / MANAGER)",
        description = "Вычисляет попарные расстояния и время в пути между несколькими точками " +
                      "через Yandex Routing API. Используется для оптимизации распределения заказов."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Матрица рассчитана"),
        @ApiResponse(responseCode = "400", description = "Некорректные точки запроса")
    })
    @PostMapping("/matrix")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public DistanceMatrixResponseDto distanceMatrix(@Valid @RequestBody DistanceMatrixRequestDto request) {
        return routeService.buildDistanceMatrix(request);
    }
}
