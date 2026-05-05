package ru.tms.core.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "drivers")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Driver {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    @Column(name = "license_no", nullable = false, unique = true)
    private String licenseNo;

    @Column(nullable = false)
    private String status;

    @PrePersist
    protected void onCreate() {
        if (status == null) status = "AVAILABLE";
    }
}
