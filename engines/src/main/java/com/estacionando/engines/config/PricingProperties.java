package com.estacionando.engines.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "pricing")
public record PricingProperties(int defaultBasePrice, double minMultiplier, double maxMultiplier) {}
