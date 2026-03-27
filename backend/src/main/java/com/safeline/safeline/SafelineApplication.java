package com.safeline.safeline;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootApplication
public class SafelineApplication {

	public static void main(String[] args) {
		SpringApplication.run(SafelineApplication.class, args);
	}
}
