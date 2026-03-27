package com.safeline.safeline.controller;

import com.safeline.safeline.dto.UserRequest;
import com.safeline.safeline.dto.UserResponse;
import com.safeline.safeline.model.*;
import com.safeline.safeline.repository.TenantRepository;
import com.safeline.safeline.repository.UserRepository;
import com.safeline.safeline.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
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
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ORG_ADMIN', 'ADMIN') or isAuthenticated()")
    @Transactional(readOnly = true)
    public ResponseEntity<List<UserResponse>> getInvestigators() {
        Long tenantId = com.safeline.safeline.security.TenantContext.getCurrentTenant();
        
        System.out.println("DEBUG: Investigator List Request");
        System.out.println("DEBUG: Authentication Principal: " + org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getPrincipal());
        System.out.println("DEBUG: Resolved TenantId (ThreadLocal): " + tenantId);
        
        if (tenantId == null) {
            System.err.println("DEBUG ERROR: No TenantId found for Investigator List fetch!");
            return ResponseEntity.status(403).build();
        }

        List<User> users = userRepository.findPotentialInvestigatorsForTenant(tenantId);
        List<UserResponse> response = users.stream().map(u -> {
            UserResponse res = new UserResponse();
            res.setId(u.getId());
            res.setUsername(u.getUsername());
            res.setFullName(u.getFullName());
            res.setEmployeeId(u.getEmployeeId());
            res.setEmail(u.getEmail());
            res.setRole(u.getRole());
            res.setTenantId(u.getTenant().getId());
            res.setCommitteePermissions(u.getCommitteePermissions());
            return res;
        }).toList();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ORG_ADMIN', 'ADMIN')")
    @Transactional(readOnly = true)
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
            res.setFullName(u.getFullName());
            res.setEmployeeId(u.getEmployeeId());
            res.setEmail(u.getEmail());
            res.setRole(u.getRole());
            res.setTenantId(u.getTenant().getId());
            res.setCommitteePermissions(u.getCommitteePermissions());
            return res;
        }).toList();
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ORG_ADMIN', 'ADMIN')")
    public ResponseEntity<UserResponse> createUser(@RequestBody UserRequest request) {
        return ResponseEntity.ok(userService.createUser(request));
    }
}
