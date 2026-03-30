package com.safeline.safeline.controller;

import com.safeline.safeline.model.*;
import com.safeline.safeline.repository.*;
import com.safeline.safeline.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/complaints")
@RequiredArgsConstructor
public class ComplaintAdminController {

    private final ComplaintQueryService complaintQueryService;
    private final TenantRepository tenantRepository;

    @GetMapping("/metrics")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ORG_ADMIN', 'ADMIN')")
    public ResponseEntity<Map<String, Long>> getMetrics(
            @RequestHeader(value = "X-Tenant-Id", required = false) String domain,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.safeline.safeline.security.TenantAwareUserDetails principal) {
        Long tenantId = (domain != null && !"default".equalsIgnoreCase(domain)) 
                ? tenantRepository.findByDomain(domain).map(Tenant::getId).orElse(principal != null ? principal.getTenantId() : null)
                : (principal != null ? principal.getTenantId() : null);
        if (tenantId == null) return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(complaintQueryService.getMetricsForTenant(tenantId));
    }
}
