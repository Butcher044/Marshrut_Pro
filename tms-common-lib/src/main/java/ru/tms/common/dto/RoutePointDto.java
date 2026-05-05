package ru.tms.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoutePointDto {
    private Long id;
    private Long routeId;
    private Integer seqNumber;
    private String address;
    private Double lat;
    private Double lon;
    private String pointType;
}
