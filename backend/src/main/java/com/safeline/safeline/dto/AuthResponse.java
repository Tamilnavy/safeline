package com.safeline.safeline.dto;

import lombok.Data;

@Data
public class AuthResponse {
    private String token;
    private String username;
    private String hierarchyLevel;
    private String accessRole;
    private Long tenantId;
    private String tenantDomain; // Added so frontend can set X-Tenant-Id correctly
}
