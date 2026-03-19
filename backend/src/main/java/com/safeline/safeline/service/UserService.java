package com.safeline.safeline.service;

import com.safeline.safeline.dto.UserRequest;
import com.safeline.safeline.dto.UserResponse;
import com.safeline.safeline.model.Role;
import com.safeline.safeline.model.Tenant;
import com.safeline.safeline.model.User;
import com.safeline.safeline.repository.RoleRepository;
import com.safeline.safeline.repository.TenantRepository;
import com.safeline.safeline.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final TenantRepository tenantRepository;
    private final PasswordEncoder passwordEncoder;

    public UserResponse createUser(UserRequest request) {
        try {
            System.out.println("DEBUG: Starting createUser for username: " + request.getUsername());
            
            if (userRepository.findByUsername(request.getUsername()).isPresent()) {
                throw new RuntimeException("Username '" + request.getUsername() + "' already exists");
            }

            if (request.getEmail() != null && userRepository.findByEmail(request.getEmail()).isPresent()) {
                throw new RuntimeException("Email '" + request.getEmail() + "' is already in use");
            }

            User user = new User();
            user.setUsername(request.getUsername());
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            user.setEmail(request.getEmail());

            // Determine tenant context
            Long tenantId = request.getTenantId();
            System.out.println("DEBUG: Incoming request tenantId: " + tenantId);
            
            org.springframework.security.core.Authentication auth = 
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            
            if (auth != null && auth.isAuthenticated()) {
                System.out.println("DEBUG: Current Auth Principal: " + auth.getPrincipal());
                
                // ORG_ADMIN or INTAKE_OFFICER or any tenant staff should only create users in their own tenant
                boolean isTenantStaff = auth.getAuthorities().stream().anyMatch(a -> 
                    List.of("ORG_ADMIN", "INTAKE_OFFICER", "INVESTIGATOR").contains(a.getAuthority())
                );
                
                if (isTenantStaff) {
                    Object principal = auth.getPrincipal();
                    if (principal instanceof com.safeline.safeline.security.TenantAwareUserDetails) {
                        tenantId = ((com.safeline.safeline.security.TenantAwareUserDetails) principal).getTenantId();
                        System.out.println("DEBUG: Detected Tenant Staff, forcing tenantId: " + tenantId);
                    }
                }
            }

            if (tenantId == null) {
                System.out.println("CRITICAL: tenantId is NULL in createUser!");
                throw new RuntimeException("Required tenant context is missing");
            }

            final Long effectiveTenantId = tenantId;
            Tenant tenant = tenantRepository.findById(effectiveTenantId)
                    .orElseThrow(() -> new RuntimeException("Tenant not found with ID: " + effectiveTenantId));
            user.setTenant(tenant);

            System.out.println("DEBUG: Looking for role '" + request.getRoleName() + "' for tenant ID: " + effectiveTenantId);
            
            List<Role> roles = roleRepository.findByName(request.getRoleName());
            Role role = roles.stream()
                    .filter(r -> {
                        if (r.getTenant() == null) return true; // Global role
                        Long roleTenantId = r.getTenant().getId();
                        boolean isAllowed = roleTenantId.equals(effectiveTenantId) || "default".equals(r.getTenant().getDomain());
                        System.out.println("DEBUG: Role '" + r.getName() + "' (ID: " + r.getId() + ", TenantID: " + roleTenantId + ") check: " + isAllowed);
                        return isAllowed;
                    })
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Role '" + request.getRoleName() + "' is not available for this organization. (Found " + roles.size() + " total roles with this name)"));
            
            // NEW: Enforce 1-to-1 constraint for Custom Levels
            if (!java.util.List.of("ORG_ADMIN", "EMPLOYEE", "SUPER_ADMIN").contains(role.getName())) {
                boolean occupied = userRepository.isRoleOccupied(effectiveTenantId, role.getId());
                System.out.println("DEBUG: Role '" + role.getName() + "' (ID: " + role.getId() + ") occupancy check for Tenant " + effectiveTenantId + ": " + occupied);
                
                if (occupied) {
                    throw new RuntimeException("CRITICAL: This level (" + role.getName() + ") is already assigned to a team member in your organization. You cannot assign it to someone else.");
                }
            }

            user.setRoles(Set.of(role));
            User saved = userRepository.save(user);
            System.out.println("DEBUG: User '" + saved.getUsername() + "' saved with Role ID: " + role.getId());

            UserResponse response = new UserResponse();
            response.setId(saved.getId());
            response.setUsername(saved.getUsername());
            response.setEmail(saved.getEmail());
            response.setRole(role.getName());
            response.setTenantId(tenant.getId());

            return response;
        } catch (Exception e) {
            System.err.println("ERROR in createUser: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
}
