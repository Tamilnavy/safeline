package com.safeline.safeline.service;

import com.safeline.safeline.model.SecurityLog;
import com.safeline.safeline.model.Tenant;
import com.safeline.safeline.repository.SecurityLogRepository;
import com.safeline.safeline.repository.TenantRepository;
import com.safeline.safeline.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SecurityLogService {

    private final SecurityLogRepository securityLogRepository;
    private final TenantRepository tenantRepository;

    public List<SecurityLog> getSecurityLogs() {
        Long currentTenantId = TenantContext.getCurrentTenant();
        if (currentTenantId != null) {
            return securityLogRepository.findByTenantIdOrderByTimestampDesc(currentTenantId);
        }
        return securityLogRepository.findAllByOrderByTimestampDesc();
    }

    @Transactional
    public void logEvent(String event, String username, String ipAddress, String type, String severity, Long tenantId) {
        SecurityLog log = new SecurityLog();
        log.setEvent(event);
        log.setUsername(username);
        log.setIpAddress(ipAddress);
        log.setType(type);
        log.setSeverity(severity);
        log.setTimestamp(LocalDateTime.now());
        
        if (tenantId != null) {
            Tenant tenant = tenantRepository.findById(tenantId).orElse(null);
            log.setTenant(tenant);
        }

        securityLogRepository.save(log);
    }
}
