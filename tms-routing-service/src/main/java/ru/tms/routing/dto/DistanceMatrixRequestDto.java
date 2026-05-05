package ru.tms.routing.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DistanceMatrixRequestDto {

    @NotEmpty(message = "Address list must not be empty")
    @Size(min = 2, max = 20, message = "Provide between 2 and 20 addresses")
    private List<String> addresses;
}
