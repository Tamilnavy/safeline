package com.safeline.safeline.service;

import com.safeline.safeline.model.Notification;
import com.safeline.safeline.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.lang.NonNull;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Transactional
    public void createNotification(String recipientUsername, String message, Long complaintId, Long tenantId) {
        Notification notification = new Notification();
        notification.setRecipientUsername(recipientUsername);
        notification.setMessage(message);
        notification.setComplaintId(complaintId);
        notification.setTenantId(tenantId);
        notificationRepository.save(notification);
    }

    public List<Notification> getRecentNotifications(String username) {
        return notificationRepository.findTop20ByRecipientUsernameOrderByCreatedAtDesc(username);
    }
    
    public List<Notification> getUnreadNotifications(String username) {
        return notificationRepository.findByRecipientUsernameAndIsReadOrderByCreatedAtDesc(username, false);
    }

    @Transactional
    public void markAsRead(@NonNull Long id, String username) {
        if (id == null) return;
        notificationRepository.findById(id).ifPresent(notification -> {
            if (notification.getRecipientUsername().equals(username)) {
                notification.setRead(true);
                notificationRepository.save(notification);
            }
        });
    }

    @Transactional
    public void markAllAsRead(String username) {
        notificationRepository.markAllAsReadForUser(username);
    }
}
