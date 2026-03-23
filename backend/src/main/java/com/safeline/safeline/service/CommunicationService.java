package com.safeline.safeline.service;

import com.safeline.safeline.dto.MessageRequest;
import com.safeline.safeline.model.Complaint;
import com.safeline.safeline.model.ComplaintMessage;
import com.safeline.safeline.model.User;
import com.safeline.safeline.repository.ComplaintMessageRepository;
import com.safeline.safeline.repository.ComplaintRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CommunicationService {

    private final ComplaintMessageRepository messageRepository;
    private final ComplaintRepository complaintRepository;
    private final PasswordEncoder passwordEncoder;

    // 1. Send Message as Reporter (Anonymous)
    public ComplaintMessage sendMessageAsReporter(MessageRequest request) {
        Complaint complaint = complaintRepository.findByTrackingId(request.getTrackingId())
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        if (!passwordEncoder.matches(request.getPin(), complaint.getPinHash())) {
            throw new RuntimeException("Invalid PIN");
        }

        ComplaintMessage message = new ComplaintMessage();
        message.setComplaint(complaint);
        message.setContent(request.getContent());
        message.setSenderRole("REPORTER");
        
        return messageRepository.save(message);
    }

    // 2. Send Message as Investigator/Staff
    public ComplaintMessage sendMessageAsStaff(Long complaintId, String content, User sender) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        // Permissive approach: Any authenticated organization user can send messages.
        // Tenant isolation is already active.
        
        ComplaintMessage message = new ComplaintMessage();
        message.setComplaint(complaint);
        message.setContent(content);
        message.setSender(sender);
        
        if (complaint.getReporter() != null && complaint.getReporter().getId().equals(sender.getId())) {
            message.setSenderRole("REPORTER");
        } else {
            message.setSenderRole("STAFF");
        }
        
        return messageRepository.save(message);
    }

    // 3. Get messages for a complaint (Safe for reporters)
    public List<ComplaintMessage> getMessagesForReporter(String trackingId, String pin) {
        Complaint complaint = complaintRepository.findByTrackingId(trackingId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        if (!passwordEncoder.matches(pin, complaint.getPinHash())) {
            throw new RuntimeException("Invalid PIN");
        }

        return messageRepository.findByComplaintIdOrderByCreatedAtAsc(complaint.getId());
    }

    // 4. Get messages for staff
    public List<ComplaintMessage> getMessagesForStaff(Long complaintId, User staff) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        // Permissive approach: Any authenticated organization user can view messages.
        // Tenant isolation is already active.
        
        return messageRepository.findByComplaintIdOrderByCreatedAtAsc(complaintId);
    }
}
