package ru.tms.core.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import ru.tms.core.dto.StatsSummaryDto;
import ru.tms.core.repository.DriverRepository;
import ru.tms.core.repository.OrderRepository;
import ru.tms.core.repository.VehicleRepository;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final OrderRepository orderRepository;
    private final DriverRepository driverRepository;
    private final VehicleRepository vehicleRepository;

    public StatsSummaryDto getSummary() {
        return StatsSummaryDto.builder()
                .ordersPending(orderRepository.countByStatus("PENDING"))
                .ordersAssigned(orderRepository.countByStatus("ASSIGNED"))
                .ordersInProgress(orderRepository.countByStatus("IN_PROGRESS"))
                .ordersDelivered(orderRepository.countByStatus("DELIVERED"))
                .ordersCancelled(orderRepository.countByStatus("CANCELLED"))

                .driversAvailable(driverRepository.countByStatus("AVAILABLE"))
                .driversOnTrip(driverRepository.countByStatus("ON_TRIP"))
                .driversOffDuty(driverRepository.countByStatus("OFF_DUTY"))

                .vehiclesAvailable(vehicleRepository.countByStatus("AVAILABLE"))
                .vehiclesInUse(vehicleRepository.countByStatus("IN_USE"))
                .vehiclesMaintenance(vehicleRepository.countByStatus("MAINTENANCE"))
                .build();
    }
}
