package com.safeline.safeline.controller;

import com.safeline.safeline.dto.UserRequest;
import com.safeline.safeline.dto.UserResponse;
import com.safeline.safeline.model.User;
import com.safeline.safeline.repository.TenantRepository;
import com.safeline.safeline.repository.UserRepository;
import com.safeline.safeline.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;

    @GetMapping("/status")
    public ResponseEntity<String> getStatus() {
        return ResponseEntity.ok("User Management API is ready");
    }


    @GetMapping("/investigators")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ORG_ADMIN', 'INTAKE_OFFICER')")
    public ResponseEntity<List<UserResponse>> getInvestigators() {
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        
        Long tenantId = null;
        if (auth != null && auth.getPrincipal() instanceof com.safeline.safeline.security.TenantAwareUserDetails) {
            tenantId = ((com.safeline.safeline.security.TenantAwareUserDetails) auth.getPrincipal()).getTenantId();
        }

        if (tenantId == null) {
            return ResponseEntity.status(403).build();
        }

        List<User> users = userRepository.findByRoleNamesForTenant(List.of("INVESTIGATOR", "INTAKE_OFFICER", "ORG_ADMIN"), tenantId);
        List<UserResponse> response = users.stream().map(u -> {
            UserResponse res = new UserResponse();
            res.setId(u.getId());
            res.setUsername(u.getUsername());
            res.setEmail(u.getEmail());
            String roleName = u.getRoles().isEmpty() ? "USER" : u.getRoles().iterator().next().getName();
            res.setRole(roleName);
            res.setTenantId(u.getTenant().getId());
            return res;
        }).toList();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ORG_ADMIN', 'INTAKE_OFFICER', 'EXECUTIVE')")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        
        Long tenantId = null;
        if (auth != null && auth.getPrincipal() instanceof com.safeline.safeline.security.TenantAwareUserDetails) {
            tenantId = ((com.safeline.safeline.security.TenantAwareUserDetails) auth.getPrincipal()).getTenantId();
        }

        if (tenantId == null) {
            return ResponseEntity.status(403).build();
        }

        List<User> users = userRepository.findByTenantId(tenantId);
        System.out.println("DEBUG: getAllUsers - Tenant: " + tenantId + ", Count: " + users.size());
        List<UserResponse> response = users.stream().map(u -> {
            UserResponse res = new UserResponse();
            res.setId(u.getId());
            res.setUsername(u.getUsername());
            res.setEmail(u.getEmail());
            String roleName = u.getRoles().isEmpty() ? "USER" : u.getRoles().iterator().next().getName();
            res.setRole(roleName);
            res.setTenantId(u.getTenant().getId());
            return res;
        }).toList();
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ORG_ADMIN')")
    public ResponseEntity<UserResponse> createUser(@RequestBody UserRequest request) {
        return ResponseEntity.ok(userService.createUser(request));
    }
}
