package com.safeline.safeline.controller;

import com.safeline.safeline.model.Complaint;
import com.safeline.safeline.model.ComplaintEvidence;
import com.safeline.safeline.repository.ComplaintEvidenceRepository;
import com.safeline.safeline.repository.ComplaintRepository;
import com.safeline.safeline.service.FileStorageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/evidence")
public class ComplaintEvidenceController {

    private final FileStorageService fileStorageService;
    private final ComplaintEvidenceRepository evidenceRepository;
    private final ComplaintRepository complaintRepository;

    public ComplaintEvidenceController(FileStorageService fileStorageService, 
                                     ComplaintEvidenceRepository evidenceRepository,
                                     ComplaintRepository complaintRepository) {
        this.fileStorageService = fileStorageService;
        this.evidenceRepository = evidenceRepository;
        this.complaintRepository = complaintRepository;
    }

    @PostMapping("/upload/{complaintId}")
    public ResponseEntity<String> upload(@PathVariable Long complaintId, @RequestParam("file") MultipartFile file) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        verifyAccess(complaint);

        String filename = fileStorageService.save(file);

        ComplaintEvidence evidence = new ComplaintEvidence();
        evidence.setComplaint(complaint);
        evidence.setFileName(file.getOriginalFilename());
        evidence.setFilePath(filename);
        evidence.setContentType(file.getContentType());
        
        evidenceRepository.save(evidence);

        return ResponseEntity.ok("File uploaded successfully: " + filename);
    }

    @GetMapping("/list/{complaintId}")
    public ResponseEntity<java.util.List<ComplaintEvidence>> list(@PathVariable Long complaintId) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));
        
        verifyAccess(complaint);

        return ResponseEntity.ok(complaint.getEvidences());
    }

    @GetMapping("/download/{evidenceId}")
    public ResponseEntity<org.springframework.core.io.Resource> download(@PathVariable Long evidenceId) {
        ComplaintEvidence evidence = evidenceRepository.findById(evidenceId)
                .orElseThrow(() -> new RuntimeException("Evidence not found"));
        
        verifyAccess(evidence.getComplaint());

        try {
            byte[] decryptedBytes = fileStorageService.loadAsBytes(evidence.getFilePath());
            org.springframework.core.io.ByteArrayResource resource = new org.springframework.core.io.ByteArrayResource(decryptedBytes);
            
            return ResponseEntity.ok()
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + evidence.getFileName() + "\"")
                    .contentType(org.springframework.http.MediaType.parseMediaType(evidence.getContentType()))
                    .body(resource);
        } catch (Exception e) {
            throw new RuntimeException("Could not read or decrypt the file!");
        }
    }

    private void verifyAccess(Complaint complaint) {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new RuntimeException("Unauthorized to access this complaint evidence.");
        }

        // Check if user is an Anonymous Reporter with a token specifically for this complaint
        if (auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ANONYMOUS_REPORTER"))) {
            Object credentials = auth.getCredentials(); // Custom tracking token logic might store complaint ID here or we just trust the filter
            // Relying on TenantContext or the fact that the token was explicitly generated for this ComplaintId
            // The safest check is that the token's subject is the tracking ID
            if (!auth.getName().equals(complaint.getTrackingId())) {
                throw new RuntimeException("Access Denied: Token tracking ID does not match the requested complaint.");
            }
            return; // Authorized
        }

        // Note: For Investigators (ROLE_INVESTIGATOR, ORG_ADMIN, etc.), 
        // the Hibernate filter already scopes complaintRepository.findById to their Tenant.
        // As long as they found it, they have access to the tenant's data.
        // We could add further checks here if an Investigator can only see specific assigned complaints.
    }
}
