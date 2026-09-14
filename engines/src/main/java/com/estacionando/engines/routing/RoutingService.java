package com.estacionando.engines.routing;

import com.estacionando.engines.routing.dto.Candidate;
import com.estacionando.engines.routing.dto.DirectionsRequest;
import com.estacionando.engines.routing.dto.DirectionsResponse;
import com.estacionando.engines.routing.dto.RankRequest;
import com.estacionando.engines.routing.dto.RankResponse;
import com.estacionando.engines.routing.dto.RankedCandidate;
import com.estacionando.engines.routing.dto.Step;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class RoutingService {

    private static final String DEFAULT_PROFILE = "driving";

    private final MapboxRoutingClient mapboxClient;

    public RoutingService(MapboxRoutingClient mapboxClient) {
        this.mapboxClient = mapboxClient;
    }

    public RankResponse rank(RankRequest request) {
        String profile = request.profile() != null ? request.profile() : DEFAULT_PROFILE;
        List<Candidate> candidates = request.candidates();

        MapboxRoutingClient.MatrixResult result = mapboxClient.matrix(
            request.origin().latitude(), request.origin().longitude(), candidates, profile);

        List<RankedCandidate> ranked = new ArrayList<>();
        for (int i = 0; i < candidates.size(); i++) {
            // index 0 in the matrix response is the origin itself; candidates start at index 1
            Double duration = result.durations().get(i + 1);
            Double distance = result.distances().get(i + 1);
            if (duration == null || distance == null) continue;
            ranked.add(new RankedCandidate(candidates.get(i).id(), distance, duration));
        }
        ranked.sort(Comparator.comparingDouble(RankedCandidate::durationSeconds));

        return new RankResponse(ranked);
    }

    public DirectionsResponse directions(DirectionsRequest request) {
        String profile = request.profile() != null ? request.profile() : DEFAULT_PROFILE;
        MapboxDirectionsResponse.Route route = mapboxClient.directions(
            request.origin().latitude(), request.origin().longitude(),
            request.destination().latitude(), request.destination().longitude(),
            profile);

        List<Step> steps = new ArrayList<>();
        if (route.legs() != null) {
            for (MapboxDirectionsResponse.Leg leg : route.legs()) {
                if (leg.steps() == null) continue;
                for (MapboxDirectionsResponse.StepData step : leg.steps()) {
                    String instruction = step.maneuver() != null ? step.maneuver().instruction() : "";
                    steps.add(new Step(instruction, step.distance(), step.duration()));
                }
            }
        }

        String geometry = serializeGeometry(route.geometry());
        return new DirectionsResponse(route.distance(), route.duration(), geometry, steps);
    }

    private String serializeGeometry(MapboxDirectionsResponse.Geometry geometry) {
        if (geometry == null || geometry.coordinates() == null) return null;

        StringBuilder text = new StringBuilder();
        for (List<Double> point : geometry.coordinates()) {
            if (!text.isEmpty()) text.append(';');
            text.append(point.get(0)).append(',').append(point.get(1));
        }
        return text.toString();
    }
}
