package com.safeline.safeline.controller;

import com.safeline.safeline.model.ComplaintEvidence;
import com.safeline.safeline.repository.ComplaintEvidenceRepository;
import com.safeline.safeline.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Path;
import java.util.List;

@RestController
@RequestMapping("/api/evidence")
@RequiredArgsConstructor
public class EvidenceController {

    private final ComplaintEvidenceRepository evidenceRepository;
    private final FileStorageService fileStorageService;

    @GetMapping("/complaint/{complaintId}")
    @PreAuthorize("hasAnyAuthority('LEVEL_1', 'LEVEL_2')")
    public ResponseEntity<List<ComplaintEvidence>> getEvidence(@PathVariable Long complaintId) {
        return ResponseEntity.ok(evidenceRepository.findByComplaintId(complaintId));
    }

    @GetMapping("/download/{id}")
    @PreAuthorize("hasAnyAuthority('LEVEL_1', 'LEVEL_2')")
    public ResponseEntity<Resource> download(@PathVariable Long id) {
        ComplaintEvidence evidence = evidenceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Evidence not found"));

        try {
            Path file = fileStorageService.load(evidence.getFilePath());
            Resource resource = new UrlResource(file.toUri());

            if (resource.exists() || resource.isReadable()) {
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + evidence.getFileName() + "\"")
                        .contentType(MediaType.parseMediaType(evidence.getContentType()))
                        .body(resource);
            } else {
                throw new RuntimeException("Could not read the file!");
            }
        } catch (Exception e) {
            throw new RuntimeException("Error: " + e.getMessage());
        }
    }
}
