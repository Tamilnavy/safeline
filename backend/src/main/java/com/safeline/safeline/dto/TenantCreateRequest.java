package com.safeline.safeline.dto;

import lombok.Data;

@Data
public class TenantCreateRequest {
    // Tenant details
    private String name;
    private String domain;

    // Admin user details
    private String adminUsername;
    private String adminEmail;
    private String adminPassword;
}
