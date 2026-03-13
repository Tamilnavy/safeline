package com.safeline.safeline.service;

import com.safeline.safeline.dto.CategoryRequest;
import com.safeline.safeline.dto.CategoryResponse;
import com.safeline.safeline.model.Category;
import com.safeline.safeline.model.SLAPolicy;
import com.safeline.safeline.model.Tenant;
import com.safeline.safeline.repository.CategoryRepository;
import com.safeline.safeline.repository.SLAPolicyRepository;
import com.safeline.safeline.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final SLAPolicyRepository slaPolicyRepository;
    private final TenantRepository tenantRepository;

    public List<CategoryResponse> getCategories(Long tenantId) {
        List<Category> categories = categoryRepository.findByTenantId(tenantId);
        return categories.stream().map(this::mapToResponse).toList();
    }

    private CategoryResponse mapToResponse(Category category) {
        CategoryResponse response = new CategoryResponse();
        response.setId(category.getId());
        response.setName(category.getName());
        response.setDescription(category.getDescription());
        
        slaPolicyRepository.findByCategoryId(category.getId())
                .ifPresent(p -> response.setSlaDays(p.getResolutionTimeDays()));
        
        return response;
    }

    @Transactional
    public CategoryResponse createCategory(CategoryRequest request, Long tenantId) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Tenant not found"));

        Category category = new Category();
        category.setName(request.getName());
        category.setDescription(request.getDescription());
        category.setTenant(tenant);

        Category savedCategory = categoryRepository.save(category);

        // Create associated SLA Policy
        SLAPolicy policy = new SLAPolicy();
        policy.setCategory(savedCategory);
        policy.setResolutionTimeDays(request.getSlaDays() > 0 ? request.getSlaDays() : 2);
        policy.setTenant(tenant);
        slaPolicyRepository.save(policy);

        return mapToResponse(savedCategory);
    }

    @Transactional
    public CategoryResponse updateCategory(Long id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        category.setName(request.getName());
        category.setDescription(request.getDescription());
        
        Category updated = categoryRepository.save(category);

        // Update SLA Policy
        SLAPolicy policy = slaPolicyRepository.findByCategoryId(id)
                .orElse(new SLAPolicy());
        
        if (policy.getId() == null) {
            policy.setCategory(updated);
            policy.setTenant(updated.getTenant());
        }
        
        policy.setResolutionTimeDays(request.getSlaDays());
        slaPolicyRepository.save(policy);

        return mapToResponse(updated);
    }

    public void deleteCategory(Long id) {
        categoryRepository.deleteById(id);
    }
}
