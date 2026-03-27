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
import java.util.HashSet;
import org.springframework.jdbc.core.JdbcTemplate;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final TenantRepository tenantRepository;
    private final CategoryRepository categoryRepository;
    private final SLAPolicyRepository slaPolicyRepository;
    private final UserRepository userRepository;
    private final SecurityLogRepository securityLogRepository;
    private final ComplaintMessageRepository complaintMessageRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        // Ensure database schema is up to date (Migration for missing columns)
        try {
            System.out.println("DEBUG: Running pre-startup schema checks...");
            // Users table
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(255) DEFAULT 'EMPLOYEE'");
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id VARCHAR(255)");
            
            // Fix legacy NOT NULL constraints that block startup
            try {
                jdbcTemplate.execute("ALTER TABLE users ALTER COLUMN access_role DROP NOT NULL");
            } catch (Exception e) {
                // Ignore if column doesn't exist
            }
            
            // Complaints table
            jdbcTemplate.execute("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS type VARCHAR(255) DEFAULT 'NORMAL'");
            jdbcTemplate.execute("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS accused_user_id BIGINT");
            jdbcTemplate.execute("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS assigned_to_id BIGINT");
            jdbcTemplate.execute("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS anonymous_id VARCHAR(255)");
            System.out.println("DEBUG: Schema checks complete.");
        } catch (Exception e) {
            System.err.println("WARNING: Schema migration failed: " + e.getMessage());
        }

        // 1. Default Tenant
        Tenant defaultTenant = tenantRepository.findByDomain("default")
                .orElseGet(() -> {
                    Tenant t = new Tenant();
                    t.setName("SafeLine Demo Corp");
                    t.setDomain("default");
                    return tenantRepository.save(t);
                });

        // 2. Local Organization Tenant (shal)
        Tenant shalTenant = tenantRepository.findByDomain("shal")
                .orElseGet(() -> {
                    Tenant t = new Tenant();
                    t.setName("Shal International Group");
                    t.setDomain("shal");
                    return tenantRepository.save(t);
                });

        // 3. Create Required System Bootstrap Admin
        createTestUser("admin", "Admin User", "ADM-001", "admin@safeline.com", "admin123", defaultTenant, "SUPER_ADMIN", Set.of());
        
        // Removed legacy test users (Sara, John, etc.) as requested by user.
        
        // 4. Categories and SLA Policies (Required for system functionality)
        tenantRepository.findAll().forEach(tenant -> {
            if (categoryRepository.findByTenantId(tenant.getId()).isEmpty()) {
                saveCategoryWithSLA("Ethics & Compliance", "Bribery, corruption, fraud", tenant, 7);
                saveCategoryWithSLA("Safety & Hazard", "Unsafe working conditions", tenant, 3);
                saveCategoryWithSLA("Discrimination & Harassment", "Workplace misconduct", tenant, 5);
                saveCategoryWithSLA("General Grievance", "Miscellaneous issues", tenant, 14);
            }
        });

        // Removed Sample Complaint generation (TRK-SHAL-789, TRK-SENS-123)
        
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

    private void createTestUser(String username, String fullName, String empId, String email, String password, Tenant tenant, String role, Set<CommitteePermission> perms) {
        User user = userRepository.findByUsername(username).orElseGet(() -> {
            User u = new User();
            u.setUsername(username);
            u.setPassword(passwordEncoder.encode(password));
            return u;
        });

        user.setFullName(fullName);
        user.setEmployeeId(empId);
        user.setEmail(email);
        user.setTenant(tenant);
        user.setRole(role);
        user.setEnabled(true);
        user.setCommitteePermissions(new HashSet<>(perms));
        userRepository.save(user);
        System.out.println("DEBUG: Synced User: " + username + " with role: " + role + " and perms: " + perms);
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
