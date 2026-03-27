package com.safeline.safeline.dto;

import lombok.Data;

@Data
public class AuthResponse {
    private String token;
    private String username;
    private String role;
    private Long tenantId;
    private String tenantDomain;
    private java.util.Set<com.safeline.safeline.model.CommitteePermission> committeePermissions;
}
