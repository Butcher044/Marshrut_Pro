package ru.tms.core.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import ru.tms.common.dto.RouteDto;
import ru.tms.core.dto.RouteRequestDto;

import java.util.Map;

@FeignClient(name = "tms-routing-service")
public interface RoutingServiceClient {

    @PostMapping("/api/routes/build")
    RouteDto buildRoute(@RequestBody RouteRequestDto request);

    @PostMapping("/api/routes/geocode")
    Map<String, Double> geocodeAddress(@RequestBody Map<String, String> request);
}
