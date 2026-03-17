package com.safeline.safeline.config;

import com.safeline.safeline.model.*;
import com.safeline.safeline.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
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

        // 4. Dummy Security Logs
        if (securityLogRepository.count() == 0) {
            createSecurityLog("ADMIN_LOGIN_SUCCESS", "admin", "192.168.1.104", "AUTH", "INFO", defaultTenant, LocalDateTime.now().minusHours(1));
            createSecurityLog("TENANT_PROVISIONED", "super_admin", "10.0.0.42", "ADMIN", "SUCCESS", defaultTenant, LocalDateTime.now().minusHours(2));
            createSecurityLog("DB_BACKUP_INITIATED", "system_cron", "::1", "SYSTEM", "INFO", defaultTenant, LocalDateTime.now().minusDays(1));
            createSecurityLog("UNAUTHORIZED_API_ACCESS", "unknown", "45.12.33.1", "SECURITY", "DANGER", defaultTenant, LocalDateTime.now().minusDays(2));
            createSecurityLog("ENCRYPTION_KEY_ROTATED", "security_officer", "10.0.0.5", "SECURITY", "WARNING", defaultTenant, LocalDateTime.now().minusDays(3));
        }

        // 5. Dummy Complaints & Messages
        if (complaintRepository.count() == 0) {
            Category compliance = categoryRepository.findByTenantId(defaultTenant.getId()).stream()
                    .filter(c -> c.getName().toLowerCase().contains("compliance")).findFirst().orElse(null);
            
            if (compliance != null) {
                Complaint c = new Complaint();
                c.setTitle("Potential Nepotism in HR");
                c.setDescription("Recent hiring rounds seem to favor relatives of management.");
                c.setCategory(compliance);
                c.setTenant(defaultTenant);
                c.setStatus(ComplaintStatus.ASSIGNED);
                c.setPriority(Priority.HIGH);
                c.setClassification(Classification.HR_MATTERS);
                c.setTrackingId("SL-1001-XYZ");
                c.setCreatedAt(LocalDateTime.now().minusDays(5));
                Complaint savedComplaint = complaintRepository.save(c);

                createMessage("We have received your concern and an investigator will be assigned soon.", "SYSTEM", savedComplaint, null);
                createMessage("I am looking into the recruitment logs for the last quarter.", "INVESTIGATOR", savedComplaint, null);
            }
        }
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
