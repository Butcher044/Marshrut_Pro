package ru.tms.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverDto {
    private Long id;
    private Long userId;
    private Long vehicleId;
    private String licenseNo;
    private String status;
    private Double currentLat;
    private Double currentLon;
}
