package ru.tms.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RouteDto {
    private Long id;
    private Long orderId;
    private BigDecimal totalKm;
    private Integer durationMin;
    private String status;
    private LocalDateTime createdAt;
    private List<RoutePointDto> routePoints;
}
