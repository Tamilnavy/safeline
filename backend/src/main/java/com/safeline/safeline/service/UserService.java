package com.safeline.safeline.service;

import com.safeline.safeline.dto.UserRequest;
import com.safeline.safeline.dto.UserResponse;
import com.safeline.safeline.model.Tenant;
import com.safeline.safeline.model.User;
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
    private final TenantRepository tenantRepository;
    private final PasswordEncoder passwordEncoder;

    private String normalizeEmployeeId(String id) {
        if (id == null) return null;
        id = id.trim().toUpperCase();
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("(?<!\\d)(\\d+)(?!\\d)").matcher(id);
        StringBuilder sb = new StringBuilder();
        while (m.find()) {
            String num = m.group(1);
            if (num.length() == 1) {
                num = "00" + num;
            } else if (num.length() == 2) {
                num = "0" + num;
            }
            m.appendReplacement(sb, num);
        }
        m.appendTail(sb);
        return sb.toString();
    }

    public UserResponse createUser(UserRequest request) {
        try {
            if (request.getEmployeeId() == null || request.getEmployeeId().isEmpty()) {
                throw new IllegalArgumentException("Employee ID is required");
            }
            // Normalize employee ID to prevent logical duplicates like EMP-001 and EMP-1
            String normalizedId = normalizeEmployeeId(request.getEmployeeId());
            request.setEmployeeId(normalizedId);

            if (request.getEmail() != null && userRepository.findByEmail(request.getEmail()).isPresent()) {
                throw new IllegalArgumentException("Email '" + request.getEmail() + "' is already in use");
            }

            User user = new User();
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            user.setEmail(request.getEmail());
            user.setFullName(request.getFullName());
            user.setEmployeeId(request.getEmployeeId());

            // Determine tenant context
            Long tenantId = request.getTenantId();
            System.out.println("DEBUG: Incoming request tenantId: " + tenantId);
            
            org.springframework.security.core.Authentication auth = 
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            
            if (auth != null && auth.isAuthenticated()) {
                System.out.println("DEBUG: Current Auth Principal: " + auth.getPrincipal());
                
                // ORG_ADMIN or ADMIN or any tenant staff should only create users in their own tenant
                boolean isTenantStaff = auth.getAuthorities().stream().anyMatch(a -> 
                    List.of("ORG_ADMIN", "ADMIN", "EMPLOYEE").contains(a.getAuthority())
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
                throw new IllegalArgumentException("Required tenant context is missing");
            }

            final Long effectiveTenantId = tenantId;

            // Validate Employee ID uniqueness within Tenant
            if (userRepository.findByEmployeeIdAndTenantId(request.getEmployeeId(), effectiveTenantId).isPresent()) {
                throw new IllegalArgumentException("Employee ID '" + request.getEmployeeId() + "' already exists in this organization.");
            }

            // Map employee ID securely to the unique Login Handle (username)
            String loginHandle = request.getEmployeeId();
            if (userRepository.findByUsername(loginHandle).isPresent()) {
                throw new IllegalArgumentException("Employee ID '" + request.getEmployeeId() + "' is already registered globally.");
            }
            user.setUsername(loginHandle);

            Tenant tenant = tenantRepository.findById(effectiveTenantId)
                    .orElseThrow(() -> new IllegalArgumentException("Tenant not found with ID: " + effectiveTenantId));
            user.setTenant(tenant);

            user.setRole(request.getRole() != null ? request.getRole() : "EMPLOYEE");
            user.setCommitteePermissions(request.getCommitteePermissions());
            
            User saved = userRepository.save(user);
            System.out.println("DEBUG: User '" + saved.getUsername() + "' saved with Role: " + saved.getRole());

            UserResponse response = new UserResponse();
            response.setId(saved.getId());
            response.setUsername(saved.getUsername());
            response.setFullName(saved.getFullName());
            response.setEmployeeId(saved.getEmployeeId());
            response.setEmail(saved.getEmail());
            response.setRole(saved.getRole());
            response.setTenantId(tenant.getId());
            response.setCommitteePermissions(saved.getCommitteePermissions());

            return response;
        } catch (Exception e) {
            System.err.println("ERROR in createUser: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
}
