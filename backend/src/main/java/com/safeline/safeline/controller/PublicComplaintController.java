package com.safeline.safeline.controller;

import com.safeline.safeline.dto.*;
import com.safeline.safeline.model.*;
import com.safeline.safeline.repository.*;
import com.safeline.safeline.service.*;
import com.safeline.safeline.mapper.ComplaintMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.MediaType;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/complaints")
@RequiredArgsConstructor
public class PublicComplaintController {

    private final ComplaintService complaintService;
    private final ComplaintQueryService complaintQueryService;
    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ComplaintMapper mapper;
    private final ObjectMapper objectMapper;

    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getCategories(
            @RequestHeader(value = "X-Tenant-Id", required = false) String domain) {
        String effectiveDomain = (domain == null || domain.isEmpty() || "undefined".equals(domain) || "null".equals(domain)) ? "default" : domain;
        Tenant tenant = tenantRepository.findByDomain(effectiveDomain)
                .orElseGet(() -> tenantRepository.findByDomain("default").orElse(null));
        if (tenant == null) return ResponseEntity.ok(List.of());
        return ResponseEntity.ok(categoryRepository.findByTenantId(tenant.getId()));
    }

    @GetMapping("/potential-accused")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Map<String, Object>>> getPotentialAccused(
            @RequestHeader(value = "X-Tenant-Id", required = false) String domain) {
        String effectiveDomain = (domain == null || domain.isEmpty() || "undefined".equals(domain) || "null".equals(domain)) ? "default" : domain;
        Tenant tenant = tenantRepository.findByDomain(effectiveDomain)
                .orElseGet(() -> tenantRepository.findByDomain("default").orElse(null));
        if (tenant == null) return ResponseEntity.ok(List.of());
        
        List<User> users = userRepository.findByTenantId(tenant.getId());
        return ResponseEntity.ok(users.stream().map(u -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", u.getId());
            map.put("fullName", u.getFullName());
            map.put("username", u.getUsername());
            return map;
        }).toList());
    }

    @PostMapping(value = "/submit", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
    public ResponseEntity<ComplaintResponse> submit(
            @RequestPart("request") String requestStr,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            @RequestHeader(value = "X-Tenant-Id", required = false) String domain) throws Exception {
        ComplaintRequest request = objectMapper.readValue(requestStr, ComplaintRequest.class);
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User reporter = null;
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            try { reporter = userRepository.getAuthenticatedUser(auth.getName()); } catch (Exception ignored) {}
        }

        Tenant tenant;
        if (reporter != null && reporter.getTenant() != null) {
            tenant = reporter.getTenant();
        } else {
            tenant = tenantRepository.findByDomain(domain != null && !domain.isEmpty() && !"null".equals(domain) && !"undefined".equals(domain) ? domain : "default")
                    .orElseThrow(() -> new RuntimeException("Tenant not found"));
        }
        
        Complaint complaint = new Complaint();
        complaint.setTitle(request.getTitle());
        complaint.setDescription(request.getDescription());
        complaint.setLocation(request.getLocation());
        complaint.setAnonymous(request.isAnonymous());
        complaint.setSensitive(request.isSensitive());
        complaint.setTenant(tenant);
        complaint.setReporter(reporter);

        if (request.getCategoryId() != null) {
            categoryRepository.findById(request.getCategoryId()).ifPresent(complaint::setCategory);
        }

        if (request.getType() != null && !request.getType().isEmpty()) {
            try {
                ComplaintType requestedType = ComplaintType.valueOf(request.getType());
                complaint.setType(requestedType);
                complaint.setSensitive(requestedType == ComplaintType.SENSITIVE);
            } catch (Exception ignored) {}
        } else {
            complaint.setType(complaint.isSensitive() ? ComplaintType.SENSITIVE : ComplaintType.NORMAL);
        }

        Complaint saved = complaintService.createComplaint(complaint, files);
        ComplaintResponse response = new ComplaintResponse();
        response.setId(saved.getId());
        response.setTrackingId(saved.getTrackingId());
        response.setRawPin(saved.getRawPin());
        response.setStatus(saved.getStatus().name());
        response.setCreatedAt(saved.getCreatedAt());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/track")
    public ResponseEntity<Boolean> track(@RequestParam String trackingId, @RequestParam String pin) {
        return ResponseEntity.ok(complaintQueryService.verifyTracking(trackingId, pin));
    }

    @GetMapping("/public/{trackingId}")
    public ResponseEntity<ComplaintResponse> getPublic(@PathVariable String trackingId, @RequestParam String pin) {
        Complaint c = complaintQueryService.getPublicComplaint(trackingId, pin);
        return ResponseEntity.ok(mapper.mapToResponse(c));
    }

    @GetMapping("/my")
    public ResponseEntity<Page<ComplaintResponse>> getMyComplaints(Pageable pageable) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        User user = userRepository.getAuthenticatedUser(auth.getName());
        Page<Complaint> complaints = complaintQueryService.getMyComplaints(user.getId(), pageable);
        return ResponseEntity.ok(complaints.map(mapper::mapToResponse));
    }
}
