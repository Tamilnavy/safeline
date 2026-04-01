package com.safeline.safeline.service;

import com.safeline.safeline.model.*;
import com.safeline.safeline.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class ComplaintActionService {

    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;
    private final ComplaintService complaintService; // For logActivity
    private final NotificationService notificationService;

    private String getCurrentUser() {
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return auth.getName();
        }
        return "REPORTER";
    }
    public Complaint assignInvestigator(Long complaintId, Long investigatorId) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        User investigator = userRepository.findById(investigatorId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (complaint.getReporter() != null) {
            boolean sameId = investigator.getId().equals(complaint.getReporter().getId());
            String invEmpId = investigator.getEmployeeId();
            String repEmpId = complaint.getReporter().getEmployeeId();
            boolean sameEmployeeId = invEmpId != null && invEmpId.equals(repEmpId);

            if (sameId || sameEmployeeId) {
                throw new RuntimeException("Conflict of Interest: The reporter of a case cannot be assigned as its investigator.");
            }
        }

        complaint.setAssignedTo(investigator);
        complaint.setStatus(ComplaintStatus.ASSIGNED);

        Complaint updated = complaintRepository.save(complaint);
        
        String investigatorName = investigator.getFullName();
        if (investigatorName == null || investigatorName.trim().isEmpty() || "null".equalsIgnoreCase(investigatorName)) {
            investigatorName = investigator.getUsername();
        }
        
        // Final fallback if username is also problematic
        if (investigatorName == null || investigatorName.trim().isEmpty() || "null".equalsIgnoreCase(investigatorName)) {
            investigatorName = "Investigator #" + investigator.getId();
        }

        String detail = String.format("%s assigned case to %s (%s)", 
                        getCurrentUser(), investigatorName, investigator.getRole());
        complaintService.logActivity(updated.getId(), "INVESTIGATOR_ASSIGNED", getCurrentUser(), detail);

        // Notify the investigator
        notificationService.createNotification(
            investigator.getUsername(),
            "A new case #" + updated.getTrackingId() + " is assigned to you",
            updated.getId(),
            updated.getTenant() != null ? updated.getTenant().getId() : null
        );

        return updated;
    }

    public Complaint triageComplaint(Long complaintId, Priority priority, Classification classification, ComplaintStatus status) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        complaint.setPriority(priority);
        complaint.setClassification(classification);
        if (status != null) {
            complaint.setStatus(status);
        }

        Complaint updated = complaintRepository.save(complaint);
        
        String detail = String.format("Case triaged by %s. Priority: %s, Classification: %s", 
                        getCurrentUser(), priority, classification);
        complaintService.logActivity(updated.getId(), "TRIAGED", getCurrentUser(), detail);
        return updated;
    }


    @Transactional
    public Complaint updateStatus(Long complaintId, ComplaintStatus status) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found with ID: " + complaintId));

        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new RuntimeException("Unauthorized: Please log in to update case status.");
        }

        Long tenantId = null;
        if (auth.getPrincipal() instanceof com.safeline.safeline.security.TenantAwareUserDetails tenantUser) {
            tenantId = tenantUser.getTenantId();
        }

        User currentUser;
        if (tenantId != null) {
            currentUser = userRepository.findByUsernameAndTenantId(auth.getName(), tenantId)
                    .orElseThrow(() -> new RuntimeException("User not found: " + auth.getName()));
        } else {
            java.util.List<User> users = userRepository.findByUsername(auth.getName());
            if (users.isEmpty()) throw new RuntimeException("User not found: " + auth.getName());
            currentUser = users.stream().filter(u -> u.getTenant() == null).findFirst()
                    .orElseThrow(() -> new RuntimeException("Ambiguous user: " + auth.getName()));
        }

        boolean isEscalation = currentUser.getCommitteePermissions() != null && 
            currentUser.getCommitteePermissions().contains(CommitteePermission.ESCALATION_HEAD);
        boolean isLead = currentUser.getCommitteePermissions() != null && 
            currentUser.getCommitteePermissions().contains(CommitteePermission.COMMITTEE_LEAD);

        boolean isSuperAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("SUPER_ADMIN"));

        // Rule 1: CLOSED → only Committee Lead, Escalation Head, or SuperAdmin
        if (status == ComplaintStatus.CLOSED && !isLead && !isEscalation && !isSuperAdmin) {
            throw new RuntimeException("Access Denied: Only Committee Leads or Escalation Heads can officially close cases.");
        }

        // Rule 2: Handlers can update to any status except CLOSED (handled above)
        // Leads & Escalation Heads have full oversight.

        ComplaintStatus previousStatus = complaint.getStatus();
        complaint.setStatus(status);
        Complaint updated = complaintRepository.save(complaint);

        String detail = String.format("Status updated to %s by %s", status, auth.getName());
        complaintService.logActivity(updated.getId(), "STATUS_UPDATE", auth.getName(), detail);

        // Rule 3: When case is RESOLVED → notify all Committee Leads in the tenant
        if (status == ComplaintStatus.RESOLVED && previousStatus != ComplaintStatus.RESOLVED) {
            String resolutionDetail = String.format(
                "RESOLUTION ALERT: Case #%s (%s) has been marked RESOLVED by %s. Please review and close the case.",
                updated.getTrackingId(), updated.getTitle(), auth.getName()
            );
            
            // Log global activity once for the timeline
            complaintService.logActivity(updated.getId(), "RESOLUTION_PENDING_REVIEW", auth.getName(), resolutionDetail);

            Long currentTenantId = currentUser.getTenant() != null ? currentUser.getTenant().getId() : null;
            if (currentTenantId != null) {
                java.util.List<User> tenantUsers = userRepository.findByTenantId(currentTenantId);
                tenantUsers.stream()
                    .filter(u -> u.getCommitteePermissions() != null &&
                                 u.getCommitteePermissions().contains(CommitteePermission.COMMITTEE_LEAD))
                    .forEach(lead -> {
                        // Push to real notification bell system for each lead
                        notificationService.createNotification(
                            lead.getUsername(),
                            "Case " + updated.getTrackingId() + " marked RESOLVED by " + auth.getName(),
                            updated.getId(),
                            currentTenantId
                        );
                    });
            }
        }

        return updated;
    }
}
