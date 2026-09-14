package com.estacionando.engines.pricing.dto;

import jakarta.validation.constraints.PositiveOrZero;

public record OccupancyStats(@PositiveOrZero double bookedHours, @PositiveOrZero double availableHours) {}
