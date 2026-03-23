package com.safeline.safeline.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Entity
@Table(name = "hierarchy_levels", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"technicalId", "tenant_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HierarchyLevel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String technicalId; // e.g., LEVEL_1, LEVEL_1711234567

    @Column(nullable = false)
    private String name;

    private int orderIndex;

    private boolean isDefault;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id")
    private Tenant tenant;
}
