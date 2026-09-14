package com.estacionando.engines.routing;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record MapboxDirectionsResponse(List<Route> routes, String code) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Route(double distance, double duration, Geometry geometry, List<Leg> legs) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Geometry(String type, List<List<Double>> coordinates) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Leg(List<StepData> steps) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record StepData(double distance, double duration, Maneuver maneuver) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Maneuver(String instruction) {}
}
