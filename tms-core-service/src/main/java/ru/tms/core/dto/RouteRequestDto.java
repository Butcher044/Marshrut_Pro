package ru.tms.core.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RouteRequestDto {
    private Long orderId;
    private Double originLat;
    private Double originLon;
    private Double destLat;
    private Double destLon;
    private BigDecimal cargoWeight;
}
