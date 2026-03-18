package com.safeline.safeline.repository;

import com.safeline.safeline.model.Complaint;
import com.safeline.safeline.model.ComplaintStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    Optional<Complaint> findByTrackingId(String trackingId);

    Page<Complaint> findByReporterId(Long reporterId, Pageable pageable);

    Page<Complaint> findByTenantId(Long tenantId, Pageable pageable);
    Page<Complaint> findByTenantIdAndStatus(Long tenantId, ComplaintStatus status, Pageable pageable);
    Page<Complaint> findByTenantIdAndCategoryNameContainingIgnoreCase(Long tenantId, String categoryName, Pageable pageable);
    Page<Complaint> findByTenantIdAndStatusAndCategoryNameContainingIgnoreCase(Long tenantId, ComplaintStatus status, String categoryName, Pageable pageable);
    Page<Complaint> findByAssignedToId(Long investigatorId, Pageable pageable);
    Page<Complaint> findByAssignedToIdAndStatus(Long investigatorId, ComplaintStatus status, Pageable pageable);
}