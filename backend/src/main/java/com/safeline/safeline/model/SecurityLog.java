package com.safeline.safeline.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "security_logs")
@Data
@NoArgsConstructor
public class SecurityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String event;       // e.g., "ADMIN_LOGIN_SUCCESS", "TENANT_PROVISIONED"

    @Column(nullable = false)
    private String username;    // actor's username

    @Column(nullable = false)
    private String ipAddress;   // actor's ip

    @Column(nullable = false)
    private String type;        // e.g., "AUTH", "ADMIN", "SYSTEM", "SECURITY"

    @Column(nullable = false)
    private String severity;    // e.g., "INFO", "SUCCESS", "WARNING", "DANGER"

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = true) // true because system events might be cross-tenant
    private Tenant tenant;
}
