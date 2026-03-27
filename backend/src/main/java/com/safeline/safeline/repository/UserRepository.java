package com.safeline.safeline.repository;

import com.safeline.safeline.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByUsernameIgnoreCase(String username);
    Optional<User> findByUsernameAndTenantId(String username, Long tenantId);
    Optional<User> findByUsernameIgnoreCaseAndTenantId(String username, Long tenantId);
    Optional<User> findByEmail(String email);
    Optional<User> findByEmployeeIdAndTenantId(String employeeId, Long tenantId);

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
