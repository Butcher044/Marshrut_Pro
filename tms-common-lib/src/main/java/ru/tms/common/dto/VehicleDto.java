package ru.tms.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleDto {
    private Long id;
    private String plateNumber;
    private String model;
    private String cargoType;
    private BigDecimal maxWeight;
    private BigDecimal maxVolume;
    private String status;
}
