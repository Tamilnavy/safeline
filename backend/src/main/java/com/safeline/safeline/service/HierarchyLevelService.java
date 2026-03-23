package com.safeline.safeline.service;

import com.safeline.safeline.model.HierarchyLevel;
import com.safeline.safeline.model.Tenant;
import com.safeline.safeline.repository.HierarchyLevelRepository;
import com.safeline.safeline.repository.TenantRepository;
import com.safeline.safeline.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class HierarchyLevelService {

    private final HierarchyLevelRepository hierarchyLevelRepository;
    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;

    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;

    @Transactional
    public List<HierarchyLevel> getLevelsForTenant(Long tenantId) {
        // 1. FETCH current levels (legacy migration and cleanup now handled at startup)
        List<HierarchyLevel> levels = hierarchyLevelRepository.findAllByTenantIdOrderByOrderIndexAsc(tenantId);
        
        // Ensure core defaults exist independently
        boolean hasAdmin = levels.stream().anyMatch(l -> "LEVEL_1".equals(l.getTechnicalId()));
        boolean hasHR = levels.stream().anyMatch(l -> "LEVEL_2".equals(l.getTechnicalId()));
        boolean hasEmployee = levels.stream().anyMatch(l -> "LEVEL_3".equals(l.getTechnicalId()));

        if (!hasAdmin || !hasHR || !hasEmployee) {
            seedMissingDefaults(tenantId, hasAdmin, hasHR, hasEmployee);
            levels = hierarchyLevelRepository.findAllByTenantIdOrderByOrderIndexAsc(tenantId);
        }
        
        // Orphan Adoption: Find any level IDs used by users that aren't in our level table
        List<String> usedLevelIds = userRepository.findUniqueHierarchyLevelsForTenant(tenantId);
        List<String> existingLevelIds = levels.stream().map(HierarchyLevel::getTechnicalId).toList();
        
        boolean added = false;
        for (String usedId : usedLevelIds) {
            if (usedId != null && !existingLevelIds.contains(usedId)) {
                // If it's a legacy EL_ ID that somehow survived, skip adoption (it should have been migrated)
                if (usedId.startsWith("EL_")) continue;

                // Adopt this orphan
                HierarchyLevel adopted = HierarchyLevel.builder()
                        .technicalId(usedId)
                        .name("Recovered Level (" + usedId.substring(Math.max(0, usedId.length() - 4)) + ")")
                        .orderIndex(levels.size())
                        .isDefault(false)
                        .tenant(tenantRepository.findById(tenantId).orElseThrow())
                        .build();
                hierarchyLevelRepository.save(adopted);
                levels.add(adopted);
                added = true;
            }
        }
        
        return added ? hierarchyLevelRepository.findAllByTenantIdOrderByOrderIndexAsc(tenantId) : levels;
    }

    @Transactional
    public void seedMissingDefaults(Long tenantId, boolean hasAdmin, boolean hasHR, boolean hasEmployee) {
        Tenant tenant = tenantRepository.findById(tenantId).orElseThrow();
        
        if (!hasAdmin && hierarchyLevelRepository.findFirstByTenantIdAndTechnicalId(tenantId, "LEVEL_1").isEmpty()) {
            hierarchyLevelRepository.save(HierarchyLevel.builder()
                    .technicalId("LEVEL_1")
                    .name("Admin")
                    .orderIndex(0)
                    .isDefault(true)
                    .tenant(tenant)
                    .build());
        }

        if (!hasHR && hierarchyLevelRepository.findFirstByTenantIdAndTechnicalId(tenantId, "LEVEL_2").isEmpty()) {
            hierarchyLevelRepository.save(HierarchyLevel.builder()
                    .technicalId("LEVEL_2")
                    .name("HR/Management")
                    .orderIndex(1)
                    .isDefault(true)
                    .tenant(tenant)
                    .build());
        }

        if (!hasEmployee && hierarchyLevelRepository.findFirstByTenantIdAndTechnicalId(tenantId, "LEVEL_3").isEmpty()) {
            hierarchyLevelRepository.save(HierarchyLevel.builder()
                    .technicalId("LEVEL_3")
                    .name("Employee")
                    .orderIndex(2)
                    .isDefault(true)
                    .tenant(tenant)
                    .build());
        }
    }

    @Transactional
    public List<HierarchyLevel> seedDefaultLevels(Long tenantId) {
        seedMissingDefaults(tenantId, false, false, false);
        return hierarchyLevelRepository.findAllByTenantIdOrderByOrderIndexAsc(tenantId);
    }

    @Transactional
    public HierarchyLevel addLevel(Long tenantId, String name, String technicalId) {
        Tenant tenant = tenantRepository.findById(tenantId).orElseThrow();
        List<HierarchyLevel> existing = hierarchyLevelRepository.findAllByTenantIdOrderByOrderIndexAsc(tenantId);
        
        String idToUse = (technicalId != null && !technicalId.isBlank()) 
                ? technicalId 
                : "LEVEL_" + UUID.randomUUID().toString().substring(0, 8);

        HierarchyLevel newLevel = HierarchyLevel.builder()
                .technicalId(idToUse)
                .name(name)
                .orderIndex(existing.size())
                .isDefault(false)
                .tenant(tenant)
                .build();

        return hierarchyLevelRepository.save(newLevel);
    }

    @Transactional
    public HierarchyLevel updateLevel(Long tenantId, Long id, String name) {
        HierarchyLevel level = hierarchyLevelRepository.findById(id).orElseThrow();
        if (!level.getTenant().getId().equals(tenantId)) throw new RuntimeException("Unauthorized");
        if (level.isDefault()) throw new RuntimeException("Cannot rename default levels from Backend");
        
        level.setName(name);
        return hierarchyLevelRepository.save(level);
    }

    @Transactional
    public void deleteLevel(Long tenantId, Long id) {
        HierarchyLevel level = hierarchyLevelRepository.findById(id).orElseThrow();
        if (!level.getTenant().getId().equals(tenantId)) throw new RuntimeException("Unauthorized");
        if (level.isDefault()) throw new RuntimeException("Cannot delete default levels");
        
        // Safety check: Are any users assigned to this level?
        // Note: Using hierarchyLevel as a string in User entity
        long count = userRepository.countByHierarchyLevelAndTenantId(level.getTechnicalId(), tenantId);
        if (count > 0) {
            throw new RuntimeException("Cannot delete level: " + count + " employees are still assigned to it.");
        }

        hierarchyLevelRepository.delete(level);
    }
}
