package com.safeline.safeline.mapper;

import com.safeline.safeline.dto.*;
import com.safeline.safeline.model.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import java.util.List;

@Component
public class ComplaintMapper {

    public ComplaintResponse mapToResponse(Complaint c) {
        ComplaintResponse res = new ComplaintResponse();
        res.setId(c.getId());
        res.setTrackingId(c.getTrackingId());
        res.setTitle(c.getTitle());
        res.setDescription(c.getDescription());
        res.setStatus(c.getStatus() != null ? c.getStatus().name() : "SUBMITTED");
        res.setType(c.isSensitive() ? "SENSITIVE" : "NORMAL");
        res.setCreatedAt(c.getCreatedAt());
        res.setCategoryName(c.getCategory() != null ? c.getCategory().getName() : "General");
        res.setLocation(c.getLocation());
        res.setPriority(c.getPriority() != null ? c.getPriority().name() : "NORMAL");
        res.setClassification(c.getClassification() != null ? c.getClassification().name() : "GENERAL");
        res.setAnonymous(c.isAnonymous());
        res.setSensitive(c.isSensitive());
        
        boolean maskReporter = c.isAnonymous();
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated()) {
                String currentUsername = auth.getName();
                if (c.getReporter() != null && c.getReporter().getUsername().equals(currentUsername)) {
                    maskReporter = false;
                }
            }
        } catch (Exception ignored) {}

        res.setReporterUsername(maskReporter ? "Anonymous" : (c.getReporter() != null ? c.getReporter().getUsername() : "Public User"));
        res.setReporterId(maskReporter ? null : (c.getReporter() != null ? c.getReporter().getId() : null));
        res.setReporterEmployeeId(maskReporter ? null : (c.getReporter() != null ? c.getReporter().getEmployeeId() : null));
        
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
