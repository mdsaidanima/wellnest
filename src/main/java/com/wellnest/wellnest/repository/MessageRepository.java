package com.wellnest.wellnest.repository;

import com.wellnest.wellnest.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    
    @Query("SELECT m FROM Message m WHERE (m.senderId = :u1 AND m.receiverId = :u2) OR (m.senderId = :u2 AND m.receiverId = :u1) ORDER BY m.timestamp ASC")
    List<Message> findConversation(@Param("u1") Long user1Id, @Param("u2") Long user2Id);
    
    List<Message> findByReceiverIdAndIsReadFalse(Long receiverId);
}
