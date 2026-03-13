package com.safeline.safeline.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PlatformMetricsDTO {
    private long totalTenants;
    private long totalComplaints;
    private long totalUsers;
    private long activeOrganizations;
}
