package com.safeline.safeline.repository;

import com.safeline.safeline.model.Complaint;
import com.safeline.safeline.model.ComplaintStatus;
import com.safeline.safeline.model.ComplaintType;
import com.safeline.safeline.model.CommitteePermission;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    Optional<Complaint> findByTrackingId(String trackingId);

    Page<Complaint> findByReporterId(Long reporterId, Pageable pageable);

    Page<Complaint> findByTenantId(Long tenantId, Pageable pageable);
    Page<Complaint> findByTenantIdAndStatus(Long tenantId, ComplaintStatus status, Pageable pageable);
    Page<Complaint> findByTenantIdAndType(Long tenantId, ComplaintType type, Pageable pageable); // Added method
    Page<Complaint> findByTenantIdAndCategoryNameContainingIgnoreCase(Long tenantId, String categoryName, Pageable pageable);
    Page<Complaint> findByTenantIdAndStatusAndCategoryNameContainingIgnoreCase(Long tenantId, ComplaintStatus status, String categoryName, Pageable pageable);
    
    @Query("SELECT c FROM Complaint c " +
           "LEFT JOIN FETCH c.category " +
           "WHERE c.tenant.id = :tenantId AND " +
           "c.type = :type AND " +
           "(c.accusedUser IS NULL OR c.accusedUser.id != :userId) AND " +
           "(:status IS NULL OR c.status = :status) AND " +
           "(:search IS NULL OR LOWER(c.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(c.trackingId) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Complaint> searchByTenantAndType(@Param("tenantId") Long tenantId, @Param("type") ComplaintType type, @Param("status") ComplaintStatus status, @Param("search") String search, @Param("userId") Long userId, Pageable pageable);

    @Query("SELECT c FROM Complaint c " +
           "LEFT JOIN FETCH c.category " +
           "WHERE c.tenant.id = :tenantId AND " +
           "(c.accusedUser IS NULL OR c.accusedUser.id != :userId) AND " +
           "(:status IS NULL OR c.status = :status) AND " +
           "(:search IS NULL OR LOWER(c.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(c.trackingId) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Complaint> searchAdminComplaints(@Param("tenantId") Long tenantId, @Param("status") ComplaintStatus status, @Param("search") String search, @Param("userId") Long userId, Pageable pageable);

    @Query("SELECT c FROM Complaint c " +
           "LEFT JOIN FETCH c.category " +
           "WHERE c.assignedTo.id = :investigatorId AND " +
           "(c.accusedUser IS NULL OR c.accusedUser.id != :investigatorId) AND " +
           "(:status IS NULL OR c.status = :status) AND " +
           "(:search IS NULL OR LOWER(c.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(c.trackingId) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Complaint> searchAssignedComplaints(@Param("investigatorId") Long investigatorId, @Param("status") ComplaintStatus status, @Param("search") String search, Pageable pageable);

    Page<Complaint> findByAssignedToId(Long investigatorId, Pageable pageable);
    Page<Complaint> findByAssignedToIdAndStatus(Long investigatorId, ComplaintStatus status, Pageable pageable);
}