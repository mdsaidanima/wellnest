package com.wellnest.wellnest.controller;

import com.wellnest.wellnest.model.Message;
import com.wellnest.wellnest.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin
public class MessageController {

    @Autowired
    private MessageRepository messageRepository;

    @PostMapping("/send")
    public ResponseEntity<?> sendMessage(@RequestBody Message message) {
        if (message.getSenderId() == null || message.getReceiverId() == null || message.getContent() == null) {
            return ResponseEntity.badRequest().body("Incomplete message data");
        }
        messageRepository.save(message);
        return ResponseEntity.ok(Map.of("message", "Sent"));
    }

    @GetMapping("/conversation")
    public ResponseEntity<List<Message>> getConversation(@RequestParam Long u1, @RequestParam Long u2) {
        List<Message> conversation = messageRepository.findConversation(u1, u2);
        return ResponseEntity.ok(conversation);
    }
}
