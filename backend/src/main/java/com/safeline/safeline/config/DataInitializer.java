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
        try {
            System.out.println("DEBUG: Attempting to remove stale unique constraint on roles table...");
            jdbcTemplate.execute("ALTER TABLE roles DROP CONSTRAINT IF EXISTS uk_ofx66keruapi6vyqpv6f2or37");
            System.out.println("DEBUG: Stale constraint removed successfully.");
        } catch (Exception e) {
            System.out.println("DEBUG: Constraint removal skipped or already removed");
        }
        
        try {
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS hierarchy_level VARCHAR(255) DEFAULT 'LEVEL_3'");
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS access_role VARCHAR(255) DEFAULT 'ROLE_1'");
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255)");
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id VARCHAR(255)");
        } catch (Exception e) {
            System.out.println("DEBUG: Column addition skipped or already present");
        }

        try {
            // Restore legacy roles if the tables still exist (which they do since Hibernate update doesn't drop tables)
            jdbcTemplate.execute("UPDATE users u SET hierarchy_level = 'LEVEL_1', access_role = 'ROLE_2' FROM user_roles ur, roles r WHERE u.id = ur.user_id AND ur.role_id = r.id AND r.name IN ('ROLE_ORG_ADMIN', 'ORG_ADMIN') AND u.hierarchy_level = 'LEVEL_3'");
            jdbcTemplate.execute("UPDATE users u SET hierarchy_level = 'LEVEL_2', access_role = 'ROLE_2' FROM user_roles ur, roles r WHERE u.id = ur.user_id AND ur.role_id = r.id AND r.name IN ('ROLE_INTAKE_OFFICER', 'INTAKE_OFFICER') AND u.hierarchy_level = 'LEVEL_3'");
            jdbcTemplate.execute("UPDATE users u SET hierarchy_level = 'SUPER_ADMIN', access_role = 'ROLE_2' FROM user_roles ur, roles r WHERE u.id = ur.user_id AND ur.role_id = r.id AND r.name IN ('ROLE_SUPER_ADMIN', 'SUPER_ADMIN') AND u.hierarchy_level = 'LEVEL_3'");
            
            // Hardcoded recovery for the primary tester 'shal' who is locked out
            jdbcTemplate.execute("UPDATE users SET hierarchy_level = 'LEVEL_1', access_role = 'ROLE_2' WHERE username = 'shal'");
            
            System.out.println("DEBUG: Legacy roles successfully mapped to new hierarchy levels.");
        } catch (Exception e) {
            System.out.println("DEBUG: Legacy role mapping skipped or tables missing: " + e.getMessage());
        }

        // 1. Default Tenant
        Tenant defaultTenant = tenantRepository.findByDomain("default")
                .orElseGet(() -> {
                    Tenant t = new Tenant();
                    t.setName("SafeLine Demo Corp");
                    t.setDomain("default");
                    return tenantRepository.save(t);
                });

        if (userRepository.findByUsername("admin").isEmpty()) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setEmail("admin@safeline.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setTenant(defaultTenant);
            admin.setHierarchyLevel("SUPER_ADMIN");
            admin.setAccessRole("ROLE_2");
            userRepository.save(admin);
        }

        try {
            jdbcTemplate.execute("UPDATE users SET full_name = 'Siva', employee_id = 'EMP-001', username = 'EMP-001' WHERE email = 'siva@gmail.com'");
            jdbcTemplate.execute("UPDATE users SET full_name = 'Shal', employee_id = 'EMP-002', username = 'EMP-002' WHERE email = 'shal7@gmail.com'");
            jdbcTemplate.execute("UPDATE users SET full_name = 'Tamil', employee_id = 'EMP-003' WHERE employee_id = 'EMP-003' OR (email = 'tamil@gmail.com' AND username = 'EMP-003')");
            jdbcTemplate.execute("UPDATE users SET full_name = 'Admin', employee_id = 'ADM-001' WHERE username = 'admin'");
            System.out.println("DEBUG: Successfully patched legacy test accounts with unique names.");
        } catch (Exception e) {
            System.out.println("DEBUG: Failed to patch legacy accounts: " + e.getMessage());
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
