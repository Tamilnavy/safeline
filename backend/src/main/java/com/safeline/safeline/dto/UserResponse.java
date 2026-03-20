package com.safeline.safeline.dto;

import lombok.Data;

@Data
public class UserResponse {
    private Long id;
    private String username;
    private String fullName;
    private String employeeId;
    private String email;
    private String hierarchyLevel;
    private String accessRole;
    private Long tenantId;
}
