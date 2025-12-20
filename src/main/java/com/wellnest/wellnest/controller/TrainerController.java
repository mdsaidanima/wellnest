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
            trainerRepository.save(new Trainer("Alex Fit", "Weight Loss", 5, "Expert in HIIT and nutrition for shedding pounds.", "alex@wellnest.com", "https://randomuser.me/api/portraits/men/32.jpg", 28));
            trainerRepository.save(new Trainer("Sarah Strong", "Muscle Gain", 8, "Bodybuilding champion and strength coach.", "sarah@wellnest.com", "https://randomuser.me/api/portraits/women/44.jpg", 30));
            trainerRepository.save(new Trainer("Zen Master", "Yoga", 10, "Holistic approach to flexibility and mindfulness.", "zen@wellnest.com", "https://randomuser.me/api/portraits/men/64.jpg", 35));
            trainerRepository.save(new Trainer("Mike Runner", "Cardio", 4, "Marathon runner helping you build endurance.", "mike@wellnest.com", "https://randomuser.me/api/portraits/men/86.jpg", 26));
            trainerRepository.save(new Trainer("Emily Balance", "General Fitness", 6, "Helping you stay active and healthy every day.", "emily@wellnest.com", "https://randomuser.me/api/portraits/women/65.jpg", 29));
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
    // Enroll as trainer
    @PostMapping("/enroll")
    public ResponseEntity<?> enrollTrainer(@RequestBody TrainerEnrollmentRequest request) {
        User user = userRepository.findByEmail(request.getEmail()).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body("User not found");
        }

        // Anti-duplicate check
        if (trainerRepository.existsByContactEmail(user.getEmail())) {
            return ResponseEntity.badRequest().body("You are already enrolled as a trainer!");
        }

        // Create new trainer profile
        Trainer trainer = new Trainer(
                user.getFullName(),
                request.getSpecialization(),
                request.getExperienceYears(),
                request.getBio(),
                user.getEmail(),
                "https://ui-avatars.com/api/?name=" + user.getFullName().replace(" ", "+"), // Default avatar
                request.getAge()
        );
        trainerRepository.save(trainer);

        // Update user role
        user.setRole("TRAINER");
        userRepository.save(user);

        return ResponseEntity.ok("Enrolled successfully as trainer!");
    }

    public static class TrainerEnrollmentRequest {
        private String email;
        private int age;
        private int experienceYears;
        private String specialization;
        private String bio;

        // Getters and Setters
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public int getAge() { return age; }
        public void setAge(int age) { this.age = age; }
        public int getExperienceYears() { return experienceYears; }
        public void setExperienceYears(int experienceYears) { this.experienceYears = experienceYears; }
        public String getSpecialization() { return specialization; }
        public void setSpecialization(String specialization) { this.specialization = specialization; }
        public String getBio() { return bio; }
        public void setBio(String bio) { this.bio = bio; }
    }
}
