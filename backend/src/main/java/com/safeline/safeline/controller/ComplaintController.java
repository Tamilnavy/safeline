package com.safeline.safeline.controller;

import com.safeline.safeline.dto.ComplaintRequest;
import com.safeline.safeline.dto.ComplaintResponse;
import com.safeline.safeline.model.*;
import com.safeline.safeline.model.Priority;
import com.safeline.safeline.model.Classification;
import com.safeline.safeline.repository.CategoryRepository;
import com.safeline.safeline.repository.TenantRepository;
import com.safeline.safeline.repository.UserRepository;
import com.safeline.safeline.service.ComplaintService;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.MediaType;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/complaints")
@RequiredArgsConstructor
public class ComplaintController {

    private final ComplaintService complaintService;
    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ObjectMapper objectMapper;

    // ------------------------------------------------
    // Get Categories
    // ------------------------------------------------
    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getCategories(
            @RequestHeader(value = "X-Tenant-Id", required = false) String domain) {

        System.out.println("DEBUG: getCategories - Received Header X-Tenant-Id: [" + domain + "]");
        
        String tempDomain = domain;
        if (domain == null || domain.isEmpty() || "undefined".equals(domain) || "null".equals(domain)) {
            tempDomain = "default";
            System.out.println("DEBUG: getCategories - Domain is null/empty/undefined. Falling back to: default");
        }
        
        final String effectiveDomain = tempDomain;

        Tenant tenant = tenantRepository.findByDomain(effectiveDomain)
                .orElseGet(() -> {
                    System.out.println("DEBUG: getCategories - Tenant not found for domain [" + effectiveDomain + "], using default");
                    return tenantRepository.findByDomain("default").orElse(null);
                });

        if (tenant == null) {
            System.out.println("DEBUG: getCategories - Even default tenant not found!");
            return ResponseEntity.ok(List.of());
        }

        System.out.println("DEBUG: getCategories - Final Resolved Tenant: " + tenant.getDomain() + " (ID: " + tenant.getId() + ")");

        List<Category> categories = categoryRepository.findByTenantId(tenant.getId());
        System.out.println("DEBUG: getCategories - Found " + categories.size() + " categories in database for tenant ID " + tenant.getId());
        
        return ResponseEntity.ok(categories);
    }

    // ------------------------------------------------
    // Submit Complaint
    // ------------------------------------------------
    @PostMapping(value = "/submit", consumes = {
            MediaType.MULTIPART_FORM_DATA_VALUE
    })
    public ResponseEntity<ComplaintResponse> submit(
            @RequestPart("request") String requestStr,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            @RequestHeader(value = "X-Tenant-Id", required = false) String domain) throws Exception {

        System.out.println("DEBUG: Received complaint submission request for domain: " + domain);

        ComplaintRequest request = objectMapper.readValue(requestStr, ComplaintRequest.class);

        Tenant tenant = tenantRepository.findByDomain(domain != null ? domain : "default")
                .orElseThrow(() -> new RuntimeException("Tenant not found"));

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User reporter = null;

        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            reporter = userRepository.findByUsername(auth.getName()).orElse(null);
        }

        Complaint complaint = new Complaint();
        complaint.setTitle(request.getTitle());
        complaint.setDescription(request.getDescription());

        complaint.setLocation(request.getLocation());
        complaint.setAnonymous(request.isAnonymous());
        complaint.setTenant(tenant);
        complaint.setReporter(reporter);

        Complaint saved = complaintService.createComplaint(complaint, files);

        ComplaintResponse response = new ComplaintResponse();
        response.setId(saved.getId());
        response.setTrackingId(saved.getTrackingId());
        response.setRawPin(saved.getRawPin());
        response.setStatus(saved.getStatus().name());
        response.setCreatedAt(saved.getCreatedAt());

