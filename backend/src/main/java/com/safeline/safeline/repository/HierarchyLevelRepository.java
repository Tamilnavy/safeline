package com.safeline.safeline.repository;

import com.safeline.safeline.model.HierarchyLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface HierarchyLevelRepository extends JpaRepository<HierarchyLevel, Long> {
    List<HierarchyLevel> findAllByTenantIdOrderByOrderIndexAsc(Long tenantId);
    Optional<HierarchyLevel> findFirstByTenantIdAndTechnicalId(Long tenantId, String technicalId);
}
