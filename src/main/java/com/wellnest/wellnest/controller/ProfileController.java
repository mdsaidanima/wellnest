package com.wellnest.wellnest.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class ProfileController {

    // Called after signup to save age/weight/goal
    @PostMapping("/profile")
    public ResponseEntity<String> saveProfile(@RequestBody Map<String, Object> payload) {
        System.out.println("PROFILE request: " + payload);
        // TODO: later save in DB
        return ResponseEntity.ok("Profile saved (dummy backend)");
    }
}
