package ru.tms.routing.service;

import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.tms.common.dto.RouteDto;
import ru.tms.common.dto.RoutePointDto;
import ru.tms.common.exception.ResourceNotFoundException;
import ru.tms.routing.client.YandexGeocoderClient;
import ru.tms.routing.dto.DistanceMatrixRequestDto;
import ru.tms.routing.dto.DistanceMatrixResponseDto;
import ru.tms.routing.dto.RouteRequestDto;
import ru.tms.routing.entity.Route;
import ru.tms.routing.entity.RoutePoint;
import ru.tms.routing.repository.RouteRepository;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RouteService {

    private final RouteRepository routeRepository;
    private final DistanceMatrixService distanceMatrixService;
    private final YandexGeocoderClient geocoderClient;
    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    @Transactional
    public RouteDto buildRoute(RouteRequestDto request) {
        routeRepository.findByOrderId(request.getOrderId())
                .ifPresent(routeRepository::delete);

        BigDecimal roadKm = distanceMatrixService.estimateRoadKm(
                request.getOriginLat(), request.getOriginLon(),
                request.getDestLat(),   request.getDestLon());

        int durationMin = distanceMatrixService.estimateDurationMin(
                roadKm.doubleValue(), request.getCargoWeight());

        List<double[]> waypoints = distanceMatrixService.generateWaypoints(
                request.getOriginLat(), request.getOriginLon(),
                request.getDestLat(),   request.getDestLon());

        Route route = Route.builder()
                .orderId(request.getOrderId())
                .totalKm(roadKm)
                .durationMin(durationMin)
                .status("PLANNED")
                .build();

        List<RoutePoint> points = new ArrayList<>();

        points.add(RoutePoint.builder()
                .route(route).seqNumber(0).address("Origin")
                .location(geometryFactory.createPoint(
                        new Coordinate(request.getOriginLon(), request.getOriginLat())))
                .pointType("ORIGIN").build());

        for (int i = 1; i < waypoints.size() - 1; i++) {
            double[] pt = waypoints.get(i);
            points.add(RoutePoint.builder()
                    .route(route).seqNumber(i).address("Waypoint " + i)
                    .location(geometryFactory.createPoint(new Coordinate(pt[1], pt[0])))
                    .pointType("WAYPOINT").build());
        }

        points.add(RoutePoint.builder()
                .route(route).seqNumber(waypoints.size() - 1).address("Destination")
                .location(geometryFactory.createPoint(
                        new Coordinate(request.getDestLon(), request.getDestLat())))
                .pointType("DESTINATION").build());

        route.setRoutePoints(points);
        return toDto(routeRepository.save(route));
    }

    public RouteDto getByOrderId(Long orderId) {
        Route route = routeRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Route for order", orderId));
        return toDto(route);
    }

    public double[] geocodeAddress(String address) {
        double[] coords = geocoderClient.geocode(address);
        if (coords == null) {
            throw new ru.tms.common.exception.BusinessException("Cannot geocode address: " + address);
        }
        return coords;
    }

    public DistanceMatrixResponseDto buildDistanceMatrix(DistanceMatrixRequestDto request) {
        List<String> resolved = new ArrayList<>();
        List<double[]> coords  = new ArrayList<>();

        for (String address : request.getAddresses()) {
            double[] coord = geocoderClient.geocode(address);
            if (coord != null) {
                resolved.add(address);
                coords.add(coord);
            }
        }

        double[][] matrix = distanceMatrixService.buildMatrix(coords);

        List<Map<String, Double>> coordMaps = coords.stream()
                .map(c -> Map.of("lat", c[0], "lon", c[1]))
                .toList();

        return DistanceMatrixResponseDto.builder()
                .addresses(resolved)
                .coordinates(coordMaps)
                .distanceMatrixKm(matrix)
                .build();
    }

    private RouteDto toDto(Route r) {
        List<RoutePointDto> pointDtos = r.getRoutePoints().stream()
                .map(p -> RoutePointDto.builder()
                        .id(p.getId())
                        .routeId(r.getId())
                        .seqNumber(p.getSeqNumber())
                        .address(p.getAddress())
                        .lat(p.getLocation() != null ? p.getLocation().getY() : null)
                        .lon(p.getLocation() != null ? p.getLocation().getX() : null)
                        .pointType(p.getPointType())
                        .build())
                .toList();

        return RouteDto.builder()
                .id(r.getId())
                .orderId(r.getOrderId())
                .totalKm(r.getTotalKm())
                .durationMin(r.getDurationMin())
                .status(r.getStatus())
                .createdAt(r.getCreatedAt())
                .routePoints(pointDtos)
                .build();
    }
}
