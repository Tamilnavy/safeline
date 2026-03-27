package com.safeline.safeline.service;

import com.safeline.safeline.model.*;
import com.safeline.safeline.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ComplaintQueryService {

    private final ComplaintRepository complaintRepository;
    private final PasswordEncoder passwordEncoder;

    public Complaint getById(Long id) {
        return complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));
    }

    public Page<Complaint> getMyComplaints(Long reporterId, Pageable pageable) {
        return complaintRepository.findByReporterId(reporterId, pageable);
    }

    public Page<Complaint> getComplaintsByType(Long tenantId, ComplaintType type, ComplaintStatus status, String search, Long userId, Pageable pageable) {
        System.out.println("DEBUG: Oversight Query (By Type)");
        System.out.println("DEBUG: TenantId=" + tenantId + ", Type=" + type + ", Status=" + status + ", UserId=" + userId);
        return complaintRepository.searchByTenantAndType(tenantId, type, status, search, userId, pageable);
    }

    public Page<Complaint> getAllComplaints(Long tenantId, ComplaintStatus status, String search, Long userId, Pageable pageable) {
        System.out.println("DEBUG: Oversight Query (All)");
        System.out.println("DEBUG: TenantId=" + tenantId + ", Status=" + status + ", UserId=" + userId);
        return complaintRepository.searchAdminComplaints(tenantId, status, search, userId, pageable);
    }

    public List<Complaint> getAllComplaintsInternal(Long tenantId) {
        System.out.println("DEBUG: Internal Listing (Metrics) for TenantId=" + tenantId);
        return complaintRepository.findAll().stream()
                .filter(c -> c.getTenant().getId().equals(tenantId))
                .toList();
    }

    public Page<Complaint> getAssignedComplaints(Long investigatorId, ComplaintStatus status, String search, Pageable pageable) {
        return complaintRepository.searchAssignedComplaints(investigatorId, status, search, pageable);
    }

    public boolean verifyTracking(String trackingId, String pin) {
        Complaint complaint = complaintRepository.findByTrackingId(trackingId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));
        return passwordEncoder.matches(pin, complaint.getPinHash());
    }

    public Complaint getPublicComplaint(String trackingId, String pin) {
        Complaint complaint = complaintRepository.findByTrackingId(trackingId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        if (!passwordEncoder.matches(pin, complaint.getPinHash())) {
            throw new RuntimeException("Invalid PIN");
        }
        return complaint;
    }

    public Map<String, Long> getMetricsForTenant(Long tenantId) {
        List<Complaint> all = getAllComplaintsInternal(tenantId);
        Map<String, Long> metrics = new HashMap<>();
        metrics.put("total", (long) all.size());
        metrics.put("resolved", all.stream().filter(c -> c.getStatus() == ComplaintStatus.RESOLVED).count());
        metrics.put("pending", all.stream().filter(c -> c.getStatus() != ComplaintStatus.RESOLVED && c.getStatus() != ComplaintStatus.CLOSED).count());
        return metrics;
    }
}
