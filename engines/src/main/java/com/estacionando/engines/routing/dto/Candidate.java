package com.estacionando.engines.routing.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record Candidate(@NotBlank String id, @NotNull Double latitude, @NotNull Double longitude) {}
