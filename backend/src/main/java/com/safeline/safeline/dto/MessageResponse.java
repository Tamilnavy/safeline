package com.safeline.safeline.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class MessageResponse {
    private Long id;
    private String content;
    private String senderDisplayName;
    private String senderRole;
    private LocalDateTime createdAt;
    private Long complaintId;
}
