package com.safeline.safeline.repository;

import com.safeline.safeline.model.SecurityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SecurityLogRepository extends JpaRepository<SecurityLog, Long> {
    List<SecurityLog> findByTenantIdOrderByTimestampDesc(Long tenantId);
    List<SecurityLog> findAllByOrderByTimestampDesc(); // For super admin to see all logs
}
