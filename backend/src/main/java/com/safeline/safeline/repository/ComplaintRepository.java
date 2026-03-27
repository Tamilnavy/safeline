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
    
    @Query(value = "SELECT c.* FROM complaints c " +
           "LEFT JOIN categories cat ON cat.id = c.category_id " +
           "WHERE c.tenant_id = :tenantId AND " +
           "c.type = :type AND " +
           "(c.accused_user_id IS NULL OR c.accused_user_id != :userId) AND " +
           "(:status IS NULL OR c.status = :status) AND " +
           "(:search IS NULL OR CAST(c.title AS TEXT) ILIKE CONCAT('%', :search, '%') OR CAST(c.tracking_id AS TEXT) ILIKE CONCAT('%', :search, '%'))",
           countQuery = "SELECT count(*) FROM complaints c " +
                        "WHERE c.tenant_id = :tenantId AND c.type = :type AND " +
                        "(c.accused_user_id IS NULL OR c.accused_user_id != :userId) AND " +
                        "(:status IS NULL OR c.status = :status) AND " +
                        "(:search IS NULL OR CAST(c.title AS TEXT) ILIKE CONCAT('%', :search, '%') OR CAST(c.tracking_id AS TEXT) ILIKE CONCAT('%', :search, '%'))",
           nativeQuery = true)
    Page<Complaint> searchByTenantAndType(@Param("tenantId") Long tenantId, @Param("type") String type, @Param("status") String status, @Param("search") String search, @Param("userId") Long userId, Pageable pageable);

    @Query(value = "SELECT c.* FROM complaints c " +
           "LEFT JOIN categories cat ON cat.id = c.category_id " +
           "WHERE c.tenant_id = :tenantId AND " +
           "(c.accused_user_id IS NULL OR c.accused_user_id != :userId) AND " +
           "(:status IS NULL OR c.status = :status) AND " +
           "(:search IS NULL OR CAST(c.title AS TEXT) ILIKE CONCAT('%', :search, '%') OR CAST(c.tracking_id AS TEXT) ILIKE CONCAT('%', :search, '%'))",
           countQuery = "SELECT count(*) FROM complaints c " +
                        "WHERE c.tenant_id = :tenantId AND " +
                        "(c.accused_user_id IS NULL OR c.accused_user_id != :userId) AND " +
                        "(:status IS NULL OR c.status = :status) AND " +
                        "(:search IS NULL OR CAST(c.title AS TEXT) ILIKE CONCAT('%', :search, '%') OR CAST(c.tracking_id AS TEXT) ILIKE CONCAT('%', :search, '%'))",
           nativeQuery = true)
    Page<Complaint> searchAdminComplaints(@Param("tenantId") Long tenantId, @Param("status") String status, @Param("search") String search, @Param("userId") Long userId, Pageable pageable);

    @Query(value = "SELECT c.* FROM complaints c " +
           "LEFT JOIN categories cat ON cat.id = c.category_id " +
           "WHERE c.assigned_to_id = :investigatorId AND " +
           "(c.accused_user_id IS NULL OR c.accused_user_id != :investigatorId) AND " +
           "(:status IS NULL OR c.status = :status) AND " +
           "(:search IS NULL OR CAST(c.title AS TEXT) ILIKE CONCAT('%', :search, '%') OR CAST(c.tracking_id AS TEXT) ILIKE CONCAT('%', :search, '%'))",
           countQuery = "SELECT count(*) FROM complaints c " +
                        "WHERE c.assigned_to_id = :investigatorId AND " +
                        "(c.accused_user_id IS NULL OR c.accused_user_id != :investigatorId) AND " +
                        "(:status IS NULL OR c.status = :status) AND " +
                        "(:search IS NULL OR CAST(c.title AS TEXT) ILIKE CONCAT('%', :search, '%') OR CAST(c.tracking_id AS TEXT) ILIKE CONCAT('%', :search, '%'))",
           nativeQuery = true)
    Page<Complaint> searchAssignedComplaints(@Param("investigatorId") Long investigatorId, @Param("status") String status, @Param("search") String search, Pageable pageable);

    Page<Complaint> findByAssignedToId(Long investigatorId, Pageable pageable);
    Page<Complaint> findByAssignedToIdAndStatus(Long investigatorId, ComplaintStatus status, Pageable pageable);
}