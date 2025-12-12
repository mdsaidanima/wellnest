package com.wellnest.wellnest.controller;

import com.wellnest.wellnest.model.User;
import com.wellnest.wellnest.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:8080")
public class AuthController {

    private final UserRepository userRepository;

    public AuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // ---------------- REGISTER (used by signup.js) ----------------
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, Object> payload) {

        String fullName = (String) payload.get("fullName");
        String email = (String) payload.get("email");
        String password = (String) payload.get("password");
        String role = (String) payload.getOrDefault("role", "USER");

        if (email == null || password == null || fullName == null) {
            return ResponseEntity.badRequest().body("Missing required fields");
        }

        // Check if email already exists
        List<User> allUsers = userRepository.findAll();
        boolean emailExists = allUsers.stream()
                .anyMatch(u -> email.equalsIgnoreCase(u.getEmail()));

        if (emailExists) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Email already registered");
        }

        // Create and save user
        User user = new User();
        user.setFullName(fullName);
        user.setEmail(email);
        user.setPassword(password);
        user.setRole(role);

        // DEBUG: Log payload
        System.out.println(">>> REGISTER PAYLOAD: " + payload);

        // Handle optional profile fields
        if (payload.get("age") != null) {
            try {
                // Parse as Double first to handle "30.0" or "30" or 30, then cast to int
                user.setAge((int) Double.parseDouble(payload.get("age").toString()));
            } catch (Exception e) {
                System.out.println("Error parsing age: " + e);
            }
        }
        if (payload.get("weight") != null) {
            try {
                user.setWeight(Double.parseDouble(payload.get("weight").toString()));
            } catch (Exception e) {
                 System.out.println("Error parsing weight: " + e);
            }
        }
        if (payload.get("goal") != null) {
            user.setGoal(payload.get("goal").toString());
        }

        userRepository.save(user);

        Map<String, Object> response = new HashMap<>();
        response.put("userId", user.getId());
        response.put("role", user.getRole());
        response.put("message", "Registration successful");

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ---------------- LOGIN (used by login.js) ----------------
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> payload) {

        String email = payload.get("email");
        String password = payload.get("password");

        if (email == null || password == null) {
            return ResponseEntity.badRequest().body("Email and password are required");
        }

        List<User> allUsers = userRepository.findAll();

        User matchedUser = allUsers.stream()
                .filter(u ->
                        email.equalsIgnoreCase(u.getEmail()) &&
                                password.equals(u.getPassword())
                )
                .findFirst()
                .orElse(null);

        if (matchedUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid email or password");
        }

        Map<String, Object> response = new HashMap<>();
        response.put("userId", matchedUser.getId());
        response.put("role", matchedUser.getRole());
        response.put("fullName", matchedUser.getFullName());
        
        // Return profile fields if they exist
        if (matchedUser.getAge() != null) response.put("age", matchedUser.getAge());
        if (matchedUser.getWeight() != null) response.put("weight", matchedUser.getWeight());
        if (matchedUser.getGoal() != null) response.put("goal", matchedUser.getGoal());
        
        response.put("token", "demo-token");

        return ResponseEntity.ok(response);
    }
}
