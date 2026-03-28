package com.safeline.safeline.service;

import com.safeline.safeline.model.*;
import com.safeline.safeline.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.io.FileWriter;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.stream.Collectors;
import java.util.Set;
import org.springframework.security.core.GrantedAuthority;

@Service
@RequiredArgsConstructor
@Transactional
public class ComplaintActionService {

    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;
    private final ComplaintService complaintService; // For logActivity

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

        User currentUser = userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found: " + auth.getName()));

        boolean isEscalation = currentUser.getCommitteePermissions() != null && 
            currentUser.getCommitteePermissions().contains(CommitteePermission.ESCALATION_HEAD);
        boolean isLead = currentUser.getCommitteePermissions() != null && 
            currentUser.getCommitteePermissions().contains(CommitteePermission.COMMITTEE_LEAD);
        boolean isHandler = currentUser.getCommitteePermissions() != null && 
            currentUser.getCommitteePermissions().contains(CommitteePermission.COMPLAINT_HANDLER);
        boolean isSuperAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("SUPER_ADMIN"));

        // Rule 1: Special permission for CLOSING (Only Lead, Head, or Admin)
        if (status == ComplaintStatus.CLOSED && !isLead && !isEscalation && !isSuperAdmin) {
            throw new RuntimeException("Access Denied: Only Committee Leads or Escalation Heads can officially close cases.");
        }

        // Rule 2: Committee Leads & Escalation Heads (Management) have GLOBAL status oversight.
        // No restriction on setting IN_PROGRESS, RESOLVED, etc.

        // Rule 3: Complaint Handlers can update statuses for cases they are managing.
        // If not assigned yet, they must have the HANDLER role to indicate pick-up.
        if (isHandler && !isLead && !isEscalation && !isSuperAdmin) {
             // Access control check moved to controller for unified handling
        }

        complaint.setStatus(status);
        Complaint updated = complaintRepository.save(complaint);
        
        String detail = String.format("Status updated to %s by %s", status, auth.getName());
        complaintService.logActivity(updated.getId(), "STATUS_UPDATE", auth.getName(), detail);
        return updated;
    }
}
