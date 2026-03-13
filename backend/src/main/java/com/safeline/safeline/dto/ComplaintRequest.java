package com.safeline.safeline.dto;

import lombok.Data;

@Data
public class ComplaintRequest {
    private String title;
    private String description;
    private Long categoryId;
    private String location;
    private boolean anonymous;
}
