package com.estacionando.engines.routing.dto;

import com.estacionando.engines.common.GeoPoint;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record RankRequest(
    @NotNull @Valid GeoPoint origin,
    @NotEmpty @Valid List<Candidate> candidates,
    String profile
) {}
