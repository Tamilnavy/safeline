package com.safeline.safeline.repository;

import com.safeline.safeline.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    List<Notification> findByRecipientUsernameAndIsReadOrderByCreatedAtDesc(String username, boolean isRead);
    
    List<Notification> findTop20ByRecipientUsernameOrderByCreatedAtDesc(String username);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.recipientUsername = :username")
    void markAllAsReadForUser(@Param("username") String username);

    @Modifying
    @Query("DELETE FROM Notification n WHERE n.recipientUsername = :username")
    void deleteAllByRecipientUsername(@Param("username") String username);
}
