package com.safeline.safeline.controller;

import com.safeline.safeline.model.ComplaintMessage;
import com.safeline.safeline.service.MessageService;
import org.springframework.http.* ;
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
    public ResponseEntity<List<ComplaintMessage>> getMessages(@PathVariable Long complaintId) {
        return ResponseEntity.ok(messageService.getMessages(complaintId));
    }

    @GetMapping("/all")
    public ResponseEntity<List<ComplaintMessage>> getAllMessages() {
        return ResponseEntity.ok(messageService.getAllMessages());
    }

    @PostMapping("/{complaintId}")
    public ResponseEntity<ComplaintMessage> sendMessage(
            @PathVariable Long complaintId,
            @RequestBody String content,
            @RequestParam String role) {
        // Simplified for now - role passed as param
        // In real app, role would come from SecurityContext
        return ResponseEntity.ok(messageService.sendMessage(complaintId, content, role, null));
    }
}
