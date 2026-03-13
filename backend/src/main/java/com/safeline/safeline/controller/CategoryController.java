package com.safeline.safeline.controller;

import com.safeline.safeline.dto.CategoryRequest;
import com.safeline.safeline.dto.CategoryResponse;
import com.safeline.safeline.model.Category;
import com.safeline.safeline.model.Tenant;
import com.safeline.safeline.repository.TenantRepository;
import com.safeline.safeline.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;
    private final TenantRepository tenantRepository;

    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getAll(
            @RequestHeader(value = "X-Tenant-Id", required = false) String domain) {
        
        Tenant tenant = tenantRepository.findByDomain(domain != null ? domain : "default")
                .orElseThrow(() -> new RuntimeException("Tenant not found"));
        
        return ResponseEntity.ok(categoryService.getCategories(tenant.getId()));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ORG_ADMIN')")
    public ResponseEntity<CategoryResponse> create(
            @RequestBody CategoryRequest request,
            @RequestHeader(value = "X-Tenant-Id", required = false) String domain) {

        Tenant tenant = tenantRepository.findByDomain(domain != null ? domain : "default")
                .orElseThrow(() -> new RuntimeException("Tenant not found"));

        return ResponseEntity.ok(categoryService.createCategory(request, tenant.getId()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ORG_ADMIN')")
    public ResponseEntity<CategoryResponse> update(
            @PathVariable Long id,
            @RequestBody CategoryRequest request) {
        
        return ResponseEntity.ok(categoryService.updateCategory(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ORG_ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }
}
