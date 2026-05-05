package ru.tms.routing.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "routes")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Route {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false, unique = true)
    private Long orderId;

    @Column(name = "total_km", precision = 10, scale = 2)
    private BigDecimal totalKm;

    @Column(name = "duration_min")
    private Integer durationMin;

    @Column(nullable = false)
    private String status;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Builder.Default
    @OneToMany(mappedBy = "route", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("seqNumber ASC")
    private List<RoutePoint> routePoints = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        if (status == null) status = "PLANNED";
        createdAt = LocalDateTime.now();
    }
}
