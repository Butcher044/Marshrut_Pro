package ru.tms.core.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.tms.core.entity.LocationsLog;

public interface LocationsLogRepository extends JpaRepository<LocationsLog, Long> {
}
