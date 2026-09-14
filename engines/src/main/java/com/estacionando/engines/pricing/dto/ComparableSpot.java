package com.estacionando.engines.pricing.dto;

import jakarta.validation.constraints.Positive;

public record ComparableSpot(@Positive int pricePerHour) {}
