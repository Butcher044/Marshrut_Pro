package ru.tms.core.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ru.tms.core.entity.Driver;

import java.util.List;
import java.util.Optional;

public interface DriverRepository extends JpaRepository<Driver, Long> {
    Optional<Driver> findByUserId(Long userId);
    List<Driver> findByStatus(String status);
    long countByStatus(String status);

    @Query(value = """
            SELECT d.* FROM drivers d
            INNER JOIN locations_log ll ON ll.driver_id = d.id
            WHERE d.status = 'AVAILABLE'
            AND ST_DWithin(
                ll.location::geography,
                ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography,
                :radiusMeters
            )
            AND ll.recorded_at = (
                SELECT MAX(ll2.recorded_at) FROM locations_log ll2 WHERE ll2.driver_id = d.id
            )
            ORDER BY ST_Distance(
                ll.location::geography,
                ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography
            )
            LIMIT 1
            """, nativeQuery = true)
    Optional<Driver> findNearestAvailableDriver(@Param("lat") double lat,
                                                @Param("lon") double lon,
                                                @Param("radiusMeters") double radiusMeters);
}
