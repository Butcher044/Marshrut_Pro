package ru.tms.core.entity;

import jakarta.persistence.*;
import lombok.*;
import org.locationtech.jts.geom.Point;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "client_id", nullable = false)
    private Long clientId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id")
    private Driver driver;

    @Column(name = "origin_address", nullable = false, columnDefinition = "TEXT")
    private String originAddress;

    @Column(name = "dest_address", nullable = false, columnDefinition = "TEXT")
    private String destAddress;

    @Column(name = "origin_location", columnDefinition = "geometry(Point, 4326)")
    private Point originLocation;

    @Column(name = "dest_location", columnDefinition = "geometry(Point, 4326)")
    private Point destLocation;

    @Column(name = "cargo_weight", precision = 10, scale = 2)
    private BigDecimal cargoWeight;

    @Column(name = "cargo_volume", precision = 10, scale = 2)
    private BigDecimal cargoVolume;

    @Column(nullable = false)
    private String status;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (status == null) status = "PENDING";
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
