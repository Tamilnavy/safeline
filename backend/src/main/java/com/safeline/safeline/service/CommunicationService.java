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
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CommunicationService {

    private final ComplaintMessageRepository messageRepository;
    private final ComplaintRepository complaintRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;

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
        
        ComplaintMessage savedMessage = messageRepository.save(message);

        // Notify Investigator (if assigned)
        if (complaint.getAssignedTo() != null) {
            notificationService.createNotification(
                complaint.getAssignedTo().getUsername(),
                "You have a new message for complaint #" + complaint.getTrackingId(),
                complaint.getId(),
                complaint.getTenant().getId()
            );
        }

        return savedMessage;
    }

    // 2. Send Message as Investigator/Staff
    public ComplaintMessage sendMessageAsStaff(Long complaintId, String content, User sender) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        boolean isReporter = complaint.getReporter() != null && complaint.getReporter().getId().equals(sender.getId());

        // Rule: Leads/Heads/Handlers have permission to participate.
        // We ensure ORG_ADMIN/ADMIN are also treated as staff via controller logic.
        // There's no longer a restriction blocking Leads from sending messages.

        
        ComplaintMessage message = new ComplaintMessage();
        message.setComplaint(complaint);
        message.setContent(content);
        message.setSender(sender);
        
        // Scenario A: Reporter sends message -> Notify Assigned Investigator
        if (isReporter) {
            message.setSenderRole("REPORTER");
            if (complaint.getAssignedTo() != null) {
                notificationService.createNotification(
                    complaint.getAssignedTo().getUsername(),
                    "You have a new message for complaint #" + complaint.getTrackingId(),
                    complaint.getId(),
                    complaint.getTenant().getId()
                );
            }
        } 
        // Scenario B: Investigator sends message -> Notify Reporter (if registered)
        else {
            message.setSenderRole("STAFF");
            if (complaint.getReporter() != null) {
                notificationService.createNotification(
                    complaint.getReporter().getUsername(),
                    "A new message has been received on your case #" + complaint.getTrackingId(),
                    complaint.getId(),
                    complaint.getTenant().getId()
                );
            }
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
        if (!complaintRepository.existsById(complaintId)) {
            throw new RuntimeException("Complaint not found");
        }

        // All committee members (Leads, Heads, Handlers) and the Reporter can monitor internal messages.

        
        return messageRepository.findByComplaintIdOrderByCreatedAtAsc(complaintId);
    }
}
