package ru.tms.routing.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import ru.tms.common.dto.RouteDto;
import ru.tms.common.exception.BusinessException;
import ru.tms.common.exception.ResourceNotFoundException;
import ru.tms.routing.client.YandexGeocoderClient;
import ru.tms.routing.dto.RouteRequestDto;
import ru.tms.routing.entity.Route;
import ru.tms.routing.repository.RouteRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RouteServiceTest {

    @Mock
    private RouteRepository routeRepository;

    @Spy
    private DistanceMatrixService distanceMatrixService;

    @Mock
    private YandexGeocoderClient geocoderClient;

    @InjectMocks
    private RouteService routeService;

    private RouteRequestDto buildRequest() {
        RouteRequestDto req = new RouteRequestDto();
        req.setOrderId(1L);
        req.setOriginLat(55.75);
        req.setOriginLon(37.62);
        req.setDestLat(59.93);
        req.setDestLon(30.32);
        req.setCargoWeight(BigDecimal.valueOf(1000));
        return req;
    }

    @Test
    void buildRoute_createsAndSavesRoute() {
        when(routeRepository.findByOrderId(1L)).thenReturn(Optional.empty());

        Route saved = Route.builder()
                .id(10L).orderId(1L)
                .totalKm(BigDecimal.valueOf(705.50))
                .durationMin(480).status("PLANNED")
                .routePoints(List.of())
                .createdAt(LocalDateTime.now()).build();
        when(routeRepository.save(any())).thenReturn(saved);

        RouteDto result = routeService.buildRoute(buildRequest());

        assertThat(result.getId()).isEqualTo(10L);
        assertThat(result.getStatus()).isEqualTo("PLANNED");
        verify(routeRepository).save(any(Route.class));
    }

    @Test
    void buildRoute_existingRouteIsDeletedFirst() {
        Route existing = Route.builder().id(5L).orderId(1L).build();
        when(routeRepository.findByOrderId(1L)).thenReturn(Optional.of(existing));

        Route saved = Route.builder()
                .id(11L).orderId(1L).totalKm(BigDecimal.TEN)
                .durationMin(60).status("PLANNED").routePoints(List.of())
                .createdAt(LocalDateTime.now()).build();
        when(routeRepository.save(any())).thenReturn(saved);

        routeService.buildRoute(buildRequest());

        verify(routeRepository).delete(existing);
    }

    @Test
    void getByOrderId_found_returnsDto() {
        Route route = Route.builder()
                .id(20L).orderId(3L).totalKm(BigDecimal.valueOf(100))
                .durationMin(90).status("PLANNED").routePoints(List.of())
                .createdAt(LocalDateTime.now()).build();
        when(routeRepository.findByOrderId(3L)).thenReturn(Optional.of(route));

        RouteDto result = routeService.getByOrderId(3L);

        assertThat(result.getOrderId()).isEqualTo(3L);
        assertThat(result.getDurationMin()).isEqualTo(90);
    }

    @Test
    void getByOrderId_notFound_throwsResourceNotFoundException() {
        when(routeRepository.findByOrderId(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> routeService.getByOrderId(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void geocodeAddress_found_returnsCoords() {
        when(geocoderClient.geocode("Moscow, Red Square"))
                .thenReturn(new double[]{55.754, 37.621});

        double[] coords = routeService.geocodeAddress("Moscow, Red Square");

        assertThat(coords).containsExactly(55.754, 37.621);
    }

    @Test
    void geocodeAddress_notFound_throwsBusinessException() {
        when(geocoderClient.geocode(any())).thenReturn(null);

        assertThatThrownBy(() -> routeService.geocodeAddress("Unknown place"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Cannot geocode");
    }
}
