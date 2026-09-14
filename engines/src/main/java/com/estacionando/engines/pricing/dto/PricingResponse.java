package com.estacionando.engines.pricing.dto;

import java.util.List;

public record PricingResponse(
    int suggestedPricePerHour,
    int minPricePerHour,
    int maxPricePerHour,
    int basePricePerHour,
    List<PriceFactor> factors,
    String explanation
) {}
