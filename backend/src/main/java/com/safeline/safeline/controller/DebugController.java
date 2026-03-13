package com.safeline.safeline.controller;

import com.safeline.safeline.model.Role;
import com.safeline.safeline.model.Tenant;
import com.safeline.safeline.repository.RoleRepository;
import com.safeline.safeline.repository.TenantRepository;
import com.safeline.safeline.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/debug")
@RequiredArgsConstructor
public class DebugController {

    private final TenantRepository tenantRepository;
    private final RoleRepository roleRepository;

    @GetMapping("/context")
    public Map<String, Object> getDebugInfo() {
        Map<String, Object> info = new HashMap<>();
        
        // 1. Context Info
        info.put("currentTenantId", TenantContext.getCurrentTenant());
        
        // 2. Auth Info
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            info.put("authPrincipalClass", auth.getPrincipal().getClass().getName());
            info.put("authPrincipal", auth.getPrincipal().toString());
            info.put("authorities", auth.getAuthorities().stream().map(a -> a.getAuthority()).collect(Collectors.toList()));
        } else {
            info.put("auth", "NULL");
        }
        
        // 3. Database Info
        info.put("tenants", tenantRepository.findAll().stream().map(t -> t.getId() + ":" + t.getDomain()).collect(Collectors.toList()));
        info.put("roles", roleRepository.findAll().stream().map(r -> r.getName() + " (Tenant: " + (r.getTenant() != null ? r.getTenant().getDomain() : "NULL") + ")").collect(Collectors.toList()));
        
        return info;
    }
}
