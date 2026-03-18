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

        logActivity(saved.getId(), "COMPLAINT_SUBMITTED", "REPORTER");

        return saved;
    }

    // ------------------------------------------------
    // TRACK COMPLAINT
    // ------------------------------------------------
    public TrackResponse trackComplaint(TrackRequest request) {

        Complaint complaint =
                complaintRepository.findByTrackingId(request.getTrackingId())
                        .orElseThrow(() -> new RuntimeException("Complaint not found"));

        boolean validPin =
                passwordEncoder.matches(request.getPin(), complaint.getPinHash());

        if (!validPin) {
            throw new RuntimeException("Invalid PIN");
        }

        return TrackResponse.builder()
                .trackingId(complaint.getTrackingId())
                .complaintId(complaint.getId())
                .status(complaint.getStatus().name())
                .build();
    }

    // ------------------------------------------------
    // VERIFY TRACKING
    // ------------------------------------------------
    public boolean verifyTracking(String trackingId, String pin) {

        Complaint complaint =
                complaintRepository.findByTrackingId(trackingId)
                        .orElseThrow(() -> new RuntimeException("Complaint not found"));

        return passwordEncoder.matches(pin, complaint.getPinHash());
    }

    // ------------------------------------------------
    // GET COMPLAINT BY ID
    // ------------------------------------------------
    public Complaint getById(Long id) {
        return complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));
    }

    // ------------------------------------------------
    // GET PUBLIC COMPLAINT (For Tracking)
    // ------------------------------------------------
    public Complaint getPublicComplaint(String trackingId, String pin) {
        Complaint complaint = complaintRepository.findByTrackingId(trackingId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        if (!passwordEncoder.matches(pin, complaint.getPinHash())) {
            throw new RuntimeException("Invalid PIN");
        }

        return complaint;
    }

    // ------------------------------------------------
    // ASSIGN INVESTIGATOR
    // ------------------------------------------------
    public Complaint assignInvestigator(Long complaintId, Long investigatorId) {

        Complaint complaint =
                complaintRepository.findById(complaintId)
                        .orElseThrow(() -> new RuntimeException("Complaint not found"));

        User investigator =
                userRepository.findById(investigatorId)
                        .orElseThrow(() -> new RuntimeException("User not found"));

        complaint.setAssignedTo(investigator);
        complaint.setStatus(ComplaintStatus.ASSIGNED);

        Complaint updated = complaintRepository.save(complaint);

        logActivity(updated.getId(), "INVESTIGATOR_ASSIGNED", getCurrentUser());

        return updated;
    }

    // ------------------------------------------------
    // TRIAGE COMPLAINT (Intake Officer)
    // ------------------------------------------------
    public Complaint triageComplaint(Long complaintId, Priority priority, Classification classification, ComplaintStatus status) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        complaint.setPriority(priority);
        complaint.setClassification(classification);
        if (status != null) {
            complaint.setStatus(status);
        }

        Complaint updated = complaintRepository.save(complaint);
        logActivity(updated.getId(), "TRIAGED_PRIORITY_" + priority + "_CLASS_" + classification, getCurrentUser());
        
        return updated;
    }

    // ------------------------------------------------
    // UPDATE STATUS
    // ------------------------------------------------
    public Complaint updateStatus(Long complaintId, ComplaintStatus status) {

        Complaint complaint =
                complaintRepository.findById(complaintId)
                        .orElseThrow(() -> new RuntimeException("Complaint not found"));

        // Security Check: If investigator, must be assigned
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

        logActivity(updated.getId(), "STATUS_CHANGE_TO_" + status, username);

        return updated;
    }

    // ------------------------------------------------
    // GET MY COMPLAINTS
    // ------------------------------------------------
    public Page<Complaint> getMyComplaints(Long reporterId, Pageable pageable) {
        return complaintRepository.findByReporterId(reporterId, pageable);
    }

    // ------------------------------------------------
    // GET ALL COMPLAINTS
    // ------------------------------------------------
    public Page<Complaint> getAllComplaints(Long tenantId, ComplaintStatus status, String categoryName, Pageable pageable) {
        if (categoryName != null && !categoryName.isEmpty()) {
            if (status != null) {
                return complaintRepository.findByTenantIdAndStatusAndCategoryNameContainingIgnoreCase(tenantId, status, categoryName, pageable);
            }
            return complaintRepository.findByTenantIdAndCategoryNameContainingIgnoreCase(tenantId, categoryName, pageable);
        }
        
        if (status != null) {
            return complaintRepository.findByTenantIdAndStatus(tenantId, status, pageable);
        }
        return complaintRepository.findByTenantId(tenantId, pageable);
    }

    // ------------------------------------------------
    // INTERNAL: GET ALL COMPLAINTS (Non-paginated)
    // ------------------------------------------------
    public List<Complaint> getAllComplaintsInternal(Long tenantId) {
        return complaintRepository.findAll().stream()
                .filter(c -> c.getTenant().getId().equals(tenantId))
                .toList();
    }

    // ------------------------------------------------
    // GET ASSIGNED COMPLAINTS (Investigator Workspace)
    // ------------------------------------------------
    public Page<Complaint> getAssignedComplaints(Long investigatorId, ComplaintStatus status, Pageable pageable) {
        if (status != null) {
            return complaintRepository.findByAssignedToIdAndStatus(investigatorId, status, pageable);
        }
        return complaintRepository.findByAssignedToId(investigatorId, pageable);
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
    private void logActivity(Long complaintId, String action, String performedBy) {

        ComplaintActivityLog log = new ComplaintActivityLog();

        log.setComplaintId(complaintId);
        log.setAction(action);
        log.setPerformedBy(performedBy);
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