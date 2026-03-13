package com.safeline.safeline.config;

import com.safeline.safeline.security.TenantContext;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.hibernate.Session;
import org.springframework.stereotype.Component;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@Aspect
@Component
public class TenantFilterAspect {

    @PersistenceContext
    private EntityManager entityManager;

    @Around("execution(* com.safeline.safeline.repository.*.*(..))")
    public Object enableTenantFilter(ProceedingJoinPoint joinPoint) throws Throwable {
        Long tenantId = TenantContext.getCurrentTenant();
        System.out.println("DEBUG: TenantFilterAspect - Active Tenant ID: " + tenantId);

        org.springframework.security.core.Authentication auth =
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();

        boolean isSuperAdmin = auth != null && auth.isAuthenticated()
                && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("SUPER_ADMIN"));

        // KEY FIX: Do NOT apply tenant filter when:
        // 1. No authenticated user yet (during login) — auth is null or anonymous
        // 2. User is SUPER_ADMIN (needs to see all tenants)
        // 3. No tenantId context set
        boolean isAuthenticated = auth != null
                && auth.isAuthenticated()
                && !(auth instanceof org.springframework.security.authentication.AnonymousAuthenticationToken);

        Session session = entityManager.unwrap(Session.class);

        if (isAuthenticated && !isSuperAdmin && tenantId != null) {
            session.enableFilter("tenantFilter").setParameter("tenantId", tenantId);
        } else {
            session.disableFilter("tenantFilter");
        }

        return joinPoint.proceed();
    }
}
