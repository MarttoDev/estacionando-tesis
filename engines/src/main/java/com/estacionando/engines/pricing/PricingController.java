package com.estacionando.engines.pricing;

import com.estacionando.engines.pricing.dto.PricingRequest;
import com.estacionando.engines.pricing.dto.PricingResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/pricing")
public class PricingController {

    private final PricingService pricingService;

    public PricingController(PricingService pricingService) {
        this.pricingService = pricingService;
    }

    @PostMapping("/suggest")
    public PricingResponse suggest(@Valid @RequestBody PricingRequest request) {
        return pricingService.suggest(request);
    }
}
