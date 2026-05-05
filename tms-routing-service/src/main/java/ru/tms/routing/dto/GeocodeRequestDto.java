package ru.tms.routing.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class GeocodeRequestDto {
    @NotBlank
    @Size(max = 500, message = "Address must not exceed 500 characters")
    private String address;
}
