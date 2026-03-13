package com.safeline.safeline.dto;

import lombok.Data;

@Data
public class CategoryRequest {
    private String name;
    private String description;
    private int slaDays;
}
