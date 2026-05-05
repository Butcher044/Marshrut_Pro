package ru.tms.common.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderCreateDto {
    @NotBlank
    private String originAddress;
    @NotBlank
    private String destAddress;
    private BigDecimal cargoWeight;
    private BigDecimal cargoVolume;
}
