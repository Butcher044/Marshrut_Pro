package ru.tms.core.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.tms.core.dto.StatsSummaryDto;
import ru.tms.core.service.StatsService;

/**
 * Контроллер сводной статистики системы.
 * Доступен только ADMIN и MANAGER.
 */
@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
@Tag(name = "Статистика", description = "Сводная аналитика по заказам, водителям и транспорту")
@SecurityRequirement(name = "bearerAuth")
public class StatsController {

    private final StatsService statsService;

    @Operation(
        summary = "Сводная статистика (ADMIN / MANAGER)",
        description = "Возвращает агрегированные показатели: количество заказов по статусам, " +
                      "число активных водителей, загруженность автопарка."
    )
    @ApiResponse(responseCode = "200", description = "Статистика получена")
    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public StatsSummaryDto getSummary() {
        return statsService.getSummary();
    }
}
