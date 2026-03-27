package com.safeline.safeline.repository;

import com.safeline.safeline.model.AnonymousMapping;
import com.safeline.safeline.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface AnonymousMappingRepository extends JpaRepository<AnonymousMapping, Long> {
    Optional<AnonymousMapping> findByAnonymousId(String anonymousId);
    Optional<AnonymousMapping> findByUser_IdAndTenant_Id(Long userId, Long tenantId);
}
