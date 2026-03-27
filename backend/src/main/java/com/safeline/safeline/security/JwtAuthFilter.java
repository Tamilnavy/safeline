package com.safeline.safeline.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String username;

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            jwt = authHeader.substring(7);
            username = jwtUtils.extractUsername(jwt);

            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                
                // 1. Check if it's an Anonymous Reporter Token
                Claims claims = jwtUtils.extractAllClaims(jwt);
                String role = (String) claims.get("role");
                Long tenantId = claims.get("tenantId") != null ? ((Number) claims.get("tenantId")).longValue() : null;

                if ("ANONYMOUS_REPORTER".equals(role)) {
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            username, // trackingId
                            null,
                            java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ANONYMOUS_REPORTER"))
                    );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    
                    if (tenantId != null) {
                        TenantContext.setCurrentTenant(tenantId);
                    }
                    System.out.println("DEBUG: Authenticated Anonymous Reporter: " + username + ", Tenant: " + tenantId);
                } else {
                    // 2. Regular User Token
                    UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);
                    if (jwtUtils.isTokenValid(jwt, userDetails)) {
                        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );
                        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authToken);
                        
                        if (userDetails instanceof TenantAwareUserDetails) {
                            Long userTenantId = ((TenantAwareUserDetails) userDetails).getTenantId();
                            TenantContext.setCurrentTenant(userTenantId);
                            System.out.println("DEBUG: Authenticated Regular User: " + username + ", Tenant: " + userTenantId);
                        } else {
                            System.err.println("DEBUG WARNING: Authenticated user " + username + " is NOT TenantAware!");
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("DEBUG: Invalid JWT token skipped: " + e.getMessage());
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }
}
