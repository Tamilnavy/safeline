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

        boolean isEscalation = sender.getCommitteePermissions() != null && 
            sender.getCommitteePermissions().contains(com.safeline.safeline.model.CommitteePermission.ESCALATION_HEAD);
        boolean isLead = sender.getCommitteePermissions() != null && 
            sender.getCommitteePermissions().contains(com.safeline.safeline.model.CommitteePermission.COMMITTEE_LEAD);

        boolean isReporter = complaint.getReporter() != null && complaint.getReporter().getId().equals(sender.getId());

        // Security Restriction: Leads/Heads cannot send messages unless they are the reporter
        if (!isReporter && (isLead && !isEscalation)) {
            throw new RuntimeException("Committee Leads are not authorized to send internal messages.");
        }
        
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

        boolean isEscalation = staff.getCommitteePermissions() != null && 
            staff.getCommitteePermissions().contains(com.safeline.safeline.model.CommitteePermission.ESCALATION_HEAD);
        boolean isLead = staff.getCommitteePermissions() != null && 
            staff.getCommitteePermissions().contains(com.safeline.safeline.model.CommitteePermission.COMMITTEE_LEAD);
        boolean isHandler = staff.getCommitteePermissions() != null && 
            staff.getCommitteePermissions().contains(com.safeline.safeline.model.CommitteePermission.COMPLAINT_HANDLER);

        boolean isReporter = complaint.getReporter() != null && complaint.getReporter().getId().equals(staff.getId());

        // Security Restriction: Leads/Heads cannot read messages unless assigned OR they are the reporter
        if (!isReporter && (isLead && !isEscalation && !isHandler)) {
            throw new RuntimeException("Committee Leads are not authorized to view internal messages.");
        }
        
        return messageRepository.findByComplaintIdOrderByCreatedAtAsc(complaintId);
    }
}
