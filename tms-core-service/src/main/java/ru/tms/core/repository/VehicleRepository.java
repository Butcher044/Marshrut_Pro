package ru.tms.core.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.tms.core.entity.Vehicle;

import java.util.List;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    List<Vehicle> findByStatus(String status);
    long countByStatus(String status);
    boolean existsByPlateNumber(String plateNumber);
}
