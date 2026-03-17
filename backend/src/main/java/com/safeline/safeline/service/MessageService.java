package com.safeline.safeline.service;

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

@Service
public class MessageService {

    private final ComplaintMessageRepository messageRepository;
    private final ComplaintRepository complaintRepository;

    public MessageService(ComplaintMessageRepository messageRepository, ComplaintRepository complaintRepository) {
        this.messageRepository = messageRepository;
        this.complaintRepository = complaintRepository;
    }

    public List<ComplaintMessage> getMessages(Long complaintId) {
        return messageRepository.findByComplaintIdOrderByCreatedAtAsc(complaintId);
    }

    public List<ComplaintMessage> getAllMessages() {
        Long currentTenantId = TenantContext.getCurrentTenant();
        if (currentTenantId != null) {
            return messageRepository.findByComplaintTenantIdOrderByCreatedAtDesc(currentTenantId);
        }
        return messageRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public ComplaintMessage sendMessage(Long complaintId, String content, String senderRole, User sender) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        ComplaintMessage message = new ComplaintMessage();
        message.setComplaint(complaint);
        message.setContent(content);
        message.setSenderRole(senderRole);
        message.setSender(sender);
        message.setCreatedAt(LocalDateTime.now());

        return messageRepository.save(message);
    }
}
