package com.safeline.safeline.repository;

import com.safeline.safeline.model.ComplaintActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ComplaintActivityLogRepository
        extends JpaRepository<ComplaintActivityLog, Long> {

    List<ComplaintActivityLog> findByComplaintId(Long complaintId);

}