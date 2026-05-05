package ru.tms.core.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import ru.tms.core.entity.Order;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    Page<Order> findByStatus(String status, Pageable pageable);
    Page<Order> findByClientId(Long clientId, Pageable pageable);
    List<Order> findByDriverId(Long driverId);
    Page<Order> findByDriverId(Long driverId, Pageable pageable);
    long countByStatus(String status);
}
