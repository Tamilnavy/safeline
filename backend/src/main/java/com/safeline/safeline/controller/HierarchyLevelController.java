package com.safeline.safeline.controller;

import com.safeline.safeline.model.HierarchyLevel;
import com.safeline.safeline.security.TenantAwareUserDetails;
import com.safeline.safeline.service.HierarchyLevelService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/levels")
@RequiredArgsConstructor
public class HierarchyLevelController {

    private final HierarchyLevelService hierarchyLevelService;

    @GetMapping
    public ResponseEntity<List<HierarchyLevel>> getLevels(@AuthenticationPrincipal TenantAwareUserDetails principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(hierarchyLevelService.getLevelsForTenant(principal.getTenantId()));
    }

    @Data
    public static class LevelRequest {
        private String name;
        private String technicalId;
    }

    @PostMapping
    @PreAuthorize("hasAuthority('LEVEL_1')")
    public ResponseEntity<HierarchyLevel> addLevel(@AuthenticationPrincipal TenantAwareUserDetails principal, @RequestBody LevelRequest request) {
        return ResponseEntity.ok(hierarchyLevelService.addLevel(principal.getTenantId(), request.getName(), request.getTechnicalId()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('LEVEL_1')")
    public ResponseEntity<HierarchyLevel> updateLevel(@AuthenticationPrincipal TenantAwareUserDetails principal, @PathVariable Long id, @RequestBody LevelRequest request) {
        return ResponseEntity.ok(hierarchyLevelService.updateLevel(principal.getTenantId(), id, request.getName()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('LEVEL_1')")
    public ResponseEntity<Void> deleteLevel(@AuthenticationPrincipal TenantAwareUserDetails principal, @PathVariable Long id) {
        hierarchyLevelService.deleteLevel(principal.getTenantId(), id);
        return ResponseEntity.noContent().build();
    }
}
