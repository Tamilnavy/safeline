package com.safeline.safeline.service;

import com.safeline.safeline.dto.PlatformMetricsDTO;
import com.safeline.safeline.repository.ComplaintRepository;
import com.safeline.safeline.repository.TenantRepository;
import com.safeline.safeline.repository.UserRepository;
import com.safeline.safeline.repository.CategoryRepository;
import com.safeline.safeline.repository.SLAPolicyRepository;
import com.safeline.safeline.model.Tenant;
import com.safeline.safeline.model.Category;
import com.safeline.safeline.model.SLAPolicy;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TenantService {

    private final TenantRepository tenantRepository;
    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final SLAPolicyRepository slaPolicyRepository;

    // ------------------------------------------------
    // Get all tenants
    // ------------------------------------------------
    public List<Tenant> getAllTenants() {
        return tenantRepository.findAll();
    }

    // ------------------------------------------------
    // Create tenant
    // ------------------------------------------------
    public Tenant createTenant(Tenant tenant) {
        Tenant savedTenant = tenantRepository.save(tenant);
        
        // Auto-seed default categories for the new tenant
        seedDefaultCategories(savedTenant);
        
        return savedTenant;
    }

    private void seedDefaultCategories(Tenant tenant) {
        saveCategoryWithSLA("Ethics & Compliance", "Bribery, corruption, fraud", tenant, 7);
        saveCategoryWithSLA("Safety & Hazard", "Unsafe working conditions", tenant, 3);
        saveCategoryWithSLA("Discrimination & Harassment", "Workplace misconduct", tenant, 5);
        saveCategoryWithSLA("General Grievance", "Miscellaneous issues", tenant, 14);
    }

    private void saveCategoryWithSLA(String name, String desc, Tenant tenant, int slaDays) {
        Category cat = new Category();
        cat.setName(name);
        cat.setDescription(desc);
        cat.setTenant(tenant);
        Category saved = categoryRepository.save(cat);

        SLAPolicy policy = new SLAPolicy();
        policy.setCategory(saved);
        policy.setResolutionTimeDays(slaDays);
        policy.setTenant(tenant);
        slaPolicyRepository.save(policy);
    }

    // ------------------------------------------------
    // Delete tenant
    // ------------------------------------------------
    public void deleteTenant(Long id) {
        tenantRepository.deleteById(id);
    }

    // ------------------------------------------------
    // Find tenant by domain
    // ------------------------------------------------
    public Tenant findByDomain(String domain) {
        return tenantRepository.findByDomain(domain)
                .orElseThrow(() -> new RuntimeException("Tenant not found"));
    }

    // ------------------------------------------------
    // Get tenant by id  ⭐ ADD THIS
    // ------------------------------------------------
    public Tenant getTenantById(Long id) {
        return tenantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tenant not found"));
    }

    // ------------------------------------------------
    // Update tenant  ⭐ ADD THIS
    // ------------------------------------------------
    public Tenant updateTenant(Long id, Tenant tenantDetails) {

        Tenant tenant = tenantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tenant not found"));

        tenant.setName(tenantDetails.getName());
        tenant.setDomain(tenantDetails.getDomain());

        return tenantRepository.save(tenant);
    }

    // ------------------------------------------------
    // Platform metrics
    // ------------------------------------------------
    public PlatformMetricsDTO getPlatformMetrics() {
        return PlatformMetricsDTO.builder()
                .totalTenants(tenantRepository.count())
                .totalComplaints(complaintRepository.count())
                .totalUsers(userRepository.count())
                .activeOrganizations(tenantRepository.count())
                .build();
    }
}