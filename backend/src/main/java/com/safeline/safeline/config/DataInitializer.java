package com.safeline.safeline.config;

import com.safeline.safeline.model.*;
import com.safeline.safeline.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final TenantRepository tenantRepository;
    private final CategoryRepository categoryRepository;
    private final SLAPolicyRepository slaPolicyRepository;
    private final UserRepository userRepository;
    private final SecurityLogRepository securityLogRepository;
    private final ComplaintRepository complaintRepository;
    private final ComplaintMessageRepository complaintMessageRepository;
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
        // 2. Roles for default tenant
        List.of("SUPER_ADMIN", "ORG_ADMIN", "EMPLOYEE")
            .forEach(name -> {
                if (roleRepository.findByNameAndTenantId(name, defaultTenant.getId()).isEmpty()) {
                    createRole(name, defaultTenant);
                }
            });

        if (userRepository.findByUsername("admin").isEmpty()) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setEmail("admin@safeline.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setTenant(defaultTenant);
            Role superAdmin = roleRepository.findByNameAndTenantId("SUPER_ADMIN", defaultTenant.getId())
                    .orElseThrow(() -> new RuntimeException("SUPER_ADMIN role not found"));
            admin.setRoles(Set.of(superAdmin));
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

        System.out.println("DEBUG: DATA INITIALIZATION COMPLETE.");
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

    private void createSecurityLog(String event, String user, String ip, String type, String severity, Tenant tenant, LocalDateTime time) {
        SecurityLog log = new SecurityLog();
        log.setEvent(event);
        log.setUsername(user);
        log.setIpAddress(ip);
        log.setType(type);
        log.setSeverity(severity);
        log.setTenant(tenant);
        log.setTimestamp(time);
        securityLogRepository.save(log);
    }

    private void createMessage(String content, String role, Complaint complaint, User sender) {
        ComplaintMessage msg = new ComplaintMessage();
        msg.setContent(content);
        msg.setSenderRole(role);
        msg.setComplaint(complaint);
        msg.setSender(sender);
        msg.setCreatedAt(LocalDateTime.now().minusHours(2));
        complaintMessageRepository.save(msg);
    }
}
