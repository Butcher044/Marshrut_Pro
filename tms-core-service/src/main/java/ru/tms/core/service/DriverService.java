package ru.tms.core.service;

import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.tms.common.dto.DriverDto;
import ru.tms.common.dto.LocationDto;
import ru.tms.common.exception.ResourceNotFoundException;
import ru.tms.core.entity.Driver;
import ru.tms.core.entity.LocationsLog;
import ru.tms.core.repository.DriverRepository;
import ru.tms.core.repository.LocationsLogRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DriverService {

    private final DriverRepository driverRepository;
    private final LocationsLogRepository locationsLogRepository;
    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    public List<DriverDto> getAll() {
        return driverRepository.findAll().stream().map(this::toDto).toList();
    }

    public DriverDto getById(Long id) {
        return toDto(driverRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", id)));
    }

    public DriverDto getByUserId(Long userId) {
        return toDto(driverRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver for user", userId)));
    }

    @Transactional
    @CacheEvict(value = "drivers", allEntries = true)
    public DriverDto updateStatus(Long id, String status) {
        Driver driver = driverRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", id));
        driver.setStatus(status);
        return toDto(driverRepository.save(driver));
    }

    @Transactional
    public void logLocation(Long driverId, LocationDto locationDto) {
        driverRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", driverId));

        Point point = geometryFactory.createPoint(
                new Coordinate(locationDto.getLon(), locationDto.getLat())
        );

        LocationsLog log = LocationsLog.builder()
                .driverId(driverId)
                .location(point)
                .build();

        locationsLogRepository.save(log);
    }

    @Transactional
    @CacheEvict(value = "drivers", allEntries = true)
    public DriverDto createDriver(Long userId, String licenseNo) {
        Driver driver = Driver.builder()
                .userId(userId)
                .licenseNo(licenseNo)
                .status("AVAILABLE")
                .build();
        return toDto(driverRepository.save(driver));
    }

    public Driver findNearestAvailable(double lat, double lon, double radiusKm) {
        double radiusMeters = radiusKm * 1000;
        return driverRepository.findNearestAvailableDriver(lat, lon, radiusMeters)
                .orElse(null);
    }

    public Driver findAnyAvailable() {
        return driverRepository.findByStatus("AVAILABLE").stream().findFirst().orElse(null);
    }

    private DriverDto toDto(Driver d) {
        return DriverDto.builder()
                .id(d.getId())
                .userId(d.getUserId())
                .vehicleId(d.getVehicle() != null ? d.getVehicle().getId() : null)
                .licenseNo(d.getLicenseNo())
                .status(d.getStatus())
                .build();
    }
}
