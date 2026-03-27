package com.safeline.safeline.repository;

import com.safeline.safeline.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByUsernameAndTenantId(String username, Long tenantId);
    Optional<User> findByEmail(String email);
    Optional<User> findByEmployeeIdAndTenantId(String employeeId, Long tenantId);

    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u WHERE (u.role IN ('ORG_ADMIN', 'ADMIN') OR size(u.committeePermissions) > 0) AND u.tenant.id = :tenantId")
    java.util.List<User> findPotentialInvestigatorsForTenant(Long tenantId);
    
    java.util.List<User> findByTenantId(Long tenantId);
    long countByRoleAndTenantId(String role, Long tenantId);
}
