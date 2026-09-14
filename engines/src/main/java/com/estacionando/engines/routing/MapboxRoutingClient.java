package com.estacionando.engines.routing;

import com.estacionando.engines.config.MapboxProperties;
import com.estacionando.engines.routing.dto.Candidate;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class MapboxRoutingClient {

    /** Mapbox's Matrix API caps a request at 25 coordinates total (1 origin + up to 24 destinations). */
    private static final int MAX_MATRIX_COORDINATES = 25;

    private final RestClient restClient;
    private final MapboxProperties properties;

    public MapboxRoutingClient(RestClient mapboxRestClient, MapboxProperties properties) {
        this.restClient = mapboxRestClient;
        this.properties = properties;
    }

    public MatrixResult matrix(double originLat, double originLng, List<Candidate> candidates, String profile) {
        if (candidates.size() > MAX_MATRIX_COORDINATES - 1) {
            throw new IllegalArgumentException("Máximo %d espacios candidatos por consulta".formatted(MAX_MATRIX_COORDINATES - 1));
        }

        String coordinates = formatCoordinate(originLng, originLat) + ";"
            + candidates.stream().map(c -> formatCoordinate(c.longitude(), c.latitude())).collect(Collectors.joining(";"));

        MapboxMatrixResponse response = restClient.get()
            .uri(uriBuilder -> uriBuilder
                .path("/directions-matrix/v1/mapbox/{profile}/{coordinates}")
                .queryParam("sources", "0")
                .queryParam("annotations", "distance,duration")
                .queryParam("access_token", properties.accessToken())
                .build(profile, coordinates))
            .retrieve()
            .body(MapboxMatrixResponse.class);

        if (response == null || response.durations() == null || response.durations().isEmpty()) {
            throw new IllegalStateException("Respuesta inválida del servicio de rutas");
        }

        return new MatrixResult(response.durations().get(0), response.distances().get(0));
    }

    public MapboxDirectionsResponse.Route directions(double originLat, double originLng, double destLat, double destLng, String profile) {
        String coordinates = formatCoordinate(originLng, originLat) + ";" + formatCoordinate(destLng, destLat);

        MapboxDirectionsResponse response = restClient.get()
            .uri(uriBuilder -> uriBuilder
                .path("/directions/v5/mapbox/{profile}/{coordinates}")
                .queryParam("geometries", "geojson")
                .queryParam("steps", "true")
                .queryParam("overview", "full")
                .queryParam("access_token", properties.accessToken())
                .build(profile, coordinates))
            .retrieve()
            .body(MapboxDirectionsResponse.class);

        if (response == null || response.routes() == null || response.routes().isEmpty()) {
            throw new IllegalStateException("No se encontró una ruta entre los puntos indicados");
        }

        return response.routes().get(0);
    }

    private String formatCoordinate(double lng, double lat) {
        return String.format(Locale.US, "%.6f,%.6f", lng, lat);
    }

    public record MatrixResult(List<Double> durations, List<Double> distances) {}
}
