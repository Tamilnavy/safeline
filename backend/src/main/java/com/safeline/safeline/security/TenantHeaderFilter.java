package com.safeline.safeline.security;

import com.safeline.safeline.model.Tenant;
import com.safeline.safeline.repository.TenantRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@RequiredArgsConstructor
public class TenantHeaderFilter extends OncePerRequestFilter {

    private final TenantRepository tenantRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String tenantDomain = request.getHeader("X-Tenant-Id");
        
        if (tenantDomain != null && !tenantDomain.isEmpty()) {
            Optional<Tenant> tenant = tenantRepository.findByDomain(tenantDomain);
            if (tenant.isPresent()) {
                TenantContext.setCurrentTenant(tenant.get().getId());
            } else if ("default".equals(tenantDomain)) {
                // Should be seeded, but fallback if needed
            }
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            // Only clear if the user is not authenticated yet.
            // If authenticated, JwtAuthFilter might have set it or will set it.
            // Actually, JwtAuthFilter runs AFTER this (since this is HIGHEST_PRECEDENCE),
            // but we clear it here to avoid leakage between non-auth requests.
            // The Security context will override it if needed.
            TenantContext.clear();
        }
    }
}
