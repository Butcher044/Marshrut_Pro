package ru.tms.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderDto {
    private Long id;
    private Long clientId;
    private Long driverId;
    private String originAddress;
    private String destAddress;
    private Double originLat;
    private Double originLon;
    private Double destLat;
    private Double destLon;
    private BigDecimal cargoWeight;
    private BigDecimal cargoVolume;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
