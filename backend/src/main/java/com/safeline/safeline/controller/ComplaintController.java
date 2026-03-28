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
import java.util.HashMap;
import java.util.stream.Collectors;

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
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User reporter = (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) 
                ? userRepository.findByUsername(auth.getName()).orElse(null) : null;

        Tenant tenant;
        if (reporter != null && reporter.getTenant() != null) {
            tenant = reporter.getTenant();
            System.out.println("DEBUG: Submission Tenant from Reporter: " + tenant.getDomain());
        } else {
            tenant = tenantRepository.findByDomain(domain != null && !domain.isEmpty() && !"null".equals(domain) && !"undefined".equals(domain) ? domain : "default")
                    .orElseThrow(() -> new RuntimeException("Tenant not found"));
            System.out.println("DEBUG: Submission Tenant from Header: " + tenant.getDomain());
        }
        Complaint complaint = new Complaint();
        complaint.setTitle(request.getTitle());
        complaint.setDescription(request.getDescription());
        complaint.setLocation(request.getLocation());
        complaint.setAnonymous(request.isAnonymous());
        complaint.setSensitive(request.isSensitive());
        complaint.setTenant(tenant);
        complaint.setReporter(reporter);

        if (request.getCategoryId() != null) {
            categoryRepository.findById(request.getCategoryId()).ifPresent(complaint::setCategory);
        }

        if (request.getType() != null && !request.getType().isEmpty()) {
            try {
                ComplaintType requestedType = ComplaintType.valueOf(request.getType());
                complaint.setType(requestedType);
                complaint.setSensitive(requestedType == ComplaintType.SENSITIVE);
            } catch (Exception ignored) {}
        } else {
            // Sync isSensitive (boolean) with type (enum) if type not explicitly provided
            complaint.setType(complaint.isSensitive() ? ComplaintType.SENSITIVE : ComplaintType.NORMAL);
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
    public ResponseEntity<Page<ComplaintResponse>> getMyComplaints(Pageable pageable) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        User user = userRepository.findByUsername(auth.getName()).orElseThrow();
        Page<Complaint> complaints = complaintQueryService.getMyComplaints(user.getId(), pageable);
        System.out.println("DEBUG: getMyComplaints for user " + user.getId() + " returned " + complaints.getTotalElements() + " items.");
        return ResponseEntity.ok(complaints.map(this::mapToResponse));
    }



    @GetMapping("/all")
    @Transactional(readOnly = true)
    public ResponseEntity<Page<ComplaintResponse>> getAll(
            @RequestHeader(value = "X-Tenant-Id", required = false) String domain,
            @RequestParam(required = false) Long tenantId,
            @RequestParam(required = false) ComplaintStatus status,
            @RequestParam(required = false) String search,
            Pageable pageable) {
        
        // Native SQL queries don't translate camelCase to snake_case — remap manually
        org.springframework.data.domain.Sort remappedSort = org.springframework.data.domain.Sort.by(
            pageable.getSort().stream().map(order -> {
                String prop = order.getProperty()
                    .replace("createdAt", "created_at")
                    .replace("updatedAt", "updated_at");
                return order.isAscending()
                    ? org.springframework.data.domain.Sort.Order.asc(prop)
                    : org.springframework.data.domain.Sort.Order.desc(prop);
            }).toList()
        );
        Pageable safePageable = org.springframework.data.domain.PageRequest.of(
            pageable.getPageNumber(), pageable.getPageSize(), remappedSort
        );

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
            
            if (finalTenantId == null) {
                return ResponseEntity.badRequest().build();
            }
            
            User user = userRepository.findByUsername(currentAuth.getName()).orElse(null);
            if (user == null) {
                System.err.println("DEBUG ERROR: User record NOT found in database for username: " + currentAuth.getName());
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            
            System.out.println("DEBUG: User " + user.getUsername() + " Permissions: " + user.getCommitteePermissions());
            boolean isSuperAdmin = currentAuth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("SUPER_ADMIN"));
            
            Page<Complaint> complaints;
            java.util.Set<CommitteePermission> perms = user.getCommitteePermissions();
            boolean isEscalation = perms != null && perms.contains(CommitteePermission.ESCALATION_HEAD);
            boolean isLead = perms != null && perms.contains(CommitteePermission.COMMITTEE_LEAD);
            boolean isHandler = perms != null && perms.contains(CommitteePermission.COMPLAINT_HANDLER);

            System.out.println("DEBUG: User=" + user.getUsername() + ", Tenant=" + finalTenantId + 
                               ", Role=" + user.getRole() + ", isEscalation=" + isEscalation + 
                               ", isLead=" + isLead + ", isHandler=" + isHandler);

            if (isEscalation) {
                complaints = complaintQueryService.getComplaintsByType(finalTenantId, ComplaintType.SENSITIVE, status, search, user.getId(), safePageable);
            } else if (isLead) {
                complaints = complaintQueryService.getComplaintsByType(finalTenantId, ComplaintType.NORMAL, status, search, user.getId(), safePageable);
            } else if (isHandler) {
                complaints = complaintQueryService.getAssignedComplaints(user.getId(), status, search, safePageable);
            } else {
                complaints = Page.empty();
            }

            Page<ComplaintResponse> responsePage = complaints.map(this::mapToResponse);
            return ResponseEntity.ok(responsePage);
        } catch (Exception e) {
            System.err.println("ERROR in getAll: " + e.getMessage());
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
        boolean isReporter = complaint.getReporter() != null && complaint.getReporter().getId().equals(currentUser.getId());

        if (!isSuperAdmin && !isCommitteeMember && !isReporter && (complaint.getAssignedTo() == null || !complaint.getAssignedTo().getId().equals(currentUser.getId()))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(mapToResponse(complaint));
    }

    @GetMapping("/assigned")
    @Transactional(readOnly = true)
    public ResponseEntity<Page<ComplaintResponse>> getAssigned(
            Authentication auth, @RequestParam(required = false) ComplaintStatus status, @RequestParam(required = false) String search, Pageable pageable) {
        User user = userRepository.findByUsername(auth.getName()).orElseThrow();
        // Native SQL doesn't translate camelCase — remap sort column
        org.springframework.data.domain.Sort remappedSort = org.springframework.data.domain.Sort.by(
            pageable.getSort().stream().map(order -> {
                String prop = order.getProperty().replace("createdAt", "created_at").replace("updatedAt", "updated_at");
                return order.isAscending() ? org.springframework.data.domain.Sort.Order.asc(prop) : org.springframework.data.domain.Sort.Order.desc(prop);
            }).toList()
        );
        Pageable safePageable = org.springframework.data.domain.PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), remappedSort);
        return ResponseEntity.ok(complaintQueryService.getAssignedComplaints(user.getId(), status, search, safePageable).map(this::mapToResponse));
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
        res.setSensitive(c.isSensitive());
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
