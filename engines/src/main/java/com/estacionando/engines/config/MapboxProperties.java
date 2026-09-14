package com.estacionando.engines.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "mapbox")
public record MapboxProperties(String accessToken, String baseUrl) {}
