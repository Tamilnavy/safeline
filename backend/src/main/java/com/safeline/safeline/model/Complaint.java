package com.safeline.safeline.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

import org.hibernate.annotations.Filter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "complaints")
@lombok.Getter
@lombok.Setter
@lombok.EqualsAndHashCode(onlyExplicitlyIncluded = true)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Filter(
        name = "tenantFilter",
        condition = "tenant_id = :tenantId"
)
public class Complaint {

    // Used temporarily to return PIN to user (not stored in DB)
    @Transient
    private String rawPin;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @lombok.EqualsAndHashCode.Include
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    private String location;

    private boolean anonymous = true;

    @Column(unique = true, columnDefinition = "TEXT")
    private String trackingId;

    private String pinHash;

    // Complaint lifecycle status
    @Enumerated(EnumType.STRING)
    private ComplaintStatus status = ComplaintStatus.SUBMITTED;

    @Enumerated(EnumType.STRING)
    private Priority priority = Priority.NORMAL;

    @Enumerated(EnumType.STRING)
    private Classification classification = Classification.GENERAL;

    private LocalDateTime slaDueAt;

    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id")
    private User reporter;

    private String anonymousId;

    @Enumerated(EnumType.STRING)
    private ComplaintType type = ComplaintType.NORMAL;

    @Column(name = "is_sensitive", nullable = false, columnDefinition = "boolean default false")
    private boolean isSensitive = false;

    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "accused_user_id")
    private User accusedUser;

    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id")
    private User assignedTo;

    @OneToMany(mappedBy = "complaint", cascade = CascadeType.ALL)
    private List<ComplaintEvidence> evidences;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    // Automatically set createdAt
    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    // Automatically update updatedAt
    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}