package com.safeline.safeline.repository;

import com.safeline.safeline.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByEmployeeIdAndTenantId(String employeeId, Long tenantId);

    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u WHERE (u.hierarchyLevel <> 'LEVEL_3' OR u.accessRole = 'ROLE_2') AND u.tenant.id = :tenantId")
    java.util.List<User> findPotentialInvestigatorsForTenant(Long tenantId);
    
    java.util.List<User> findByTenantId(Long tenantId);
    long countByHierarchyLevelAndTenantId(String hierarchyLevel, Long tenantId);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT u.hierarchyLevel FROM User u WHERE u.tenant.id = :tenantId")
    java.util.List<String> findUniqueHierarchyLevelsForTenant(@org.springframework.data.repository.query.Param("tenantId") Long tenantId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE User u SET u.hierarchyLevel = :newId WHERE u.tenant.id = :tenantId AND u.hierarchyLevel = :oldId")
    int migrateLegacyLevelIds(@org.springframework.data.repository.query.Param("tenantId") Long tenantId, @org.springframework.data.repository.query.Param("oldId") String oldId, @org.springframework.data.repository.query.Param("newId") String newId);
}
