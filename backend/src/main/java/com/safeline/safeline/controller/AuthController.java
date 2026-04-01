package com.safeline.safeline.controller;

import com.safeline.safeline.dto.AuthRequest;
import com.safeline.safeline.dto.AuthResponse;
import com.safeline.safeline.dto.TrackRequest;
import com.safeline.safeline.dto.TrackResponse;
import com.safeline.safeline.model.*;
import com.safeline.safeline.repository.ComplaintRepository;
import com.safeline.safeline.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import com.safeline.safeline.service.OtpService;
import com.safeline.safeline.repository.TenantRepository;
import com.safeline.safeline.repository.UserRepository;

import java.util.Map;
import java.util.Optional;
import java.util.List;
import java.util.HashMap;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final ComplaintRepository complaintRepository;
    private final PasswordEncoder passwordEncoder;
    private final OtpService otpService;
    private final UserDetailsService userDetailsService;
    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;

    // ------------------------------------------------
    // LOGIN
    // ------------------------------------------------
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();

        String token = jwtUtils.generateToken(userDetails);

        AuthResponse response = new AuthResponse();
        response.setToken(token);
        response.setUsername(userDetails.getUsername());
        
        try {
             Long userTenantId = (userDetails instanceof com.safeline.safeline.security.TenantAwareUserDetails) ?
                     ((com.safeline.safeline.security.TenantAwareUserDetails) userDetails).getTenantId() : null;
             User u = userTenantId != null ? 
                      userRepository.findByUsernameAndTenantId(userDetails.getUsername(), userTenantId).orElse(null) :
                      userRepository.findByUsername(userDetails.getUsername()).stream().filter(user -> user.getTenant() == null).findFirst().orElse(null);
             if (u != null) {
                 response.setRole(u.getRole());
                 response.setCommitteePermissions(u.getCommitteePermissions());
             }
        } catch (Exception ignored) {}

        if (userDetails instanceof com.safeline.safeline.security.TenantAwareUserDetails tenantUser) {
            Long tenantId = tenantUser.getTenantId();
            response.setTenantId(tenantId);
            if (tenantId != null) {
                tenantRepository.findById(tenantId).ifPresent(t -> response.setTenantDomain(t.getDomain()));
            }
        }

        return ResponseEntity.ok(response);
    }

    // ------------------------------------------------
    // TRACK COMPLAINT
    // ------------------------------------------------
    @PostMapping("/track")
    public ResponseEntity<TrackResponse> trackComplaint(@RequestBody TrackRequest request) {

        System.out.println("DEBUG: Tracking attempt for ID: " + request.getTrackingId());
        
        Optional<Complaint> complaintOpt =
                complaintRepository.findByTrackingId(request.getTrackingId());

        if (complaintOpt.isPresent()) {
            Complaint complaint = complaintOpt.get();
            System.out.println("DEBUG: Complaint found. Tenant ID: " + complaint.getTenant().getId());

            boolean validPin =
                    passwordEncoder.matches(request.getPin(), complaint.getPinHash());
            
            System.out.println("DEBUG: PIN valid: " + validPin);

            if (validPin) {

                String token = jwtUtils.generateAnonymousToken(
                        complaint.getTrackingId(),
                        complaint.getId(),
                        complaint.getTenant().getId()
                );

                TrackResponse response = new TrackResponse();

                response.setToken(token);
                response.setTrackingId(complaint.getTrackingId());
                response.setComplaintId(complaint.getId());

                // FIX HERE
                response.setStatus(complaint.getStatus().name());

                return ResponseEntity.ok(response);
            }
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    // ------------------------------------------------
    // GENERATE OTP
    // ------------------------------------------------
    @PostMapping("/otp/generate")
    public ResponseEntity<?> generateOtp(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        if (username == null || username.isEmpty()) {
            return ResponseEntity.badRequest().body("Username is required");
        }
        
        otpService.generateOtp(username);
        return ResponseEntity.ok(Map.of("message", "OTP generated successfully (check console)"));
    }

    // ------------------------------------------------
    // VERIFY OTP
    // ------------------------------------------------
    @PostMapping("/otp/verify")
    public ResponseEntity<AuthResponse> verifyOtp(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String otp = request.get("otp");

        if (otpService.verifyOtp(username, otp)) {
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            String token = jwtUtils.generateToken(userDetails);

            AuthResponse response = new AuthResponse();
            response.setToken(token);
            response.setUsername(userDetails.getUsername());
            try {
                 Long userTenantId = (userDetails instanceof com.safeline.safeline.security.TenantAwareUserDetails) ?
                         ((com.safeline.safeline.security.TenantAwareUserDetails) userDetails).getTenantId() : null;
                 User u = userTenantId != null ? 
                          userRepository.findByUsernameAndTenantId(userDetails.getUsername(), userTenantId).orElse(null) :
                          userRepository.findByUsername(userDetails.getUsername()).stream().filter(user -> user.getTenant() == null).findFirst().orElse(null);
                 if (u != null) {
                     response.setRole(u.getRole());
                     response.setCommitteePermissions(u.getCommitteePermissions());
                 }
            } catch (Exception ignored) {}

            if (userDetails instanceof com.safeline.safeline.security.TenantAwareUserDetails) {
                response.setTenantId(
                        ((com.safeline.safeline.security.TenantAwareUserDetails) userDetails)
                                .getTenantId()
                );
            }

            return ResponseEntity.ok(response);
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    // ------------------------------------------------
    // DEBUG / REPAIR
    // ------------------------------------------------
    @GetMapping("/debug/repair-users")
    public ResponseEntity<?> repairUsers(@RequestParam String domain) {
        Optional<com.safeline.safeline.model.Tenant> tenantOpt = tenantRepository.findByDomain(domain);
        if (tenantOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Tenant domain not found: " + domain);
        }
        
        com.safeline.safeline.model.Tenant targetTenant = tenantOpt.get();
        List<com.safeline.safeline.model.User> orphans = userRepository.findAll().stream()
                .filter(u -> u.getTenant() == null && !u.getUsername().equals("admin"))
                .toList();
        
        orphans.forEach(u -> {
            u.setTenant(targetTenant);
            userRepository.save(u);
            System.out.println("DEBUG REPAIR: Associated user " + u.getUsername() + " with tenant " + domain);
        });
        
        return ResponseEntity.ok(Map.of(
            "message", "Repair completed",
            "fixedCount", orphans.size(),
            "targetTenant", domain
        ));
    }

    @GetMapping("/debug/check-session")
    public ResponseEntity<?> checkSession() {
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        
        Map<String, Object> details = new HashMap<>();
        details.put("isAuthenticated", auth != null && auth.isAuthenticated());
        
        if (auth != null && auth.isAuthenticated()) {
            details.put("username", auth.getName());
            details.put("authorities", auth.getAuthorities().stream().map(Object::toString).toList());
            if (auth.getPrincipal() instanceof com.safeline.safeline.security.TenantAwareUserDetails tenantUser) {
                details.put("tenantId", tenantUser.getTenantId());
            } else {
                details.put("principalType", auth.getPrincipal().getClass().getName());
            }
        }
        
        return ResponseEntity.ok(details);
    }
}