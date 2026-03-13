package com.safeline.safeline.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ComplaintResponse {

    private Long id;
    private String trackingId;
    private String rawPin;
    private String status;   // String representation of enum
    private LocalDateTime createdAt;
    
    // Additional fields for list view
    private String title;
    private String description;
    private String categoryName;
    private String location;
    private String priority;
    private String classification;
    private String assignedToUsername;
    private Long assignedToId;

}