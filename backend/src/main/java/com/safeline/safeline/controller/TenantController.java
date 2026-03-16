package com.safeline.safeline.controller;

import com.safeline.safeline.dto.UserRequest;
import com.safeline.safeline.dto.UserResponse;
import com.safeline.safeline.model.Tenant;
import com.safeline.safeline.model.User;
import com.safeline.safeline.repository.UserRepository;
import com.safeline.safeline.service.TenantService;
import com.safeline.safeline.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tenants")
@RequiredArgsConstructor
public class TenantController {

    private final TenantService tenantService;
    private final UserService userService;
    private final UserRepository userRepository;

    // Get all tenants
    @GetMapping
    @PreAuthorize("hasAuthority('SUPER_ADMIN')")
    public ResponseEntity<List<Tenant>> getAllTenants() {
        return ResponseEntity.ok(tenantService.getAllTenants());
    }

    // Platform metrics
    @GetMapping("/metrics")
    @PreAuthorize("hasAuthority('SUPER_ADMIN')")
    public ResponseEntity<com.safeline.safeline.dto.PlatformMetricsDTO> getMetrics() {
        return ResponseEntity.ok(tenantService.getPlatformMetrics());
    }

    // Create tenant with Admin
    @PostMapping
    @PreAuthorize("hasAuthority('SUPER_ADMIN')")
    public ResponseEntity<com.safeline.safeline.dto.TenantResponse> createTenant(@RequestBody com.safeline.safeline.dto.TenantCreateRequest request) {
        return ResponseEntity.ok(tenantService.createTenantWithAdmin(request));
    }

    // DELETE tenant
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('SUPER_ADMIN')")
    public ResponseEntity<Void> deleteTenant(@PathVariable Long id) {
        tenantService.deleteTenant(id);
        return ResponseEntity.noContent().build();
    }

    // GET particular tenant
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('SUPER_ADMIN')")
    public ResponseEntity<Tenant> getTenantById(@PathVariable Long id) {
        return ResponseEntity.ok(tenantService.getTenantById(id));
    }

    // UPDATE tenant
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('SUPER_ADMIN')")
    public ResponseEntity<Tenant> updateTenant(
            @PathVariable Long id,
            @RequestBody Tenant tenant) {
        return ResponseEntity.ok(tenantService.updateTenant(id, tenant));
    }

    // ------------------------------------------------
    // GET users for a specific tenant (Super Admin can still see list)
    // ------------------------------------------------
    @GetMapping("/{id}/users")
    @PreAuthorize("hasAuthority('SUPER_ADMIN')")
    public ResponseEntity<List<UserResponse>> getUsersForTenant(@PathVariable Long id) {
        List<User> users = userRepository.findByTenantId(id);
        List<UserResponse> response = users.stream().map(u -> {
            UserResponse res = new UserResponse();
            res.setId(u.getId());
            res.setUsername(u.getUsername());
            res.setEmail(u.getEmail());
            res.setRole(u.getRoles().isEmpty() ? "N/A" : u.getRoles().iterator().next().getName());
            res.setTenantId(u.getTenant() != null ? u.getTenant().getId() : null);
            return res;
        }).toList();
        return ResponseEntity.ok(response);
    }

    // ------------------------------------------------
    // Add a user - REMOVED for Super Admin
    // Only Tenant Admin should add users via UserController
    // ------------------------------------------------
}