package ru.tms.core.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import ru.tms.common.dto.DriverDto;
import ru.tms.common.exception.ResourceNotFoundException;
import ru.tms.core.entity.Driver;
import ru.tms.core.repository.DriverRepository;
import ru.tms.core.repository.LocationsLogRepository;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DriverServiceTest {

    @Mock
    private DriverRepository driverRepository;
    @Mock
    private LocationsLogRepository locationsLogRepository;

    @InjectMocks
    private DriverService driverService;

    private Driver buildDriver(Long id, String status) {
        Driver d = new Driver();
        d.setId(id);
        d.setUserId(10L + id);
        d.setLicenseNo("LIC-" + id);
        d.setStatus(status);
        return d;
    }

    @Test
    void getAll_returnsMappedDtos() {
        when(driverRepository.findAll()).thenReturn(
                List.of(buildDriver(1L, "AVAILABLE"), buildDriver(2L, "ON_TRIP")));

        List<DriverDto> result = driverService.getAll();

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getStatus()).isEqualTo("AVAILABLE");
        assertThat(result.get(1).getStatus()).isEqualTo("ON_TRIP");
    }

    @Test
    void getById_existing_returnsDto() {
        when(driverRepository.findById(1L)).thenReturn(Optional.of(buildDriver(1L, "AVAILABLE")));

        DriverDto dto = driverService.getById(1L);

        assertThat(dto.getId()).isEqualTo(1L);
        assertThat(dto.getLicenseNo()).isEqualTo("LIC-1");
    }

    @Test
    void getById_notFound_throwsException() {
        when(driverRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> driverService.getById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateStatus_savesNewStatus() {
        Driver driver = buildDriver(3L, "AVAILABLE");
        when(driverRepository.findById(3L)).thenReturn(Optional.of(driver));
        when(driverRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        DriverDto result = driverService.updateStatus(3L, "ON_TRIP");

        assertThat(result.getStatus()).isEqualTo("ON_TRIP");
    }

    @Test
    void findNearestAvailable_delegatesToRepository() {
        Driver driver = buildDriver(1L, "AVAILABLE");
        when(driverRepository.findNearestAvailableDriver(55.75, 37.62, 50_000.0))
                .thenReturn(Optional.of(driver));

        Driver result = driverService.findNearestAvailable(55.75, 37.62, 50.0);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
    }

    @Test
    void findNearestAvailable_noneFound_returnsNull() {
        when(driverRepository.findNearestAvailableDriver(anyDouble(), anyDouble(), anyDouble()))
                .thenReturn(Optional.empty());

        Driver result = driverService.findNearestAvailable(0, 0, 10);

        assertThat(result).isNull();
    }
}
