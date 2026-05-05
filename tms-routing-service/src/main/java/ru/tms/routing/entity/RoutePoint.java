package ru.tms.routing.entity;

import jakarta.persistence.*;
import lombok.*;
import org.locationtech.jts.geom.Point;

@Entity
@Table(name = "route_points")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoutePoint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "route_id", nullable = false)
    private Route route;

    @Column(name = "seq_number", nullable = false)
    private Integer seqNumber;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String address;

    @Column(columnDefinition = "geometry(Point, 4326)")
    private Point location;

    @Column(name = "point_type", nullable = false)
    private String pointType;
}
