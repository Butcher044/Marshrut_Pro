package ru.tms.routing.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.tms.routing.entity.Route;

import java.util.Optional;

public interface RouteRepository extends JpaRepository<Route, Long> {
    Optional<Route> findByOrderId(Long orderId);
}
