package com.estacionando.engines.routing.dto;

import com.estacionando.engines.common.GeoPoint;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record DirectionsRequest(
    @NotNull @Valid GeoPoint origin,
    @NotNull @Valid GeoPoint destination,
    String profile
) {}
