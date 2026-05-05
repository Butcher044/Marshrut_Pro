package ru.tms.routing.client;

import org.junit.jupiter.api.Test;
import ru.tms.routing.service.DistanceMatrixService;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.*;

class DistanceMatrixServiceTest {

    private final DistanceMatrixService service = new DistanceMatrixService();

    // Moscow → Saint Petersburg: ~634 km straight line
    private static final double MOS_LAT = 55.7558, MOS_LON = 37.6173;
    private static final double SPB_LAT = 59.9343, SPB_LON = 30.3351;

    @Test
    void haversine_moscowToSpb_isAround634km() {
        double dist = service.haversineKm(MOS_LAT, MOS_LON, SPB_LAT, SPB_LON);
        assertThat(dist).isBetween(630.0, 680.0);
    }

    @Test
    void estimateRoadKm_isGreaterThanStraightLine() {
        BigDecimal road = service.estimateRoadKm(MOS_LAT, MOS_LON, SPB_LAT, SPB_LON);
        double straight = service.haversineKm(MOS_LAT, MOS_LON, SPB_LAT, SPB_LON);
        assertThat(road.doubleValue()).isGreaterThan(straight);
    }

    @Test
    void estimateDurationMin_heavyCargo_isSlower() {
        int light = service.estimateDurationMin(700, BigDecimal.valueOf(1000));
        int heavy = service.estimateDurationMin(700, BigDecimal.valueOf(20000));
        assertThat(heavy).isGreaterThan(light);
    }

    @Test
    void generateWaypoints_containsOriginAndDestination() {
        List<double[]> pts = service.generateWaypoints(MOS_LAT, MOS_LON, SPB_LAT, SPB_LON);
        assertThat(pts).hasSizeGreaterThanOrEqualTo(2);
        assertThat(pts.get(0)).containsExactly(MOS_LAT, MOS_LON);
        assertThat(pts.get(pts.size() - 1)).containsExactly(SPB_LAT, SPB_LON);
    }

    @Test
    void buildMatrix_symmetricZeroDiagonal() {
        List<double[]> coords = List.of(
                new double[]{MOS_LAT, MOS_LON},
                new double[]{SPB_LAT, SPB_LON},
                new double[]{56.85, 60.61} // Yekaterinburg
        );
        double[][] m = service.buildMatrix(coords);

        assertThat(m[0][0]).isEqualTo(0.0);
        assertThat(m[1][1]).isEqualTo(0.0);
        assertThat(m[0][1]).isGreaterThan(0);
        assertThat(m[1][0]).isGreaterThan(0);
    }
}
