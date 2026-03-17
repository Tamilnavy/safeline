package com.safeline.safeline.service;

import com.safeline.safeline.dto.PlatformMetricsDTO;
import com.safeline.safeline.dto.TenantCreateRequest;
import com.safeline.safeline.dto.TenantResponse;
import com.safeline.safeline.dto.UserResponse;
import com.safeline.safeline.model.Role;
import com.safeline.safeline.model.User;
import com.safeline.safeline.repository.*;
import com.safeline.safeline.model.Tenant;
import com.safeline.safeline.model.Category;
import com.safeline.safeline.model.SLAPolicy;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class TenantService {

    private final TenantRepository tenantRepository;
    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final SLAPolicyRepository slaPolicyRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final jakarta.persistence.EntityManager entityManager;

    // ------------------------------------------------
    // Get all tenants (mapped to Response with Admin details)
    // ------------------------------------------------
    public List<TenantResponse> getAllTenants() {
        return tenantRepository.findAll().stream()
                .map(this::mapToResponse)
                .toList();
    }

    private TenantResponse mapToResponse(Tenant tenant) {
        TenantResponse response = new TenantResponse();
        response.setId(tenant.getId());
        response.setName(tenant.getName());
        response.setDomain(tenant.getDomain());
        response.setActive(tenant.isActive());
        response.setCreatedAt(tenant.getCreatedAt());

        System.out.println("DEBUG: Mapping tenant: " + tenant.getName() + " (ID: " + tenant.getId() + ")");

        // Use a native query fallback to ensure we bypass any Hibernate filters for Super Admin view
        try {
            String sql = "SELECT u.username FROM users u JOIN user_roles ur ON u.id = ur.user_id " +
                         "JOIN roles r ON ur.role_id = r.id " +
                         "WHERE u.tenant_id = ?1 AND r.name = 'ORG_ADMIN' LIMIT 1";
            
            List<String> results = entityManager.createNativeQuery(sql)
                    .setParameter(1, tenant.getId())
                    .getResultList();

            if (!results.isEmpty()) {
                System.out.println("DEBUG: Found ORG_ADMIN: " + results.get(0));
                response.setAdminUsername(results.get(0));
            } else {
                System.out.println("DEBUG: No ORG_ADMIN found, trying fallback...");
                // Second fallback: any user for this tenant
                String sqlAny = "SELECT username FROM users WHERE tenant_id = ?1 LIMIT 1";
                List<String> anyResults = entityManager.createNativeQuery(sqlAny)
                        .setParameter(1, tenant.getId())
                        .getResultList();
                
                if (!anyResults.isEmpty()) {
                    System.out.println("DEBUG: Fallback found user: " + anyResults.get(0));
                    response.setAdminUsername(anyResults.get(0));
                } else {
                    System.out.println("DEBUG: No users found for tenant.");
                    response.setAdminUsername("System Managed");
                }
            }
        } catch (Exception e) {
            System.err.println("DEBUG ERROR: Admin lookup failed for tenant " + tenant.getId() + ": " + e.getMessage());
            e.printStackTrace();
            response.setAdminUsername("Data Error");
        }
        
        return response;
    }

    // ------------------------------------------------
    // Create tenant with initial Admin
    // ------------------------------------------------
    @Transactional
    public TenantResponse createTenantWithAdmin(TenantCreateRequest request) {
        // 1. Create Tenant
        Tenant tenant = new Tenant();
        tenant.setName(request.getName());
        tenant.setDomain(request.getDomain());
        Tenant savedTenant = tenantRepository.save(tenant);

        // 2. Seed default categories
        seedDefaultCategories(savedTenant);

        // 3. Create Admin User
        User admin = new User();
        admin.setUsername(request.getAdminUsername());
        admin.setEmail(request.getAdminEmail());
        admin.setPassword(passwordEncoder.encode(request.getAdminPassword()));
        admin.setTenant(savedTenant);

        Role adminRole = roleRepository.findByName("ORG_ADMIN")
                .orElseThrow(() -> new RuntimeException("Default Admin Role (ORG_ADMIN) not found"));
        admin.setRoles(Set.of(adminRole));
        userRepository.save(admin);

        // 4. Build Response
        TenantResponse response = new TenantResponse();
        response.setId(savedTenant.getId());
        response.setName(savedTenant.getName());
        response.setDomain(savedTenant.getDomain());
        response.setActive(savedTenant.isActive());
        response.setCreatedAt(savedTenant.getCreatedAt());
        response.setAdminUsername(admin.getUsername());
        response.setAdminEmail(admin.getEmail());

        return response;
    }

    // ------------------------------------------------
    // Create tenant (Old version - keep for now if needed, or deprecate)
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
    // Get tenant by id  S
    // ------------------------------------------------
    public Tenant getTenantById(Long id) {
        return tenantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tenant not found"));
    }

    // ------------------------------------------------
    // Update tenant   
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