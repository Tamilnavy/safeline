package com.safeline.safeline.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrackResponse {

    private String token;

    private String trackingId;

    private Long complaintId;

    private String status;
}