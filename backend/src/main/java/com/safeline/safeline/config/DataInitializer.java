package com.safeline.safeline.config;

import com.safeline.safeline.model.*;
import com.safeline.safeline.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final TenantRepository tenantRepository;
    private final CategoryRepository categoryRepository;
    private final SLAPolicyRepository slaPolicyRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // 1. Default Tenant
        Tenant defaultTenant = tenantRepository.findByDomain("default")
                .orElseGet(() -> {
                    Tenant t = new Tenant();
                    t.setName("SafeLine Demo Corp");
                    t.setDomain("default");
                    return tenantRepository.save(t);
                });

        // 2. Roles
        if (roleRepository.count() == 0) {
            createRole("SUPER_ADMIN", defaultTenant);
            createRole("ORG_ADMIN", defaultTenant);
            createRole("INTAKE_OFFICER", defaultTenant);
            createRole("INVESTIGATOR", defaultTenant);
            createRole("HR_MANAGER", defaultTenant);
            createRole("COMPLIANCE_OFFICER", defaultTenant);
            createRole("EXECUTIVE", defaultTenant);
            createRole("EMPLOYEE", defaultTenant);
        }

        if (userRepository.findByUsername("admin").isEmpty()) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setEmail("admin@safeline.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setTenant(defaultTenant);
            admin.setRoles(Set.of(roleRepository.findAll().stream().filter(r -> r.getName().equals("SUPER_ADMIN")).findFirst().get()));
            userRepository.save(admin);
        }

        // 3. Categories & SLA Policies for ALL tenants
        tenantRepository.findAll().forEach(tenant -> {
            if (categoryRepository.findByTenantId(tenant.getId()).isEmpty()) {
                saveCategoryWithSLA("Ethics & Compliance", "Bribery, corruption, fraud", tenant, 7);
                saveCategoryWithSLA("Safety & Hazard", "Unsafe working conditions", tenant, 3);
                saveCategoryWithSLA("Discrimination & Harassment", "Workplace misconduct", tenant, 5);
                saveCategoryWithSLA("General Grievance", "Miscellaneous issues", tenant, 14);
            }
        });
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

    private void createRole(String name, Tenant tenant) {
        Role role = new Role();
        role.setName(name);
        role.setTenant(tenant);
        roleRepository.save(role);
    }
}
