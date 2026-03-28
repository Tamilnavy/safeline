package com.safeline.safeline.service;

import com.safeline.safeline.dto.MessageResponse;
import com.safeline.safeline.model.Complaint;
import com.safeline.safeline.model.ComplaintMessage;
import com.safeline.safeline.model.User;
import com.safeline.safeline.repository.ComplaintMessageRepository;
import com.safeline.safeline.repository.ComplaintRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.safeline.safeline.security.TenantContext;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MessageService {

    private final ComplaintMessageRepository messageRepository;
    private final ComplaintRepository complaintRepository;
    private final NotificationService notificationService;

    public MessageService(ComplaintMessageRepository messageRepository, ComplaintRepository complaintRepository, NotificationService notificationService) {
        this.messageRepository = messageRepository;
        this.complaintRepository = complaintRepository;
        this.notificationService = notificationService;
    }

    public List<MessageResponse> getMessages(Long complaintId) {
        return messageRepository.findByComplaintIdOrderByCreatedAtAsc(complaintId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public List<MessageResponse> getAllMessages() {
        List<ComplaintMessage> messages;
        if (isSuperAdmin()) {
            messages = messageRepository.findAllByOrderByCreatedAtDesc();
        } else {
            Long currentTenantId = TenantContext.getCurrentTenant();
            if (currentTenantId != null) {
                messages = messageRepository.findByComplaintTenantIdOrderByCreatedAtDesc(currentTenantId);
            } else {
                messages = messageRepository.findAllByOrderByCreatedAtDesc();
            }
        }
        return messages.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    private boolean isSuperAdmin() {
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            return auth.getAuthorities().stream()
                .anyMatch(a -> "SUPER_ADMIN".equals(a.getAuthority()) || "ROLE_SUPER_ADMIN".equals(a.getAuthority()));
        }
        return false;
    }

    @Transactional
    public MessageResponse sendMessage(Long complaintId, String content, String senderRole, User sender) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        if (sender == null) {
            org.springframework.security.core.Authentication auth = 
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated()) {
                sender = (User) auth.getPrincipal(); // This might need casting depending on SecurityConfig
            }
        }

        ComplaintMessage message = new ComplaintMessage();
        message.setComplaint(complaint);
        message.setContent(content);
        message.setSenderRole(senderRole);
        message.setSender(sender);
        message.setCreatedAt(LocalDateTime.now());

        ComplaintMessage savedMessage = messageRepository.save(message);

        // Notify counterpart
        Long tenantId = complaint.getTenant() != null ? complaint.getTenant().getId() : null;
        if ("REPORTER".equalsIgnoreCase(senderRole)) {
            if (complaint.getAssignedTo() != null) {
                String assignedUsername = complaint.getAssignedTo().getUsername();
                notificationService.createNotification(
                    assignedUsername,
                    "Reporter has messaged on case: " + complaint.getTitle(),
                    complaint.getId(),
                    tenantId
                );
            }
        } else {
            // Investigator or Handler messaging
            if (complaint.getReporter() != null) {
                String reporterUsername = complaint.getReporter().getUsername();
                notificationService.createNotification(
                    reporterUsername,
                    "Investigator has messaged on case: " + complaint.getTitle(),
                    complaint.getId(),
                    tenantId
                );
            }
        }

        return mapToResponse(savedMessage);
    }

    private MessageResponse mapToResponse(ComplaintMessage m) {
        MessageResponse res = new MessageResponse();
        res.setId(m.getId());
        res.setContent(m.getContent());
        res.setCreatedAt(m.getCreatedAt());
        res.setSenderRole(m.getSenderRole());
        res.setComplaintId(m.getComplaint().getId());

        // Anonymity Logic
        if (m.getComplaint().isAnonymous() && "REPORTER".equalsIgnoreCase(m.getSenderRole())) {
            res.setSenderDisplayName(m.getComplaint().getAnonymousId() != null ? m.getComplaint().getAnonymousId() : "Anonymous");
        } else if ("INVESTIGATOR".equalsIgnoreCase(m.getSenderRole()) || "COMMITTEE".equalsIgnoreCase(m.getSenderRole())) {
            res.setSenderDisplayName("Investigator");
        } else {
            res.setSenderDisplayName(m.getSender() != null ? m.getSender().getFullName() : "System");
        }

        return res;
    }
}
