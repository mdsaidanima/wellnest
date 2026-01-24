package com.wellnest.wellnest.controller;

import com.wellnest.wellnest.model.User;
import com.wellnest.wellnest.model.Trainer;
import com.wellnest.wellnest.model.WorkoutLog;
import com.wellnest.wellnest.model.MealLog;
import com.wellnest.wellnest.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TrainerRepository trainerRepository;

    @Autowired
    private WorkoutLogRepository workoutLogRepository;

    @Autowired
    private MealLogRepository mealLogRepository;

    @Autowired
    private BlogPostRepository blogPostRepository;

    @GetMapping("/stats")
    public ResponseEntity<?> getPlatformStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalTrainers", trainerRepository.count());
        stats.put("totalWorkouts", workoutLogRepository.count());
        stats.put("totalMeals", mealLogRepository.count());
        stats.put("totalBlogPosts", blogPostRepository.count());
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/users")
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        return userRepository.findById(id).map(user -> {
            // Prevent deletion of ADMIN users
            if ("ADMIN".equalsIgnoreCase(user.getRole())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Cannot delete admin users"));
            }
            
            userRepository.delete(user);
            
            // If they are a trainer, delete from trainer repo too
            trainerRepository.findAll().stream()
                .filter(t -> t.getContactEmail().equalsIgnoreCase(user.getEmail()))
                .findFirst()
                .ifPresent(t -> trainerRepository.delete(t));
                
            return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/trainers/{id}")
    public ResponseEntity<?> deleteTrainer(@PathVariable Long id) {
        return trainerRepository.findById(id).map(trainer -> {
            // Find and update users who have this trainer assigned
            List<User> assignedUsers = userRepository.findAll().stream()
                .filter(u -> trainer.getId().equals(u.getTrainerId()))
                .toList();
            
            assignedUsers.forEach(user -> {
                user.setTrainerId(null);
                userRepository.save(user);
            });
            
            // Delete the trainer profile
            trainerRepository.delete(trainer);
            
            // Delete the associated user account if exists
            if (trainer.getUserId() != null) {
                userRepository.findById(trainer.getUserId())
                    .ifPresent(user -> userRepository.delete(user));
            }
            
            return ResponseEntity.ok(Map.of("message", "Trainer deleted successfully"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/trainers")
    public List<Trainer> getAllTrainers() {
        return trainerRepository.findAll();
    }
}
