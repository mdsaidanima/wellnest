package com.wellnest.wellnest.controller;

import com.wellnest.wellnest.model.Trainer;
import com.wellnest.wellnest.model.User;
import com.wellnest.wellnest.repository.TrainerRepository;
import com.wellnest.wellnest.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trainers")
public class TrainerController {

    @Autowired
    private TrainerRepository trainerRepository;

    @Autowired
    private UserRepository userRepository;

    // Seeding some dummy data if empty
    @PostConstruct
    public void init() {
        if (trainerRepository.count() == 0) {
            trainerRepository.save(new Trainer("Alex Fit", "Weight Loss", 5, "Expert in HIIT and nutrition for shedding pounds.", "alex@wellnest.com", "https://randomuser.me/api/portraits/men/32.jpg"));
            trainerRepository.save(new Trainer("Sarah Strong", "Muscle Gain", 8, "Bodybuilding champion and strength coach.", "sarah@wellnest.com", "https://randomuser.me/api/portraits/women/44.jpg"));
            trainerRepository.save(new Trainer("Zen Master", "Yoga", 10, "Holistic approach to flexibility and mindfulness.", "zen@wellnest.com", "https://randomuser.me/api/portraits/men/64.jpg"));
            trainerRepository.save(new Trainer("Mike Runner", "Cardio", 4, "Marathon runner helping you build endurance.", "mike@wellnest.com", "https://randomuser.me/api/portraits/men/86.jpg"));
            trainerRepository.save(new Trainer("Emily Balance", "General Fitness", 6, "Helping you stay active and healthy every day.", "emily@wellnest.com", "https://randomuser.me/api/portraits/women/65.jpg"));
        }
    }

    // Force reset data (to update images)
    @GetMapping("/reset")
    public String resetTrainers() {
        trainerRepository.deleteAll();
        init();
        return "Trainers reset successfully!";
    }

    @GetMapping
    public List<Trainer> getAllTrainers() {
        return trainerRepository.findAll();
    }

    // Recommend based on user email (and their goal)
    @GetMapping("/recommend")
    public ResponseEntity<?> getRecommended(@RequestParam String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body("User not found");
        }

        String goal = user.getGoal(); // e.g. "Lose Weight", "Muscle Gain"
        if (goal == null || goal.isEmpty()) {
            return ResponseEntity.ok(trainerRepository.findAll()); // Return all if no goal
        }

        // Simple keyword matching
        String keyword = "";
        if (goal.toLowerCase().contains("weight") || goal.toLowerCase().contains("fat")) keyword = "Weight Loss";
        else if (goal.toLowerCase().contains("muscle") || goal.toLowerCase().contains("strength")) keyword = "Muscle Gain";
        else if (goal.toLowerCase().contains("yoga") || goal.toLowerCase().contains("flexibility")) keyword = "Yoga";
        else if (goal.toLowerCase().contains("run") || goal.toLowerCase().contains("cardio")) keyword = "Cardio";
        else keyword = "General Fitness";

        List<Trainer> matches = trainerRepository.findBySpecializationContainingIgnoreCase(keyword);
        
        // Fallback: if no specific matches, return all
        if (matches.isEmpty()) {
            return ResponseEntity.ok(trainerRepository.findAll());
        }

        return ResponseEntity.ok(matches);
    }
}