        return ResponseEntity.ok(response);
    }

    // ------------------------------------------------
    // Track Complaint (Public Access)
    // ------------------------------------------------
    @GetMapping("/track")
    public ResponseEntity<Boolean> track(
            @RequestParam String trackingId,
            @RequestParam String pin) {

        return ResponseEntity.ok(
                complaintService.verifyTracking(trackingId, pin)
        );
    }

    // ------------------------------------------------
    // Get Public Complaint (For Tracking)
    // ------------------------------------------------
    @GetMapping("/public/{trackingId}")
    public ResponseEntity<ComplaintResponse> getPublic(
            @PathVariable String trackingId,
            @RequestParam String pin) {

        Complaint c = complaintService.getPublicComplaint(trackingId, pin);

        ComplaintResponse res = new ComplaintResponse();
        res.setId(c.getId());
        res.setTrackingId(c.getTrackingId());
        res.setTitle(c.getTitle());
        res.setDescription(c.getDescription());
        res.setStatus(c.getStatus().name());
        res.setCreatedAt(c.getCreatedAt());
        res.setCategoryName(c.getCategory() != null ? c.getCategory().getName() : "General");
        res.setLocation(c.getLocation());

        return ResponseEntity.ok(res);
    }

    // ------------------------------------------------
    // Get My Complaints
    // ------------------------------------------------
    @GetMapping("/my")
    public ResponseEntity<Page<Complaint>> getMyComplaints(Pageable pageable) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated()
                || "anonymousUser".equals(auth.getPrincipal())) {

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        User user = userRepository.findByUsername(auth.getName()).orElseThrow();

        return ResponseEntity.ok(
                complaintService.getMyComplaints(user.getId(), pageable)
        );
    }

    // ------------------------------------------------
    // Get All Complaints (Tenant level)
    // ------------------------------------------------
    @GetMapping("/all")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ORG_ADMIN', 'INTAKE_OFFICER', 'INVESTIGATOR', 'HR_MANAGER', 'COMPLIANCE_OFFICER', 'EXECUTIVE')")
    public ResponseEntity<Page<ComplaintResponse>> getAll(
            @RequestHeader(value = "X-Tenant-Id", required = false) String domain,
            @RequestParam(required = false) ComplaintStatus status,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.safeline.safeline.security.TenantAwareUserDetails principal,
            Pageable pageable) {

        Long tenantId;
        if (domain != null && !"default".equalsIgnoreCase(domain)) {
            tenantId = tenantRepository.findByDomain(domain)
                    .map(Tenant::getId)
                    .orElse(principal != null ? principal.getTenantId() : null);
        } else {
            tenantId = (principal != null) ? principal.getTenantId() : null;
        }

        if (tenantId == null) {
            return ResponseEntity.badRequest().build();
        }
        
        System.out.println("DEBUG: ComplaintController.getAll - Resolved Tenant ID: " + tenantId + ", Status: " + status);

        Page<Complaint> complaints = complaintService.getAllComplaints(tenantId, status, pageable);
        System.out.println("DEBUG: ComplaintController.getAll - Result Count: " + complaints.getTotalElements());
        
        Page<ComplaintResponse> responsePage = complaints.map(this::mapToResponse);

        // EXECUTIVE ROLE: Remove individual case details dynamically if not metrics endpoint
        Authentication currentAuth = SecurityContextHolder.getContext().getAuthentication();
        if (currentAuth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("EXECUTIVE"))) {
            responsePage.forEach(res -> {
                res.setTitle("REDACTED (Oversight Mode)");
                res.setDescription("Detail access restricted for Executive role.");
                res.setLocation("REDACTED");
            });
        }

        return ResponseEntity.ok(responsePage);
    }

    private ComplaintResponse mapToResponse(Complaint c) {
        ComplaintResponse res = new ComplaintResponse();
        res.setId(c.getId());
        res.setTrackingId(c.getTrackingId());
        res.setTitle(c.getTitle());
        res.setDescription(c.getDescription());
        res.setStatus(c.getStatus().name());
        res.setCreatedAt(c.getCreatedAt());
        res.setCategoryName(c.getCategory() != null ? c.getCategory().getName() : "General");
        res.setLocation(c.getLocation());
        res.setPriority(c.getPriority() != null ? c.getPriority().name() : "NORMAL");
        res.setClassification(c.getClassification() != null ? c.getClassification().name() : "GENERAL");
        
        if (c.getAssignedTo() != null) {
            res.setAssignedToUsername(c.getAssignedTo().getUsername());
            res.setAssignedToId(c.getAssignedTo().getId());
        }
        return res;
    }

    // ------------------------------------------------
    // Get Assigned Complaints (Investigator Workspace)
    // ------------------------------------------------
    @GetMapping("/assigned")
    @PreAuthorize("hasAnyAuthority('ORG_ADMIN', 'INVESTIGATOR', 'HR_MANAGER', 'COMPLIANCE_OFFICER')")
    public ResponseEntity<Page<ComplaintResponse>> getAssigned(
            Authentication auth, 
            @RequestParam(required = false) ComplaintStatus status,
            Pageable pageable) {
        
        User user = userRepository.findByUsername(auth.getName()).orElseThrow();
        Page<Complaint> complaints = complaintService.getAssignedComplaints(user.getId(), status, pageable);
        
        Page<ComplaintResponse> responsePage = complaints.map(this::mapToResponse);
        return ResponseEntity.ok(responsePage);
    }

    // ------------------------------------------------
    // Triage Complaint (Intake Officer)
    // ------------------------------------------------
    @PutMapping("/{id}/triage")
    @PreAuthorize("hasAnyAuthority('ORG_ADMIN', 'INTAKE_OFFICER')")
    public ResponseEntity<?> triage(
            @PathVariable Long id,
            @RequestParam Priority priority,
            @RequestParam Classification classification,
            @RequestParam(required = false) ComplaintStatus status) {

        return ResponseEntity.ok(
                mapToResponse(complaintService.triageComplaint(id, priority, classification, status))
        );
    }

    // ------------------------------------------------
    // Update Complaint Status
    // ------------------------------------------------
    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyAuthority('ORG_ADMIN', 'INVESTIGATOR', 'HR_MANAGER', 'COMPLIANCE_OFFICER')")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @RequestParam ComplaintStatus status) {

        return ResponseEntity.ok(
                complaintService.updateStatus(id, status)
        );
    }

    // ------------------------------------------------
    // Assign Investigator
    // ------------------------------------------------
    @PutMapping("/{id}/assign")
    @PreAuthorize("hasAuthority('ORG_ADMIN')")
    public ResponseEntity<?> assign(
            @PathVariable Long id,
            @RequestParam Long investigatorId) {

        return ResponseEntity.ok(
                complaintService.assignInvestigator(id, investigatorId)
        );
    }

    // ------------------------------------------------
    // Get Activity Logs
    // ------------------------------------------------
    @GetMapping("/activities/{id}")
    public ResponseEntity<List<ComplaintActivityLog>> getActivities(@PathVariable Long id) {

        return ResponseEntity.ok(
                complaintService.getActivityLogs(id)
        );
    }

    // ------------------------------------------------
    // Metrics
    // ------------------------------------------------
    @GetMapping("/metrics")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ORG_ADMIN', 'EXECUTIVE', 'HR_MANAGER', 'COMPLIANCE_OFFICER', 'INVESTIGATOR')")
    public ResponseEntity<Map<String, Long>> getMetrics(
            @RequestHeader(value = "X-Tenant-Id", required = false) String domain,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.safeline.safeline.security.TenantAwareUserDetails principal) {

        Long tenantId;
        if (domain != null && !"default".equalsIgnoreCase(domain)) {
            tenantId = tenantRepository.findByDomain(domain)
                    .map(Tenant::getId)
                    .orElse(principal != null ? principal.getTenantId() : null);
        } else {
            tenantId = (principal != null) ? principal.getTenantId() : null;
        }

        if (tenantId == null) {
            return ResponseEntity.badRequest().build();
        }

        // For metrics we use the full list, bypassing pagination
        List<Complaint> all = complaintService.getAllComplaintsInternal(tenantId);

        Map<String, Long> metrics = new HashMap<>();
        metrics.put("total", (long) all.size());
        metrics.put("resolved", all.stream().filter(c -> c.getStatus() == ComplaintStatus.RESOLVED).count());
        metrics.put("pending", all.stream().filter(c -> c.getStatus() != ComplaintStatus.RESOLVED && c.getStatus() != ComplaintStatus.CLOSED).count());

        return ResponseEntity.ok(metrics);
    }
}