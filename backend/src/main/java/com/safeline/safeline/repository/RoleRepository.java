package com.safeline.safeline.repository;

import com.safeline.safeline.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {
    java.util.List<Role> findByName(String name);
    List<Role> findByTenantId(Long tenantId);
    Optional<Role> findByNameAndTenantId(String name, Long tenantId);
}
