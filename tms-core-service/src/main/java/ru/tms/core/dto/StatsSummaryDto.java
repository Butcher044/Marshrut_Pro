package ru.tms.core.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class StatsSummaryDto {
    private long ordersPending;
    private long ordersAssigned;
    private long ordersInProgress;
    private long ordersDelivered;
    private long ordersCancelled;

    private long driversAvailable;
    private long driversOnTrip;
    private long driversOffDuty;

    private long vehiclesAvailable;
    private long vehiclesInUse;
    private long vehiclesMaintenance;
}
