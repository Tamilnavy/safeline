package com.safeline.safeline.controller;

import com.safeline.safeline.dto.MessageRequest;
import com.safeline.safeline.model.ComplaintMessage;
import com.safeline.safeline.model.User;
import com.safeline.safeline.repository.UserRepository;
import com.safeline.safeline.service.CommunicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/communication")
@RequiredArgsConstructor
public class CommunicationController {

    private final CommunicationService communicationService;
    private final UserRepository userRepository;

    // --- REPORTER ENDPOINTS (Public with PIN) ---

    @PostMapping("/send-reporter")
    public ResponseEntity<ComplaintMessage> sendAsReporter(@RequestBody MessageRequest request) {
        return ResponseEntity.ok(communicationService.sendMessageAsReporter(request));
    }

    @GetMapping("/messages-reporter")
    public ResponseEntity<List<ComplaintMessage>> getAsReporter(
            @RequestParam String trackingId,
            @RequestParam String pin) {
        return ResponseEntity.ok(communicationService.getMessagesForReporter(trackingId, pin));
    }

    // --- STAFF ENDPOINTS (Authenticated) ---

    @PostMapping("/send-staff/{complaintId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ComplaintMessage> sendAsStaff(
            @PathVariable Long complaintId,
            @RequestBody String content,
            Authentication auth) {
        
        User user = userRepository.getAuthenticatedUser(auth.getName());
        return ResponseEntity.ok(communicationService.sendMessageAsStaff(complaintId, content, user));
    }

    @GetMapping("/messages-staff/{complaintId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ComplaintMessage>> getAsStaff(@PathVariable Long complaintId, Authentication auth) {
        User user = userRepository.getAuthenticatedUser(auth.getName());
        return ResponseEntity.ok(communicationService.getMessagesForStaff(complaintId, user));
    }
}
