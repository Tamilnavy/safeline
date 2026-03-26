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
                        getCurrentUser(), investigatorName, investigator.getHierarchyLevel());
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

        // Permissive approach: Any authenticated organization user can update case status.
        // Tenant isolation is handled by the TenantFilterAspect automatically.
        
        complaint.setStatus(status);
        Complaint updated = complaintRepository.save(complaint);
        
        String detail = String.format("Status updated to %s by %s", status, auth.getName());
        complaintService.logActivity(updated.getId(), "STATUS_UPDATE", auth.getName(), detail);
        return updated;
    }
}
