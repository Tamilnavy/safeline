package com.safeline.safeline.controller;

import com.safeline.safeline.dto.MessageResponse;
import com.safeline.safeline.service.MessageService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @GetMapping("/{complaintId}")
    @PreAuthorize("hasAnyAuthority('LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'COMMITTEE_LEAD', 'COMPLAINT_HANDLER', 'ESCALATION_HEAD')")
    public ResponseEntity<List<MessageResponse>> getMessages(@PathVariable Long complaintId) {
        return ResponseEntity.ok(messageService.getMessages(complaintId));
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'LEVEL_1', 'LEVEL_2', 'COMMITTEE_LEAD', 'ESCALATION_HEAD')")
    public ResponseEntity<List<MessageResponse>> getAllMessages() {
        return ResponseEntity.ok(messageService.getAllMessages());
    }

    @PostMapping("/{complaintId}")
    @PreAuthorize("hasAnyAuthority('LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'COMMITTEE_LEAD', 'COMPLAINT_HANDLER', 'ESCALATION_HEAD')")
    public ResponseEntity<MessageResponse> sendMessage(
            @PathVariable Long complaintId,
            @RequestBody String content,
            @RequestParam String role) {
        return ResponseEntity.ok(messageService.sendMessage(complaintId, content, role, null));
    }
}
