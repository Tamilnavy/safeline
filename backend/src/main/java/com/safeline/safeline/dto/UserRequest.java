package com.safeline.safeline.dto;

import lombok.Data;

@Data
public class UserRequest {
    private String username;
    private String password;
    private String email;
    private String roleName;
    private Long tenantId;
}
