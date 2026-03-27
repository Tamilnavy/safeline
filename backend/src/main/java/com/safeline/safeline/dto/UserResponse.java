package com.safeline.safeline.dto;

import lombok.Data;

@Data
public class UserResponse {
    private Long id;
    private String username;
    private String fullName;
    private String employeeId;
    private String email;
    private String role;
    private Long tenantId;
    private boolean enabled;
    private java.util.Set<com.safeline.safeline.model.CommitteePermission> committeePermissions;
}
