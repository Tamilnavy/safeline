package com.safeline.safeline.repository;

import com.safeline.safeline.model.ComplaintMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ComplaintMessageRepository extends JpaRepository<ComplaintMessage, Long> {
    List<ComplaintMessage> findByComplaintIdOrderByCreatedAtAsc(Long complaintId);
}
