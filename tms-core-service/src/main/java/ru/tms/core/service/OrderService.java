package ru.tms.core.service;

import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.tms.common.dto.OrderCreateDto;
import ru.tms.common.dto.OrderDto;
import ru.tms.common.dto.RouteDto;
import ru.tms.common.exception.BusinessException;
import ru.tms.common.exception.ResourceNotFoundException;
import ru.tms.core.client.RoutingServiceClient;
import ru.tms.core.dto.RouteRequestDto;
import ru.tms.core.entity.Driver;
import ru.tms.core.entity.Order;
import ru.tms.core.repository.OrderRepository;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final DriverService driverService;
    private final RoutingServiceClient routingServiceClient;
    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    @Transactional
    public OrderDto create(OrderCreateDto dto, Long clientId) {
        Order order = Order.builder()
                .clientId(clientId)
                .originAddress(dto.getOriginAddress())
                .destAddress(dto.getDestAddress())
                .cargoWeight(dto.getCargoWeight())
                .cargoVolume(dto.getCargoVolume())
                .status("PENDING")
                .build();

        tryGeocodeOrder(order);

        return toDto(orderRepository.save(order));
    }

    private void tryGeocodeOrder(Order order) {
        try {
            Map<String, Double> origin = routingServiceClient.geocodeAddress(
                    Map.of("address", order.getOriginAddress()));
            if (origin != null && origin.containsKey("lat")) {
                order.setOriginLocation(geometryFactory.createPoint(
                        new org.locationtech.jts.geom.Coordinate(origin.get("lon"), origin.get("lat"))));
            }
        } catch (Exception ignored) {}

        try {
            Map<String, Double> dest = routingServiceClient.geocodeAddress(
                    Map.of("address", order.getDestAddress()));
            if (dest != null && dest.containsKey("lat")) {
                order.setDestLocation(geometryFactory.createPoint(
                        new org.locationtech.jts.geom.Coordinate(dest.get("lon"), dest.get("lat"))));
            }
        } catch (Exception ignored) {}
    }

    public OrderDto getById(Long id) {
        return toDto(orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", id)));
    }

    public Page<OrderDto> getAll(String status, Pageable pageable) {
        if (status != null) {
            return orderRepository.findByStatus(status, pageable).map(this::toDto);
        }
        return orderRepository.findAll(pageable).map(this::toDto);
    }

    public Page<OrderDto> getByClient(Long clientId, Pageable pageable) {
        return orderRepository.findByClientId(clientId, pageable).map(this::toDto);
    }

    public Page<OrderDto> getByDriverUserId(Long userId, Pageable pageable) {
        try {
            Long driverId = driverService.getByUserId(userId).getId();
            return orderRepository.findByDriverId(driverId, pageable).map(this::toDto);
        } catch (Exception e) {
            return org.springframework.data.domain.Page.empty(pageable);
        }
    }

    @Transactional
    public OrderDto updateStatus(Long id, String status) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", id));
        order.setStatus(status);
        return toDto(orderRepository.save(order));
    }

    @Transactional
    public OrderDto assignDriver(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));

        if (!order.getStatus().equals("PENDING")) {
            throw new BusinessException("Order must be in PENDING status to assign a driver");
        }

        if (order.getOriginLocation() == null) {
            tryGeocodeOrder(order);
            order = orderRepository.save(order);
        }

        Driver driver;
        if (order.getOriginLocation() != null) {
            double lat = order.getOriginLocation().getY();
            double lon = order.getOriginLocation().getX();
            driver = driverService.findNearestAvailable(lat, lon, 50.0);
            if (driver == null) {
                driver = driverService.findAnyAvailable();
            }
        } else {
            driver = driverService.findAnyAvailable();
        }

        if (driver == null) {
            throw new BusinessException("No available drivers found");
        }

        order.setDriver(driver);
        order.setStatus("ASSIGNED");
        order = orderRepository.save(order);

        // Build route via routing-service
        if (order.getOriginLocation() != null && order.getDestLocation() != null) {
            try {
                RouteRequestDto routeRequest = RouteRequestDto.builder()
                        .orderId(order.getId())
                        .originLat(order.getOriginLocation().getY())
                        .originLon(order.getOriginLocation().getX())
                        .destLat(order.getDestLocation().getY())
                        .destLon(order.getDestLocation().getX())
                        .cargoWeight(order.getCargoWeight())
                        .build();
                routingServiceClient.buildRoute(routeRequest);
            } catch (Exception ignored) {
                // Route building failure should not block order assignment
            }
        }

        driverService.updateStatus(driver.getId(), "ON_TRIP");

        return toDto(order);
    }

    @Transactional
    public void delete(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", id));
        if (!order.getStatus().equals("PENDING") && !order.getStatus().equals("CANCELLED")) {
            throw new BusinessException("Only PENDING or CANCELLED orders can be deleted");
        }
        orderRepository.deleteById(id);
    }

    private OrderDto toDto(Order o) {
        return OrderDto.builder()
                .id(o.getId())
                .clientId(o.getClientId())
                .driverId(o.getDriver() != null ? o.getDriver().getId() : null)
                .originAddress(o.getOriginAddress())
                .destAddress(o.getDestAddress())
                .originLat(o.getOriginLocation() != null ? o.getOriginLocation().getY() : null)
                .originLon(o.getOriginLocation() != null ? o.getOriginLocation().getX() : null)
                .destLat(o.getDestLocation() != null ? o.getDestLocation().getY() : null)
                .destLon(o.getDestLocation() != null ? o.getDestLocation().getX() : null)
                .cargoWeight(o.getCargoWeight())
                .cargoVolume(o.getCargoVolume())
                .status(o.getStatus())
                .createdAt(o.getCreatedAt())
                .updatedAt(o.getUpdatedAt())
                .build();
    }
}
