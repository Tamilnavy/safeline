package com.safeline.safeline.service;

import com.safeline.safeline.dto.TrackRequest;
import com.safeline.safeline.dto.TrackResponse;
import com.safeline.safeline.model.*;
import com.safeline.safeline.repository.*;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.UUID;

import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;
    private final ComplaintActivityLogRepository logRepository;
    private final SLAPolicyRepository slaPolicyRepository;
    private final ComplaintEvidenceRepository evidenceRepository;
    private final FileStorageService fileStorageService;
    private final PasswordEncoder passwordEncoder;

    private String getCurrentUser() {
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return auth.getName();
        }
        return "REPORTER";
    }

    // ------------------------------------------------
    // CREATE COMPLAINT
    // ------------------------------------------------
    public Complaint createComplaint(Complaint complaint, List<org.springframework.web.multipart.MultipartFile> files) {

        String trackingId = generateTrackingId();
        String pin = generatePin();

        complaint.setTrackingId(trackingId);
        complaint.setPinHash(passwordEncoder.encode(pin));
        complaint.setRawPin(pin);

        complaint.setStatus(ComplaintStatus.SUBMITTED);
        
        // Dynamic SLA calculation
        int slaDays = 2; // Default 48 hours
        if (complaint.getCategory() != null) {
            slaDays = slaPolicyRepository.findByCategoryId(complaint.getCategory().getId())
                    .map(SLAPolicy::getResolutionTimeDays)
                    .orElse(2);
        }
        complaint.setSlaDueAt(LocalDateTime.now().plusDays(slaDays));

        Complaint saved = complaintRepository.save(complaint);

        // Handle Evidence Files
        if (files != null && !files.isEmpty()) {
            for (org.springframework.web.multipart.MultipartFile file : files) {
                String savedFileName = fileStorageService.save(file);
                
                ComplaintEvidence evidence = new ComplaintEvidence();
                evidence.setComplaint(saved);
                evidence.setFileName(file.getOriginalFilename());
                evidence.setFilePath(savedFileName);
                evidence.setContentType(file.getContentType());
                evidence.setCreatedAt(LocalDateTime.now());
                
                evidenceRepository.save(evidence);
            }
        }

        logActivity(saved.getId(), "COMPLAINT_SUBMITTED", "REPORTER", "New case submitted by reporter.");

        return saved;
    }

    // ------------------------------------------------
    // GET ACTIVITY LOGS
    // ------------------------------------------------
    public List<ComplaintActivityLog> getActivityLogs(Long complaintId) {

        return logRepository.findByComplaintId(complaintId);
    }

    // ------------------------------------------------
    // GENERATE TRACKING ID
    // ------------------------------------------------
    private String generateTrackingId() {

        return "CMP-" + UUID.randomUUID().toString()
                .substring(0, 8)
                .toUpperCase();
    }

    // ------------------------------------------------
    // GENERATE PIN
    // ------------------------------------------------
    private String generatePin() {

        Random random = new Random();
        int pin = 1000 + random.nextInt(9000);

        return String.valueOf(pin);
    }

    // ------------------------------------------------
    // ACTIVITY LOG
    // ------------------------------------------------
    public void logActivity(Long complaintId, String action, String performedBy) {
        logActivity(complaintId, action, performedBy, null);
    }

    public void logActivity(Long complaintId, String action, String performedBy, String detail) {
        ComplaintActivityLog log = new ComplaintActivityLog();
        log.setComplaintId(complaintId);
        log.setAction(action);
        log.setPerformedBy(performedBy);
        log.setDetail(detail);
        log.setTimestamp(LocalDateTime.now());
        logRepository.save(log);
    }

    // ------------------------------------------------
    // SLA ESCALATION
    // ------------------------------------------------
    public void checkAndEscalateSLA() {
        List<Complaint> overdue = complaintRepository.findAll().stream()
                .filter(c -> c.getStatus() != ComplaintStatus.RESOLVED && 
                            c.getStatus() != ComplaintStatus.CLOSED &&
                            c.getSlaDueAt() != null && 
                            c.getSlaDueAt().isBefore(LocalDateTime.now()))
                .toList();
        
        for (Complaint c : overdue) {
            logActivity(c.getId(), "SLA_ESCALATED", "SYSTEM");
        }
    }
}