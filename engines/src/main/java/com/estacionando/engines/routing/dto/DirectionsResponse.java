package com.estacionando.engines.routing.dto;

import java.util.List;

/**
 * {@code geometry} is the route line encoded as {@code "lng,lat;lng,lat;..."} (no external
 * geo-JSON dependency needed) — split on ";" then "," on the consumer side to build a
 * Mapbox GL LineString.
 */
public record DirectionsResponse(double distanceMeters, double durationSeconds, String geometry, List<Step> steps) {}
