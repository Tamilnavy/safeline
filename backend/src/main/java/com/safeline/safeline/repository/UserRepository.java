package com.safeline.safeline.repository;

import com.safeline.safeline.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);

    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u JOIN u.roles r WHERE r.name IN :roleNames AND u.tenant.id = :tenantId")
    java.util.List<User> findByRoleNamesForTenant(java.util.List<String> roleNames, Long tenantId);
    
    java.util.List<User> findByTenantId(Long tenantId);
}
