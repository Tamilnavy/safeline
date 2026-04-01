package com.safeline.safeline.repository;

import com.safeline.safeline.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    java.util.List<User> findByUsername(String username);
    java.util.List<User> findByUsernameIgnoreCase(String username);
    Optional<User> findByUsernameAndTenantId(String username, Long tenantId);
    Optional<User> findByUsernameIgnoreCaseAndTenantId(String username, Long tenantId);
    java.util.List<User> findByEmail(String email);
    Optional<User> findByEmailAndTenantId(String email, Long tenantId);
    Optional<User> findByEmployeeIdAndTenantId(String employeeId, Long tenantId);

    default User getAuthenticatedUser(String username) {
        Long tenantId = com.safeline.safeline.security.TenantContext.getCurrentTenant();
        if (tenantId != null) {
            return findByUsernameAndTenantId(username, tenantId).orElseThrow(() -> new RuntimeException("User not found: " + username));
        }
        java.util.List<User> users = findByUsername(username);
        if (users.isEmpty()) throw new RuntimeException("User not found: " + username);
        return users.stream().filter(u -> u.getTenant() == null).findFirst()
                .orElseThrow(() -> new RuntimeException("Ambiguous user without tenant context: " + username));
    }

    @org.springframework.data.jpa.repository.Query(
        value = "SELECT DISTINCT u.* FROM users u " +
                "LEFT JOIN user_permissions up ON up.user_id = u.id " +
                "WHERE u.tenant_id = :tenantId " +
                "AND (u.role IN ('ORG_ADMIN', 'ADMIN') OR up.permission IS NOT NULL)",
        nativeQuery = true)
    java.util.List<User> findPotentialInvestigatorsForTenant(@org.springframework.data.repository.query.Param("tenantId") Long tenantId);
    
    java.util.List<User> findByTenantId(Long tenantId);
    long countByRoleAndTenantId(String role, Long tenantId);
}
