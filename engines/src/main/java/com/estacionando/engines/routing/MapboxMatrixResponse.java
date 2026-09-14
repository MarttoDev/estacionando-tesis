package com.estacionando.engines.routing;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record MapboxMatrixResponse(List<List<Double>> durations, List<List<Double>> distances, String code) {}
