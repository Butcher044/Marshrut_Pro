package ru.tms.routing.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DistanceMatrixResponseDto {
    private List<String> addresses;
    private List<Map<String, Double>> coordinates;  // [{lat, lon}, ...]
    private double[][] distanceMatrixKm;             // matrix[i][j] = road km from i to j
}
