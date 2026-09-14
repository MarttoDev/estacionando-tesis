package com.estacionando.engines.pricing.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

/**
 * {@code requestedAt}, when present, must be an ISO-8601 offset date-time (e.g.
 * {@code 2026-09-14T09:00:00-04:00}) representing the wall-clock time to price for — it is
 * parsed as plain text and read back verbatim (see {@code PricingService}) instead of going
 * through Jackson's date module, which would otherwise silently shift the hour to the server's
 * time zone before the peak-hour heuristic ever sees it.
 */
public record PricingRequest(
    @NotBlank String comuna,
    @NotBlank String parkingTypeName,
    Integer currentPricePerHour,
    @Valid List<ComparableSpot> comparableSpots,
    @Valid OccupancyStats occupancy,
    String requestedAt
) {}
