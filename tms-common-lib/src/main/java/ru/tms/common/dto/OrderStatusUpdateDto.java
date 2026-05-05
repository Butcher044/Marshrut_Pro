package ru.tms.common.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderStatusUpdateDto {
    @NotBlank
    @Pattern(regexp = "PENDING|ASSIGNED|IN_PROGRESS|DELIVERED|CANCELLED",
             message = "Invalid order status")
    private String status;
}
