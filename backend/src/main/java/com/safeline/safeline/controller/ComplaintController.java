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
    public ResponseEntity<Page<ComplaintResponse>> getAll(
            @RequestHeader(value = "X-Tenant-Id", required = false) String domain,
            @RequestParam(required = false) ComplaintStatus status,
            @RequestParam(required = false) String search,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.safeline.safeline.security.TenantAwareUserDetails principal,
            Pageable pageable) {
        Long tenantId = (domain != null && !"default".equalsIgnoreCase(domain)) 
                ? tenantRepository.findByDomain(domain).map(Tenant::getId).orElse(principal != null ? principal.getTenantId() : null)
                : (principal != null ? principal.getTenantId() : null);
        if (tenantId == null) return ResponseEntity.badRequest().build();
        Authentication currentAuth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = currentAuth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("SUPER_ADMIN") || a.getAuthority().equals("LEVEL_1"));
        User user = userRepository.findByUsername(currentAuth.getName()).orElseThrow();
        Page<Complaint> complaints = isAdmin 
                ? complaintQueryService.getAllComplaints(tenantId, status, search, pageable)
                : complaintQueryService.getAssignedComplaints(user.getId(), status, search, pageable);
        
        Page<ComplaintResponse> responsePage = complaints.map(this::mapToResponse);
        if (currentAuth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("EXECUTIVE"))) {
            responsePage.forEach(res -> {
                res.setTitle("REDACTED (Oversight Mode)");
                res.setDescription("Detail access restricted for Executive role.");
                res.setLocation("REDACTED");
            });
        }
        return ResponseEntity.ok(responsePage);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ComplaintResponse> getById(@PathVariable Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userRepository.findByUsername(auth.getName()).orElseThrow();
        Complaint complaint = complaintQueryService.getById(id);
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("SUPER_ADMIN") || a.getAuthority().equals("LEVEL_1"));
        if (!isAdmin && (complaint.getAssignedTo() == null || !complaint.getAssignedTo().getId().equals(currentUser.getId()))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(mapToResponse(complaint));
    }

    @GetMapping("/assigned")
    public ResponseEntity<Page<ComplaintResponse>> getAssigned(
            Authentication auth, @RequestParam(required = false) ComplaintStatus status, @RequestParam(required = false) String search, Pageable pageable) {
        User user = userRepository.findByUsername(auth.getName()).orElseThrow();
        return ResponseEntity.ok(complaintQueryService.getAssignedComplaints(user.getId(), status, search, pageable).map(this::mapToResponse));
    }

    @PutMapping("/{id}/triage")
    @PreAuthorize("hasAnyAuthority('LEVEL_1', 'LEVEL_2')")
    public ResponseEntity<?> triage(
            @PathVariable Long id, @RequestParam Priority priority,
            @RequestParam Classification classification, @RequestParam(required = false) ComplaintStatus status) {
        return ResponseEntity.ok(mapToResponse(complaintActionService.triageComplaint(id, priority, classification, status)));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestParam ComplaintStatus status) {
        return ResponseEntity.ok(complaintActionService.updateStatus(id, status));
    }

    @PutMapping("/{id}/assign")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'LEVEL_1')")
    public ResponseEntity<?> assign(@PathVariable Long id, @RequestParam Long investigatorId) {
        return ResponseEntity.ok(complaintActionService.assignInvestigator(id, investigatorId));
    }

    @GetMapping("/activities/{id}")
    public ResponseEntity<List<ComplaintActivityLog>> getActivities(@PathVariable Long id) {
        return ResponseEntity.ok(complaintService.getActivityLogs(id));
    }

    @GetMapping("/metrics")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'LEVEL_1', 'LEVEL_2')")
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
            res.setAssignedToRole(c.getAssignedTo().getHierarchyLevel());
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
