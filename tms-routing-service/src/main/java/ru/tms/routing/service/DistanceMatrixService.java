package ru.tms.routing.service;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Service
public class DistanceMatrixService {

    private static final double EARTH_RADIUS_KM = 6371.0;

    public double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    // Roads are never straight — correction factor drops as distance grows (highways are more direct)
    private double roadFactor(double straightKm) {
        if (straightKm < 20)  return 1.55;
        if (straightKm < 50)  return 1.40;
        if (straightKm < 150) return 1.30;
        if (straightKm < 500) return 1.20;
        return 1.12;
    }

    public BigDecimal estimateRoadKm(double lat1, double lon1, double lat2, double lon2) {
        double straight = haversineKm(lat1, lon1, lat2, lon2);
        return BigDecimal.valueOf(straight * roadFactor(straight)).setScale(2, RoundingMode.HALF_UP);
    }

    public int estimateDurationMin(double roadKm, BigDecimal cargoWeightKg) {
        double speedKmh;
        if      (roadKm < 20)  speedKmh = 25;   // dense urban
        else if (roadKm < 50)  speedKmh = 40;   // urban/suburban
        else if (roadKm < 150) speedKmh = 60;   // regional
        else if (roadKm < 500) speedKmh = 75;   // inter-city
        else                   speedKmh = 85;   // highway

        double kg = cargoWeightKg != null ? cargoWeightKg.doubleValue() : 0;
        if      (kg > 15000) speedKmh *= 0.80;
        else if (kg > 10000) speedKmh *= 0.88;
        else if (kg > 5000)  speedKmh *= 0.93;

        return (int) Math.ceil(roadKm / speedKmh * 60);
    }

    /**
     * Generates intermediate waypoints along a great-circle path with a slight
     * perpendicular sinusoidal offset to simulate realistic road curvature.
     */
    public List<double[]> generateWaypoints(double originLat, double originLon,
                                             double destLat, double destLon) {
        double distKm = haversineKm(originLat, originLon, destLat, destLon);
        int segments = distKm < 30 ? 3 : distKm < 100 ? 6 : distKm < 500 ? 10 : 16;

        double dLat = destLat - originLat;
        double dLon = destLon - originLon;
        double len  = Math.sqrt(dLat * dLat + dLon * dLon);
        double maxOffset = len * 0.015; // ~1.5% of route length in degrees

        List<double[]> points = new ArrayList<>();
        for (int i = 0; i <= segments; i++) {
            double t   = (double) i / segments;
            double lat = originLat + t * dLat;
            double lon = originLon + t * dLon;
            if (i > 0 && i < segments && len > 0) {
                double offset = Math.sin(t * Math.PI) * maxOffset;
                lat += offset * (-dLon / len);
                lon += offset * (dLat  / len);
            }
            points.add(new double[]{lat, lon});
        }
        return points;
    }

    /**
     * Builds an N×N road-distance matrix (km) for a list of geocoded coordinates.
     */
    public double[][] buildMatrix(List<double[]> coords) {
        int n = coords.size();
        double[][] matrix = new double[n][n];
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                if (i != j) {
                    double straight = haversineKm(
                            coords.get(i)[0], coords.get(i)[1],
                            coords.get(j)[0], coords.get(j)[1]);
                    matrix[i][j] = Math.round(straight * roadFactor(straight) * 100.0) / 100.0;
                }
            }
        }
        return matrix;
    }
}
