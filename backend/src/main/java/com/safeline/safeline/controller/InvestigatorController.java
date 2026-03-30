package com.safeline.safeline.controller;

import com.safeline.safeline.dto.*;
import com.safeline.safeline.model.*;
import com.safeline.safeline.repository.*;
import com.safeline.safeline.service.*;
import com.safeline.safeline.mapper.ComplaintMapper;
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
import java.util.List;

@RestController
@RequestMapping("/api/complaints")
@RequiredArgsConstructor
public class InvestigatorController {

    private final ComplaintService complaintService;
    private final ComplaintQueryService complaintQueryService;
    private final ComplaintActionService complaintActionService;
    private final ComplaintRepository complaintRepository;
    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final ComplaintMapper mapper;

    @GetMapping("/all")
    @Transactional(readOnly = true)
    public ResponseEntity<Page<ComplaintResponse>> getAll(
            @RequestHeader(value = "X-Tenant-Id", required = false) String domain,
            @RequestParam(required = false) Long tenantId,
            @RequestParam(required = false) ComplaintStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) ComplaintType type,
            Pageable pageable) {
        
        org.springframework.data.domain.Sort remappedSort = org.springframework.data.domain.Sort.by(
            pageable.getSort().stream().map(order -> {
                String prop = order.getProperty().replace("createdAt", "created_at").replace("updatedAt", "updated_at");
                return order.isAscending() ? org.springframework.data.domain.Sort.Order.asc(prop) : org.springframework.data.domain.Sort.Order.desc(prop);
            }).toList()
        );
        Pageable safePageable = org.springframework.data.domain.PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), remappedSort);

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
            
            if (finalTenantId == null) return ResponseEntity.badRequest().build();
            
            User user = userRepository.findByUsername(currentAuth.getName()).orElse(null);
            if (user == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            
            boolean isSuperAdmin = currentAuth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("SUPER_ADMIN"));
            java.util.Set<CommitteePermission> perms = user.getCommitteePermissions();
            boolean isEscalation = perms != null && perms.contains(CommitteePermission.ESCALATION_HEAD);
            boolean isLead = perms != null && perms.contains(CommitteePermission.COMMITTEE_LEAD);
            boolean isHandler = perms != null && perms.contains(CommitteePermission.COMPLAINT_HANDLER);

            Page<Complaint> complaints;
            if (type != null) {
                if (type == ComplaintType.SENSITIVE && !isEscalation && !isSuperAdmin) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
                complaints = complaintQueryService.getComplaintsByType(finalTenantId, type, status, search, user.getId(), safePageable);
            } else if (isEscalation) {
                complaints = complaintQueryService.getComplaintsByType(finalTenantId, ComplaintType.SENSITIVE, status, search, user.getId(), safePageable);
            } else if (isLead) {
                complaints = complaintQueryService.getComplaintsByType(finalTenantId, ComplaintType.NORMAL, status, search, user.getId(), safePageable);
            } else if (isHandler) {
                complaints = complaintQueryService.getAssignedComplaints(user.getId(), status, search, safePageable);
            } else {
                complaints = Page.empty();
            }

            return ResponseEntity.ok(complaints.map(mapper::mapToResponse));
        } catch (Exception e) {
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
        return ResponseEntity.ok(mapper.mapToResponse(complaint));
    }

    @GetMapping("/assigned")
    @Transactional(readOnly = true)
    public ResponseEntity<Page<ComplaintResponse>> getAssigned(
            Authentication auth, @RequestParam(required = false) ComplaintStatus status, @RequestParam(required = false) String search, Pageable pageable) {
        User user = userRepository.findByUsername(auth.getName()).orElseThrow();
        org.springframework.data.domain.Sort remappedSort = org.springframework.data.domain.Sort.by(
            pageable.getSort().stream().map(order -> {
                String prop = order.getProperty().replace("createdAt", "created_at").replace("updatedAt", "updated_at");
                return order.isAscending() ? org.springframework.data.domain.Sort.Order.asc(prop) : org.springframework.data.domain.Sort.Order.desc(prop);
            }).toList()
        );
        Pageable safePageable = org.springframework.data.domain.PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), remappedSort);
        return ResponseEntity.ok(complaintQueryService.getAssignedComplaints(user.getId(), status, search, safePageable).map(mapper::mapToResponse));
    }

    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ORG_ADMIN', 'ADMIN') or isAuthenticated()")
    @PutMapping("/{id}/triage")
    public ResponseEntity<?> triage(
            @PathVariable Long id, @RequestParam Priority priority,
            @RequestParam Classification classification, @RequestParam(required = false) ComplaintStatus status) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByUsername(auth.getName()).orElseThrow();
        boolean isCommitteeLead = user.getCommitteePermissions() != null && user.getCommitteePermissions().contains(CommitteePermission.COMMITTEE_LEAD);
        boolean isEscalationHead = user.getCommitteePermissions() != null && user.getCommitteePermissions().contains(CommitteePermission.ESCALATION_HEAD);
        boolean isSuperAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("SUPER_ADMIN"));

        if (!isCommitteeLead && !isEscalationHead && !isSuperAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only Committee Leads or Escalation Heads can triage cases.");
        }
        return ResponseEntity.ok(mapper.mapToResponse(complaintActionService.triageComplaint(id, priority, classification, status)));
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
        boolean isEscalationHead = user.getCommitteePermissions() != null && user.getCommitteePermissions().contains(CommitteePermission.ESCALATION_HEAD);
        boolean isSuperAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("SUPER_ADMIN"));

        if (!isCommitteeLead && !isEscalationHead && !isSuperAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only Committee Leads or Escalation Heads can assign cases.");
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
        if (tenantId != null && !complaint.getTenant().getId().equals(tenantId)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();

        return ResponseEntity.ok(complaintService.getActivityLogs(id));
    }
}
