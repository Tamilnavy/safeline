package com.safeline.safeline.repository;

import com.safeline.safeline.model.SLAPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface SLAPolicyRepository extends JpaRepository<SLAPolicy, Long> {
    Optional<SLAPolicy> findByCategoryId(Long categoryId);
}
