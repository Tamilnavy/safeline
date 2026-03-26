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
import org.springframework.jdbc.core.JdbcTemplate;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final TenantRepository tenantRepository;
    private final CategoryRepository categoryRepository;
    private final SLAPolicyRepository slaPolicyRepository;
    private final UserRepository userRepository;
    private final SecurityLogRepository securityLogRepository;
    private final ComplaintRepository complaintRepository;
    private final ComplaintMessageRepository complaintMessageRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

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

        // 2. Default Super Admin
        if (userRepository.findByUsername("admin").isEmpty()) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setFullName("Admin User");
            admin.setEmployeeId("ADM-001");
            admin.setEmail("admin@safeline.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setTenant(defaultTenant);
            admin.setHierarchyLevel("SUPER_ADMIN");
            admin.setAccessRole("ROLE_2");
            userRepository.save(admin);
        }

        // 3. Categories and SLA Policies for ALL tenants
        tenantRepository.findAll().forEach(tenant -> {
            if (categoryRepository.findByTenantId(tenant.getId()).isEmpty()) {
                saveCategoryWithSLA("Ethics & Compliance", "Bribery, corruption, fraud", tenant, 7);
                saveCategoryWithSLA("Safety & Hazard", "Unsafe working conditions", tenant, 3);
                saveCategoryWithSLA("Discrimination & Harassment", "Workplace misconduct", tenant, 5);
                saveCategoryWithSLA("General Grievance", "Miscellaneous issues", tenant, 14);
            }
        });

        System.out.println("====== CURRENT USERS IN DB ======");
        userRepository.findAll().forEach(u -> {
            System.out.println("USER: " + u.getUsername() + 
                ", FULLNAME: " + u.getFullName() + 
                ", EMP_ID: " + u.getEmployeeId() + 
                ", HIER: " + u.getHierarchyLevel() + 
                ", ROLE: " + u.getAccessRole() + 
                ", EMAIL: " + u.getEmail());
        });
        System.out.println("================================");

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

    // Removed legacy createRole

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
