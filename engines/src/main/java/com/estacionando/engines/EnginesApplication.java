package com.estacionando.engines;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class EnginesApplication {

	public static void main(String[] args) {
		SpringApplication.run(EnginesApplication.class, args);
	}

}
