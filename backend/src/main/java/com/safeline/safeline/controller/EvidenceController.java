package com.safeline.safeline.controller;

import com.safeline.safeline.model.*;
import com.safeline.safeline.repository.*;
import com.safeline.safeline.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.MediaType;

@RestController
@RequestMapping("/api/complaints")
@RequiredArgsConstructor
public class EvidenceController {

    private final ComplaintEvidenceRepository evidenceRepository;
    private final FileStorageService fileStorageService;
    private final UserRepository userRepository;

    @GetMapping("/evidence/{id}/download")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<byte[]> downloadEvidence(@PathVariable Long id) {
        ComplaintEvidence evidence = evidenceRepository.findById(id).orElse(null);
        if (evidence == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        
        Complaint complaint = evidence.getComplaint();
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userRepository.getAuthenticatedUser(auth.getName());
        
        boolean isSuperAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("SUPER_ADMIN"));
        boolean isCommitteeMember = currentUser.getCommitteePermissions() != null && 
            (currentUser.getCommitteePermissions().contains(CommitteePermission.COMMITTEE_LEAD) || 
             currentUser.getCommitteePermissions().contains(CommitteePermission.ESCALATION_HEAD));
        
        boolean isHandler = complaint.getAssignedTo() != null && complaint.getAssignedTo().getId().equals(currentUser.getId());
        boolean isReporter = complaint.getReporter() != null && complaint.getReporter().getId().equals(currentUser.getId());

        if (!isSuperAdmin && !isCommitteeMember && !isHandler && !isReporter) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        byte[] content = fileStorageService.loadAsBytes(evidence.getFilePath());
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"" + evidence.getFileName() + "\"")
                .contentType(MediaType.parseMediaType(evidence.getContentType()))
                .body(content);
    }
}
