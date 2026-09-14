package com.estacionando.engines.pricing;

import com.estacionando.engines.config.PricingProperties;
import com.estacionando.engines.pricing.dto.ComparableSpot;
import com.estacionando.engines.pricing.dto.OccupancyStats;
import com.estacionando.engines.pricing.dto.PriceFactor;
import com.estacionando.engines.pricing.dto.PricingRequest;
import com.estacionando.engines.pricing.dto.PricingResponse;
import java.time.DayOfWeek;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;

/**
 * Rule-based pricing heuristic: starts from an observable base price (comparable spots in the
 * same comuna, or the spot's own current price), then nudges it up or down based on recent
 * occupancy and time-of-day/day-of-week demand. Every adjustment is reported back as a labeled
 * factor so the suggestion stays explainable instead of a black box.
 */
@Service
public class PricingService {

    private final PricingProperties properties;

    public PricingService(PricingProperties properties) {
        this.properties = properties;
    }

    public PricingResponse suggest(PricingRequest request) {
        double base = resolveBasePrice(request);
        List<PriceFactor> factors = new ArrayList<>();

        double occupancyAdjustment = occupancyAdjustment(request.occupancy(), factors);
        OffsetDateTime requestedAt = parseRequestedAt(request.requestedAt());
        double timeAdjustment = timeAdjustment(requestedAt, factors);

        double multiplier = 1 + occupancyAdjustment + timeAdjustment;
        multiplier = Math.max(properties.minMultiplier(), Math.min(properties.maxMultiplier(), multiplier));

        int suggested = (int) Math.round(base * multiplier);
        int min = (int) Math.round(base * properties.minMultiplier());
        int max = (int) Math.round(base * properties.maxMultiplier());

        String explanation = buildExplanation(base, factors, suggested);

        return new PricingResponse(suggested, min, max, (int) Math.round(base), factors, explanation);
    }

    private OffsetDateTime parseRequestedAt(String requestedAt) {
        if (requestedAt == null || requestedAt.isBlank()) {
            return OffsetDateTime.now();
        }
        try {
            return OffsetDateTime.parse(requestedAt);
        } catch (DateTimeParseException ex) {
            throw new IllegalArgumentException("requestedAt debe ser una fecha ISO-8601 con offset, ej. 2026-09-14T09:00:00-04:00");
        }
    }

    private double resolveBasePrice(PricingRequest request) {
        List<ComparableSpot> comparableSpots = request.comparableSpots();
        if (comparableSpots != null && !comparableSpots.isEmpty()) {
            return comparableSpots.stream().mapToInt(ComparableSpot::pricePerHour).average().orElse(properties.defaultBasePrice());
        }
        if (request.currentPricePerHour() != null) {
            return request.currentPricePerHour();
        }
        return properties.defaultBasePrice();
    }

    private double occupancyAdjustment(OccupancyStats occupancy, List<PriceFactor> factors) {
        if (occupancy == null || occupancy.availableHours() <= 0) {
            return 0;
        }

        double rate = Math.max(0, Math.min(1, occupancy.bookedHours() / occupancy.availableHours()));
        double adjustment;
        String label;
        if (rate > 0.7) {
            adjustment = 0.15;
            label = "Ocupación alta (%.0f%% reservado)".formatted(rate * 100);
        } else if (rate > 0.4) {
            adjustment = 0.05;
            label = "Ocupación moderada (%.0f%% reservado)".formatted(rate * 100);
        } else if (rate < 0.15) {
            adjustment = -0.10;
            label = "Ocupación baja (%.0f%% reservado)".formatted(rate * 100);
        } else {
            adjustment = 0;
            label = "Ocupación estable (%.0f%% reservado)".formatted(rate * 100);
        }

        factors.add(new PriceFactor(label, adjustment * 100));
        return adjustment;
    }

    private double timeAdjustment(OffsetDateTime requestedAt, List<PriceFactor> factors) {
        int hour = requestedAt.getHour();
        DayOfWeek day = requestedAt.getDayOfWeek();
        boolean isWeekend = day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY;

        double adjustment;
        String label;
        if (!isWeekend && ((hour >= 8 && hour < 10) || (hour >= 18 && hour < 20))) {
            adjustment = 0.10;
            label = "Hora punta entre semana";
        } else if (isWeekend && hour >= 10 && hour < 20) {
            adjustment = 0.05;
            label = "Fin de semana de alta demanda";
        } else if (hour < 6) {
            adjustment = -0.10;
            label = "Horario de baja demanda (madrugada)";
        } else {
            adjustment = 0;
            label = "Horario estándar";
        }

        factors.add(new PriceFactor(label, adjustment * 100));
        return adjustment;
    }

    private String buildExplanation(double base, List<PriceFactor> factors, int suggested) {
        StringBuilder text = new StringBuilder("Precio base de referencia: $%.0f. ".formatted(base));
        for (PriceFactor factor : factors) {
            if (factor.adjustmentPercent() == 0) continue;
            String sign = factor.adjustmentPercent() > 0 ? "+" : "";
            text.append(factor.label()).append(": ").append(sign).append("%.0f%%. ".formatted(factor.adjustmentPercent()));
        }
        text.append("Precio sugerido: $").append(suggested).append(" por hora.");
        return text.toString();
    }
}
