package com.safeline.safeline.controller;

import com.safeline.safeline.model.Role;
import com.safeline.safeline.model.Tenant;
import com.safeline.safeline.repository.RoleRepository;
import com.safeline.safeline.repository.TenantRepository;
import com.safeline.safeline.security.TenantAwareUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/roles")
@RequiredArgsConstructor
public class RoleController {

    private final RoleRepository roleRepository;
    private final TenantRepository tenantRepository;

    @GetMapping
    @PreAuthorize("hasAuthority('ORG_ADMIN')")
    public ResponseEntity<List<Role>> getRoles(@AuthenticationPrincipal TenantAwareUserDetails principal) {
        return ResponseEntity.ok(roleRepository.findByTenantId(principal.getTenantId()));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ORG_ADMIN')")
    public ResponseEntity<?> createRole(
            @AuthenticationPrincipal TenantAwareUserDetails principal,
            @RequestBody Role roleRequest) {

        if (roleRepository.findByNameAndTenantId(roleRequest.getName(), principal.getTenantId()).isPresent()) {
            return ResponseEntity.badRequest().body("Role already exists in this organization");
        }

        Tenant tenant = tenantRepository.findById(principal.getTenantId())
                .orElseThrow(() -> new RuntimeException("Tenant not found"));

        Role role = new Role();
        role.setName(roleRequest.getName().toUpperCase());
        role.setTenant(tenant);
        
        return ResponseEntity.ok(roleRepository.save(role));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ORG_ADMIN')")
    public ResponseEntity<?> deleteRole(
            @AuthenticationPrincipal TenantAwareUserDetails principal,
            @PathVariable Long id) {
        
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Role not found"));

        if (!role.getTenant().getId().equals(principal.getTenantId())) {
            return ResponseEntity.status(403).body("Unauthorized to delete this role");
        }

        // Prevent deleting system roles if they exist in the DB
        if (List.of("ORG_ADMIN", "EMPLOYEE", "SUPER_ADMIN").contains(role.getName())) {
            return ResponseEntity.badRequest().body("Cannot delete system roles");
        }

        roleRepository.delete(role);
        return ResponseEntity.ok().build();
    }
}
