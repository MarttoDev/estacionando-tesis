package com.estacionando.engines.routing;

import com.estacionando.engines.routing.dto.DirectionsRequest;
import com.estacionando.engines.routing.dto.DirectionsResponse;
import com.estacionando.engines.routing.dto.RankRequest;
import com.estacionando.engines.routing.dto.RankResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/route")
public class RoutingController {

    private final RoutingService routingService;

    public RoutingController(RoutingService routingService) {
        this.routingService = routingService;
    }

    @PostMapping("/rank")
    public RankResponse rank(@Valid @RequestBody RankRequest request) {
        return routingService.rank(request);
    }

    @PostMapping("/directions")
    public DirectionsResponse directions(@Valid @RequestBody DirectionsRequest request) {
        return routingService.directions(request);
    }
}
