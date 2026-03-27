package com.safeline.safeline.controller;

import com.safeline.safeline.dto.*;
import com.safeline.safeline.model.*;
import com.safeline.safeline.repository.*;
import com.safeline.safeline.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/complaints")
@RequiredArgsConstructor
public class ComplaintController {

    private final ComplaintService complaintService;
    private final ComplaintQueryService complaintQueryService;
    private final ComplaintActionService complaintActionService;
    private final ComplaintRepository complaintRepository;
    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ObjectMapper objectMapper;
    private final JdbcTemplate jdbcTemplate;

    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getCategories(
            @RequestHeader(value = "X-Tenant-Id", required = false) String domain) {
        String effectiveDomain = (domain == null || domain.isEmpty() || "undefined".equals(domain) || "null".equals(domain)) ? "default" : domain;
        Tenant tenant = tenantRepository.findByDomain(effectiveDomain)
                .orElseGet(() -> tenantRepository.findByDomain("default").orElse(null));
        if (tenant == null) return ResponseEntity.ok(List.of());
        return ResponseEntity.ok(categoryRepository.findByTenantId(tenant.getId()));
    }

    @GetMapping("/potential-accused")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Map<String, Object>>> getPotentialAccused(
            @RequestHeader(value = "X-Tenant-Id", required = false) String domain) {
        String effectiveDomain = (domain == null || domain.isEmpty() || "undefined".equals(domain) || "null".equals(domain)) ? "default" : domain;
        Tenant tenant = tenantRepository.findByDomain(effectiveDomain)
                .orElseGet(() -> tenantRepository.findByDomain("default").orElse(null));
        if (tenant == null) return ResponseEntity.ok(List.of());
        
        List<User> users = userRepository.findByTenantId(tenant.getId());
        List<Map<String, Object>> result = users.stream().map(u -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", u.getId());
            map.put("fullName", u.getFullName());
            map.put("username", u.getUsername());
            return map;
        }).toList();
        return ResponseEntity.ok(result);
    }

    @PostMapping(value = "/submit", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
    public ResponseEntity<ComplaintResponse> submit(
            @RequestPart("request") String requestStr,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            @RequestHeader(value = "X-Tenant-Id", required = false) String domain) throws Exception {
        ComplaintRequest request = objectMapper.readValue(requestStr, ComplaintRequest.class);
        Tenant tenant = tenantRepository.findByDomain(domain != null ? domain : "default")
                .orElseThrow(() -> new RuntimeException("Tenant not found"));
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User reporter = (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) 
                ? userRepository.findByUsername(auth.getName()).orElse(null) : null;
        Complaint complaint = new Complaint();
        complaint.setTitle(request.getTitle());
        complaint.setDescription(request.getDescription());
        complaint.setLocation(request.getLocation());
        complaint.setAnonymous(request.isAnonymous());
        complaint.setTenant(tenant);
        complaint.setReporter(reporter);

        if (request.getCategoryId() != null) {
            categoryRepository.findById(request.getCategoryId()).ifPresent(complaint::setCategory);
        }

        if (request.getAccusedUserId() != null) {
            userRepository.findById(request.getAccusedUserId()).ifPresent(complaint::setAccusedUser);
        }

        if (request.getType() != null && !request.getType().isEmpty()) {
            try {
                complaint.setType(ComplaintType.valueOf(request.getType()));
            } catch (Exception ignored) {}
        }

        // AUTO-DETECT CONFLICTS (RELIABILITY RULE)
        // If the accused belongs to the Committee, force the complaint to SENSITIVE
        if (complaint.getAccusedUser() != null && complaint.getAccusedUser().getCommitteePermissions() != null) {
            if (!complaint.getAccusedUser().getCommitteePermissions().isEmpty()) {
                System.out.println("DEBUG: Conflict Detected! Accused is a Committee Member. Forcing SENSITIVE report.");
                complaint.setType(ComplaintType.SENSITIVE);
            }
        }

        Complaint saved = complaintService.createComplaint(complaint, files);
        ComplaintResponse response = new ComplaintResponse();
        response.setId(saved.getId());
        response.setTrackingId(saved.getTrackingId());
        response.setRawPin(saved.getRawPin());
        response.setStatus(saved.getStatus().name());
        response.setCreatedAt(saved.getCreatedAt());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/track")
    public ResponseEntity<Boolean> track(@RequestParam String trackingId, @RequestParam String pin) {
        return ResponseEntity.ok(complaintQueryService.verifyTracking(trackingId, pin));
    }

    @GetMapping("/public/{trackingId}")
    public ResponseEntity<ComplaintResponse> getPublic(@PathVariable String trackingId, @RequestParam String pin) {
        Complaint c = complaintQueryService.getPublicComplaint(trackingId, pin);
        ComplaintResponse res = mapToResponse(c);
        return ResponseEntity.ok(res);
    }

    @GetMapping("/my")
    public ResponseEntity<Page<Complaint>> getMyComplaints(Pageable pageable) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        User user = userRepository.findByUsername(auth.getName()).orElseThrow();
        return ResponseEntity.ok(complaintQueryService.getMyComplaints(user.getId(), pageable));
    }

    @GetMapping("/all")
    @Transactional(readOnly = true)
    public ResponseEntity<Page<ComplaintResponse>> getAll(
            @RequestHeader(value = "X-Tenant-Id", required = false) String domain,
            @RequestParam(required = false) Long tenantId,
            @RequestParam(required = false) ComplaintStatus status,
            @RequestParam(required = false) String search,
            Pageable pageable) {
        
        try {
            Authentication currentAuth = SecurityContextHolder.getContext().getAuthentication();
            if (currentAuth == null || !currentAuth.isAuthenticated() || "anonymousUser".equals(currentAuth.getPrincipal())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            com.safeline.safeline.security.TenantAwareUserDetails principal = null;
            if (currentAuth.getPrincipal() instanceof com.safeline.safeline.security.TenantAwareUserDetails) {
                principal = (com.safeline.safeline.security.TenantAwareUserDetails) currentAuth.getPrincipal();
            }

            Long finalTenantId = (domain != null && !"default".equalsIgnoreCase(domain)) 
                    ? tenantRepository.findByDomain(domain).map(Tenant::getId).orElse(principal != null ? principal.getTenantId() : null)
                    : (principal != null ? principal.getTenantId() : (tenantId != null ? tenantId : null));
            
            System.out.println("DEBUG: getAll request - Domain: " + domain + ", ParamTenantId: " + tenantId + ", PrincipalTenantId: " + (principal != null ? principal.getTenantId() : "null") + ", FinalTenantId: " + finalTenantId);
            
            if (finalTenantId == null) {
                System.err.println("DEBUG ERROR: No TenantID resolved for getAll request!");
                return ResponseEntity.badRequest().build();
            }
            
            User user = userRepository.findByUsername(currentAuth.getName()).orElse(null);
            if (user == null) {
                System.err.println("DEBUG ERROR: User record NOT found in database for username: " + currentAuth.getName());
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            
            boolean isSuperAdmin = currentAuth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("SUPER_ADMIN"));
            
            Page<Complaint> complaints;
            // Strict Privacy Rule: Local Organization Admins are restricted from viewing reports.
            // Only Committee Leads or Escalation Heads can view their respective queues.
            if (isSuperAdmin) {
                complaints = complaintQueryService.getAllComplaints(finalTenantId, status, search, user.getId(), pageable);
            } else if (user.getCommitteePermissions() != null && user.getCommitteePermissions().contains(CommitteePermission.ESCALATION_HEAD)) {
                complaints = complaintQueryService.getComplaintsByType(finalTenantId, ComplaintType.SENSITIVE, status, search, user.getId(), pageable);
            } else if (user.getCommitteePermissions() != null && user.getCommitteePermissions().contains(CommitteePermission.COMMITTEE_LEAD)) {
                complaints = complaintQueryService.getComplaintsByType(finalTenantId, ComplaintType.NORMAL, status, search, user.getId(), pageable);
            } else if (user.getCommitteePermissions() != null && user.getCommitteePermissions().contains(CommitteePermission.COMPLAINT_HANDLER)) {
                complaints = complaintQueryService.getAssignedComplaints(user.getId(), status, search, pageable);
            } else {
                complaints = Page.empty();
            }
            
            Page<ComplaintResponse> responsePage = complaints.map(this::mapToResponse);
            return ResponseEntity.ok(responsePage);
        } catch (Exception e) {
            System.err.println("DEBUG FATAL: Exception in ComplaintController.getAll()!");
            System.err.println("Message: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<ComplaintResponse> getById(@PathVariable Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userRepository.findByUsername(auth.getName()).orElseThrow();
        Complaint complaint = complaintQueryService.getById(id);
        boolean isSuperAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("SUPER_ADMIN"));
        boolean isCommitteeMember = currentUser.getCommitteePermissions() != null && 
            (currentUser.getCommitteePermissions().contains(CommitteePermission.COMMITTEE_LEAD) || 
             currentUser.getCommitteePermissions().contains(CommitteePermission.ESCALATION_HEAD));

        if (!isSuperAdmin && !isCommitteeMember && (complaint.getAssignedTo() == null || !complaint.getAssignedTo().getId().equals(currentUser.getId()))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(mapToResponse(complaint));
    }

    @GetMapping("/assigned")
    @Transactional(readOnly = true)
    public ResponseEntity<Page<ComplaintResponse>> getAssigned(
            Authentication auth, @RequestParam(required = false) ComplaintStatus status, @RequestParam(required = false) String search, Pageable pageable) {
        User user = userRepository.findByUsername(auth.getName()).orElseThrow();
        return ResponseEntity.ok(complaintQueryService.getAssignedComplaints(user.getId(), status, search, pageable).map(this::mapToResponse));
    }

    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ORG_ADMIN', 'ADMIN') or isAuthenticated()")
    @PutMapping("/{id}/triage") // Added @PutMapping and path for triage
    public ResponseEntity<?> triage(
            @PathVariable Long id, @RequestParam Priority priority,
            @RequestParam Classification classification, @RequestParam(required = false) ComplaintStatus status) {
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByUsername(auth.getName()).orElseThrow();
        boolean isCommitteeLead = user.getCommitteePermissions() != null && user.getCommitteePermissions().contains(CommitteePermission.COMMITTEE_LEAD);
        boolean isSuperAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("SUPER_ADMIN"));

        if (!isCommitteeLead && !isSuperAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only Committee Leads can triage cases.");
        }

        return ResponseEntity.ok(mapToResponse(complaintActionService.triageComplaint(id, priority, classification, status)));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestParam ComplaintStatus status) {
        return ResponseEntity.ok(complaintActionService.updateStatus(id, status));
    }

    @PutMapping("/{id}/assign")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ORG_ADMIN', 'ADMIN') or isAuthenticated()")
    public ResponseEntity<?> assign(@PathVariable Long id, @RequestParam Long investigatorId) {
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByUsername(auth.getName()).orElseThrow();
        boolean isCommitteeLead = user.getCommitteePermissions() != null && user.getCommitteePermissions().contains(CommitteePermission.COMMITTEE_LEAD);
        boolean isSuperAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("SUPER_ADMIN"));

        if (!isCommitteeLead && !isSuperAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only Committee Leads can assign cases.");
        }

        return ResponseEntity.ok(complaintActionService.assignInvestigator(id, investigatorId));
    }

    @GetMapping("/activities/{id}")
    public ResponseEntity<List<ComplaintActivityLog>> getActivities(
            @PathVariable Long id,
            @RequestHeader(value = "X-Tenant-Id", required = false) String domain,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.safeline.safeline.security.TenantAwareUserDetails principal) {
        
        Long tenantId = (domain != null && !"default".equalsIgnoreCase(domain)) 
                ? tenantRepository.findByDomain(domain).map(Tenant::getId).orElse(principal != null ? principal.getTenantId() : null)
                : (principal != null ? principal.getTenantId() : null);

        Complaint complaint = complaintRepository.findById(id).orElse(null);
        if (complaint == null) return ResponseEntity.notFound().build();
        
        // Tenant Security Check
        if (tenantId != null && !complaint.getTenant().getId().equals(tenantId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(complaintService.getActivityLogs(id));
    }

    @GetMapping("/metrics")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ORG_ADMIN', 'ADMIN')")
    public ResponseEntity<Map<String, Long>> getMetrics(
            @RequestHeader(value = "X-Tenant-Id", required = false) String domain,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.safeline.safeline.security.TenantAwareUserDetails principal) {
        Long tenantId = (domain != null && !"default".equalsIgnoreCase(domain)) 
                ? tenantRepository.findByDomain(domain).map(Tenant::getId).orElse(principal != null ? principal.getTenantId() : null)
                : (principal != null ? principal.getTenantId() : null);
        if (tenantId == null) return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(complaintQueryService.getMetricsForTenant(tenantId));
    }

    private ComplaintResponse mapToResponse(Complaint c) {
        ComplaintResponse res = new ComplaintResponse();
        res.setId(c.getId());
        res.setTrackingId(c.getTrackingId());
        res.setTitle(c.getTitle());
        res.setDescription(c.getDescription());
        res.setStatus(c.getStatus() != null ? c.getStatus().name() : "SUBMITTED");
        res.setCreatedAt(c.getCreatedAt());
        res.setCategoryName(c.getCategory() != null ? c.getCategory().getName() : "General");
        res.setLocation(c.getLocation());
        res.setPriority(c.getPriority() != null ? c.getPriority().name() : "NORMAL");
        res.setClassification(c.getClassification() != null ? c.getClassification().name() : "GENERAL");
        res.setAnonymous(c.isAnonymous());
        res.setReporterUsername(c.isAnonymous() ? "Anonymous" : (c.getReporter() != null ? c.getReporter().getUsername() : "Public User"));
        
        if (c.getAssignedTo() != null) {
            res.setAssignedToUsername(c.getAssignedTo().getUsername());
            res.setAssignedToFullName(c.getAssignedTo().getFullName());
            res.setAssignedToEmployeeId(c.getAssignedTo().getEmployeeId());
            res.setAssignedToId(c.getAssignedTo().getId());
            res.setAssignedToRole(c.getAssignedTo().getRole());
            if (c.getAssignedTo().getCommitteePermissions() != null && !c.getAssignedTo().getCommitteePermissions().isEmpty()) {
                res.setAssignedToCommitteeRole(c.getAssignedTo().getCommitteePermissions().iterator().next().name());
            }
        }

        if (c.getEvidences() != null) {
            List<ComplaintEvidenceDTO> evidenceDTOs = c.getEvidences().stream().map(e -> {
                ComplaintEvidenceDTO dto = new ComplaintEvidenceDTO();
                dto.setId(e.getId());
                dto.setFileName(e.getFileName());
                dto.setContentType(e.getContentType());
                return dto;
            }).toList();
            res.setEvidence(evidenceDTOs);
        }

        return res;
    }
}
