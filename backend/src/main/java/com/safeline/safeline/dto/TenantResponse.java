package com.safeline.safeline.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class TenantResponse {
    private Long id;
    private String name;
    private String domain;
    private boolean active;
    private LocalDateTime createdAt;
    private String adminUsername;
    private String adminEmail;
}
