package com.safeline.safeline.repository;

import com.safeline.safeline.model.ComplaintEvidence;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ComplaintEvidenceRepository extends JpaRepository<ComplaintEvidence, Long> {
    java.util.List<ComplaintEvidence> findByComplaintId(Long complaintId);
}
