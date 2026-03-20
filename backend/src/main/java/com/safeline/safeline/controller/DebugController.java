package com.safeline.safeline.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/debug")
@RequiredArgsConstructor
public class DebugController {

    private final JdbcTemplate jdbcTemplate;

    @GetMapping("/fix")
    public ResponseEntity<?> fixDb() {
        try {
            jdbcTemplate.execute("ALTER TABLE complaints DROP CONSTRAINT IF EXISTS complaints_status_check");
            return ResponseEntity.ok("Database constraint dropped successfully. Jonny!");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }
}
