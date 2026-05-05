package ru.tms.core.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "vehicles")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "plate_number", nullable = false, unique = true)
    private String plateNumber;

    @Column(nullable = false)
    private String model;

    @Column(name = "cargo_type")
    private String cargoType;

    @Column(name = "max_weight", precision = 10, scale = 2)
    private BigDecimal maxWeight;

    @Column(name = "max_volume", precision = 10, scale = 2)
    private BigDecimal maxVolume;

    @Column(nullable = false)
    private String status;

    @PrePersist
    protected void onCreate() {
        if (status == null) status = "AVAILABLE";
    }
}
