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

        // 2. Local Organization Tenant (shal)
        Tenant shalTenant = tenantRepository.findByDomain("shal")
                .orElseGet(() -> {
                    Tenant t = new Tenant();
                    t.setName("Shal International Group");
                    t.setDomain("shal");
                    return tenantRepository.save(t);
                });

        // 3. Create Required Test Users
        createTestUser("admin", "Admin User", "ADM-001", "admin@safeline.com", "admin123", defaultTenant, "SUPER_ADMIN", Set.of());
        
        // Org Admin for Shal (Can manage users, but CANNOT see cases)
        createTestUser("shal", "Shal Org Admin", "SHAL-ADM", "shal@shal.com", "123456", shalTenant, "ORG_ADMIN", Set.of());
        
        // Committee Lead for Shal (Can see cases, triage, and assign)
        createTestUser("EMP001", "James - Committee Lead", "EMP001", "emp001@shal.com", "123456", shalTenant, "EMPLOYEE", Set.of(CommitteePermission.COMMITTEE_LEAD));
        
        // Standard Employee for Shal
        createTestUser("EMP002", "John Doe - Employee", "EMP002", "emp002@shal.com", "123456", shalTenant, "EMPLOYEE", Set.of());
        
        // Complaint Handler for Shal (Assigned cases only)
        createTestUser("EMP003", "Sara - Handler", "EMP003", "emp003@shal.com", "123456", shalTenant, "EMPLOYEE", Set.of(CommitteePermission.COMPLAINT_HANDLER));

        // Escalation Head for Shal (Can see SENSITIVE complaints)
        createTestUser("EMP004", "Michael - Escalation Head", "EMP004", "emp004@shal.com", "123456", shalTenant, "EMPLOYEE", Set.of(CommitteePermission.ESCALATION_HEAD));

        // 4. Categories and SLA Policies
        tenantRepository.findAll().forEach(tenant -> {
            if (categoryRepository.findByTenantId(tenant.getId()).isEmpty()) {
                saveCategoryWithSLA("Ethics & Compliance", "Bribery, corruption, fraud", tenant, 7);
                saveCategoryWithSLA("Safety & Hazard", "Unsafe working conditions", tenant, 3);
                saveCategoryWithSLA("Discrimination & Harassment", "Workplace misconduct", tenant, 5);
                saveCategoryWithSLA("General Grievance", "Miscellaneous issues", tenant, 14);
            }
        });

        // 5. Add a Sample Complaint for Shal Tenant
        if (complaintRepository.findAll().stream().noneMatch(c -> c.getTenant().getId().equals(shalTenant.getId()))) {
            Complaint c = new Complaint();
            c.setTitle("Sample Ethics Issue");
            c.setDescription("This is an anonymous test report for the Committee Lead to triage.");
            c.setLocation("Main Office");
            c.setAnonymous(true);
            c.setTenant(shalTenant);
            c.setStatus(ComplaintStatus.SUBMITTED);
            c.setTrackingId("TRK-SHAL-789");
            c.setPinHash(passwordEncoder.encode("1234"));
            c.setReporter(userRepository.findByUsername("EMP002").orElse(null));
            complaintRepository.save(c);
        }

        // 6. Add a Sensitive Complaint for Shal Tenant (Should only be visible to EMP004)
        if (complaintRepository.findAll().stream().noneMatch(c -> c.getType() == ComplaintType.SENSITIVE)) {
            Complaint s = new Complaint();
            s.setTitle("Leadership Misconduct");
            s.setDescription("This is a sensitive report against a senior member. Only the Escalation Head should see this.");
            s.setLocation("Executive Floor");
            s.setAnonymous(true);
            s.setTenant(shalTenant);
            s.setStatus(ComplaintStatus.SUBMITTED);
            s.setType(ComplaintType.SENSITIVE);
            s.setTrackingId("TRK-SENS-123");
            s.setPinHash(passwordEncoder.encode("1234"));
            s.setReporter(userRepository.findByUsername("EMP002").orElse(null));
            complaintRepository.save(s);
        }

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
