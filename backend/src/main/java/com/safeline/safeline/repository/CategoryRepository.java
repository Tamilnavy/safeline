package com.safeline.safeline.repository;

import com.safeline.safeline.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByTenantId(Long tenantId);
}
