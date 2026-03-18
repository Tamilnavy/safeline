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

    public List<Complaint> getAllComplaintsInternal(Long tenantId) {
        return complaintRepository.findAll().stream()
                .filter(c -> c.getTenant().getId().equals(tenantId))
                .toList();
    }

    public Page<Complaint> getAssignedComplaints(Long investigatorId, ComplaintStatus status, Pageable pageable) {
        if (status != null) {
            return complaintRepository.findByAssignedToIdAndStatus(investigatorId, status, pageable);
        }
        return complaintRepository.findByAssignedToId(investigatorId, pageable);
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
