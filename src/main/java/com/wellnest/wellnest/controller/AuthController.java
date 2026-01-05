package com.wellnest.wellnest.controller;

import com.wellnest.wellnest.model.User;
import com.wellnest.wellnest.model.Trainer;
import com.wellnest.wellnest.model.PasswordResetToken;
import com.wellnest.wellnest.repository.UserRepository;
import com.wellnest.wellnest.repository.TrainerRepository;
import com.wellnest.wellnest.repository.PasswordResetTokenRepository;
import com.wellnest.wellnest.service.EmailService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:8080")
public class AuthController {

    private final UserRepository userRepository;
    private final TrainerRepository trainerRepository;
    private final PasswordResetTokenRepository resetTokenRepository;
    private final EmailService emailService;

    public AuthController(UserRepository userRepository, 
                         TrainerRepository trainerRepository,
                         PasswordResetTokenRepository resetTokenRepository,
                         EmailService emailService) {
        this.userRepository = userRepository;
        this.trainerRepository = trainerRepository;
        this.resetTokenRepository = resetTokenRepository;
        this.emailService = emailService;
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

        // If Role is TRAINER, save to Trainer repository as well
        if ("TRAINER".equalsIgnoreCase(role)) {
            try {
                Trainer trainer = new Trainer();
                trainer.setName(fullName);
                trainer.setContactEmail(email);
                
                if (payload.get("experience") != null) {
                    trainer.setExperienceYears((int) Double.parseDouble(payload.get("experience").toString()));
                }
                if (payload.get("specialization") != null) {
                    trainer.setSpecialization(payload.get("specialization").toString());
                }
                
                // Set default image or other fields if needed
                trainer.setBio("Certified Trainer specialized in " + trainer.getSpecialization());
                
                trainerRepository.save(trainer);
                System.out.println("Trainer profile created for: " + email);
            } catch (Exception e) {
                System.out.println("Error creating trainer profile: " + e.getMessage());
                // We don't fail the whole registration if trainer profile fails, or maybe we should?
                // For now, let's log it.
            }
        }

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
        if (matchedUser.getTrainerId() != null) response.put("trainerId", matchedUser.getTrainerId());
        
        response.put("token", "demo-token");

        return ResponseEntity.ok(response);
    }

    // ---------------- FORGOT PASSWORD - Send OTP ----------------
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");

        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Email is required");
        }

        // Check if user exists
        List<User> allUsers = userRepository.findAll();
        User user = allUsers.stream()
                .filter(u -> email.equalsIgnoreCase(u.getEmail()))
                .findFirst()
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("No account found with this email");
        }

        // Generate 6-digit OTP
        String otp = String.format("%06d", new Random().nextInt(999999));

        // Create token with 10 minutes expiry
        LocalDateTime expiryTime = LocalDateTime.now().plusMinutes(10);
        PasswordResetToken resetToken = new PasswordResetToken(email, otp, expiryTime);
        resetTokenRepository.save(resetToken);

        // Send OTP via email
        emailService.sendOtpEmail(email, otp);

        Map<String, String> response = new HashMap<>();
        response.put("message", "OTP sent to your email");
        response.put("email", email);

        return ResponseEntity.ok(response);
    }

    // ---------------- VERIFY OTP ----------------
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String otp = payload.get("otp");

        if (email == null || otp == null) {
            return ResponseEntity.badRequest().body("Email and OTP are required");
        }

        // Find valid token
        PasswordResetToken token = resetTokenRepository
                .findByEmailAndOtpAndUsedFalse(email, otp)
                .orElse(null);

        if (token == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid OTP");
        }

        if (token.isExpired()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("OTP has expired");
        }

        Map<String, String> response = new HashMap<>();
        response.put("message", "OTP verified successfully");
        response.put("email", email);

        return ResponseEntity.ok(response);
    }

    // ---------------- RESET PASSWORD ----------------
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String otp = payload.get("otp");
        String newPassword = payload.get("newPassword");

        if (email == null || otp == null || newPassword == null) {
            return ResponseEntity.badRequest().body("Email, OTP, and new password are required");
        }

        // Find and validate token
        PasswordResetToken token = resetTokenRepository
                .findByEmailAndOtpAndUsedFalse(email, otp)
                .orElse(null);

        if (token == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid OTP");
        }

        if (token.isExpired()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("OTP has expired");
        }

        // Find user and update password
        List<User> allUsers = userRepository.findAll();
        User user = allUsers.stream()
                .filter(u -> email.equalsIgnoreCase(u.getEmail()))
                .findFirst()
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("User not found");
        }

        // Update password
        user.setPassword(newPassword);
        userRepository.save(user);

        // Mark token as used
        token.setUsed(true);
        resetTokenRepository.save(token);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Password reset successful");

        return ResponseEntity.ok(response);
    }
}
