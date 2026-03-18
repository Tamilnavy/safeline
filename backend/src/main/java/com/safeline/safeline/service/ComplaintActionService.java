package com.safeline.safeline.service;

import com.safeline.safeline.model.*;
import com.safeline.safeline.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
        complaintService.logActivity(updated.getId(), "INVESTIGATOR_ASSIGNED", getCurrentUser());
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
        complaintService.logActivity(updated.getId(), "TRIAGED_PRIORITY_" + priority + "_CLASS_" + classification, getCurrentUser());
        return updated;
    }

    public Complaint updateStatus(Long complaintId, ComplaintStatus status) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        String username = getCurrentUser();
        User currentUser = userRepository.findByUsername(username).orElse(null);
        
        boolean isInvestigator = currentUser != null && currentUser.getRoles().stream()
                .anyMatch(r -> "INVESTIGATOR".equals(r.getName()));
        
        if (isInvestigator) {
            if (complaint.getAssignedTo() == null || !complaint.getAssignedTo().getId().equals(currentUser.getId())) {
                throw new RuntimeException("Unauthorized: You are not the assigned investigator for this case.");
            }
        }

        complaint.setStatus(status);
        Complaint updated = complaintRepository.save(complaint);
        complaintService.logActivity(updated.getId(), "STATUS_CHANGE_TO_" + status, username);
        return updated;
    }
}
