package com.safeline.safeline.dto;

import lombok.Data;

@Data
public class MessageRequest {
    private String content;
    private String trackingId; // Required for anonymous reporters
    private String pin;        // Required for anonymous reporters
}
