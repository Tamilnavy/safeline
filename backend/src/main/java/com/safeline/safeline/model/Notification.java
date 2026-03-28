package com.safeline.safeline.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "notifications")
@Data
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // We can target users by username since that's their unique identifier in this architecture
    @Column(nullable = false)
    private String recipientUsername;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    // Optional constraint to a specific complaint to allow deep-linking
    @Column(name = "complaint_id", nullable = true)
    private Long complaintId;

    @Column(name = "is_read", nullable = false)
    private boolean isRead = false;

    private LocalDateTime createdAt;
    
    // Optional context filtering 
    @Column(name = "tenant_id")
    private Long tenantId;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
    }
}
