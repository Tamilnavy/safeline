package com.safeline.safeline.controller;

import com.safeline.safeline.model.Notification;
import com.safeline.safeline.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "http://localhost:5173")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<List<Notification>> getUserNotifications(
            @RequestParam(defaultValue = "false") boolean unreadOnly) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
             // For unauthenticated/anonymous reporters, we rely on the anonymous tracking pin pattern,
             // but notifications require an established identity session. Returning an empty list for anonymous.
             // If reporters are pseudo-auth'd via track endpoint, they won't seamlessly hit this endpoint.
             // But if they have a real username (for registered users), this works.
             return ResponseEntity.ok(List.of());
        }
        String username = auth.getName();
        if (unreadOnly) {
             return ResponseEntity.ok(notificationService.getUnreadNotifications(username));
        }
        return ResponseEntity.ok(notificationService.getRecentNotifications(username));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            notificationService.markAsRead(id, auth.getName());
        }
        return ResponseEntity.ok().build();
    }
    
    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            notificationService.markAllAsRead(auth.getName());
        }
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            notificationService.deleteNotification(id, auth.getName());
        }
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/clear-all")
    public ResponseEntity<Void> clearAllNotifications() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            notificationService.deleteAllNotifications(auth.getName());
        }
        return ResponseEntity.ok().build();
    }
}
