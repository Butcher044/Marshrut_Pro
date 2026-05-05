package ru.tms.routing.client;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Slf4j
@Component
@RequiredArgsConstructor
public class YandexGeocoderClient {

    private final RestTemplate restTemplate;

    @Value("${yandex.geocoder.api-key}")
    private String apiKey;

    @Value("${yandex.geocoder.base-url}")
    private String baseUrl;

    @Cacheable(value = "geocode", key = "#address")
    public double[] geocode(String address) {
        try {
            String url = UriComponentsBuilder.fromHttpUrl(baseUrl)
                    .queryParam("apikey", apiKey)
                    .queryParam("geocode", address)
                    .queryParam("format", "json")
                    .queryParam("results", 1)
                    .toUriString();

            JsonNode response = restTemplate.getForObject(url, JsonNode.class);

            return parseGeocoderResponse(response);
        } catch (Exception e) {
            log.error("Failed to geocode address '{}': {}", address, e.getMessage());
            return null;
        }
    }

    private double[] parseGeocoderResponse(JsonNode response) {
        try {
            JsonNode pos = response
                    .path("response")
                    .path("GeoObjectCollection")
                    .path("featureMember")
                    .get(0)
                    .path("GeoObject")
                    .path("Point")
                    .path("pos");

            if (pos.isMissingNode()) return null;

            String[] parts = pos.asText().split(" ");
            double lon = Double.parseDouble(parts[0]);
            double lat = Double.parseDouble(parts[1]);
            return new double[]{lat, lon};
        } catch (Exception e) {
            return null;
        }
    }
}
