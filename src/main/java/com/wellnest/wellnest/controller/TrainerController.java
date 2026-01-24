package com.wellnest.wellnest.controller;

import com.wellnest.wellnest.model.Trainer;
import com.wellnest.wellnest.model.User;
import com.wellnest.wellnest.repository.TrainerRepository;
import com.wellnest.wellnest.repository.UserRepository;
import com.wellnest.wellnest.model.WorkoutPlan;
import com.wellnest.wellnest.repository.WorkoutPlanRepository;
import com.wellnest.wellnest.model.MealPlan;
import com.wellnest.wellnest.repository.MealPlanRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/trainers")
@CrossOrigin
public class TrainerController {

    @Autowired
    private TrainerRepository trainerRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WorkoutPlanRepository workoutPlanRepository;

    @Autowired
    private MealPlanRepository mealPlanRepository;

    // Seeding some dummy data if empty
    @PostConstruct
    public void init() {
        seedAdmin();
        seedJack();
        seedHardin();
    }

    private void seedAdmin() {
        String adminEmail = "admin@wellnest.com";
        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = new User();
            admin.setFullName("WellNest Admin");
            admin.setEmail(adminEmail);
            admin.setPassword("admin123");
            admin.setRole("ADMIN");
            userRepository.save(admin);
            System.out.println("DEBUG: Dedicated Admin account created: " + adminEmail);
        }
    }

    private void seedJack() {
        String jackEmail = "jacktrainer@gmail.com";
        // Check if Jack trainer profile exists
        Trainer jack = trainerRepository.findAll().stream()
                .filter(t -> t.getContactEmail() != null && t.getContactEmail().trim().equalsIgnoreCase(jackEmail))
                .findFirst()
                .orElse(null);

        if (jack == null) {
            jack = new Trainer("Jack", "Muscle Gain", 12, "Elite bodybuilding coach with over a decade of experience.", jackEmail, "https://randomuser.me/api/portraits/men/31.jpg", 34);
            // We'll set the userId after creating/finding the user
        }

        // Ensure Jack User account exists
        User jackUser = userRepository.findByEmail(jackEmail).orElse(null);
        if (jackUser == null) {
            jackUser = new User();
            jackUser.setFullName("Jack");
            jackUser.setEmail(jackEmail);
            jackUser.setPassword("Jack@wellnest"); 
            jackUser.setRole("TRAINER");
            jackUser = userRepository.save(jackUser);
            System.out.println("DEBUG: Created User account for Jack");
        }

        if (jack.getUserId() == null) {
            jack.setUserId(jackUser.getId());
            trainerRepository.save(jack);
            System.out.println("DEBUG: Linked Trainer Jack to User ID " + jackUser.getId());
        }
    }

    private void seedHardin() {
        String hardinEmail = "hardintrainer@gmail.com";
        Trainer hardin = trainerRepository.findAll().stream()
                .filter(t -> t.getContactEmail() != null && t.getContactEmail().trim().equalsIgnoreCase(hardinEmail))
                .findFirst()
                .orElse(null);

        if (hardin == null) {
            hardin = new Trainer("Hardin", "Yoga & Mindfulness", 8, "Passionate yoga instructor specializing in Vinyasa and stress management.", hardinEmail, "https://randomuser.me/api/portraits/men/44.jpg", 30);
        } else {
            // Update existing with better data
            hardin.setSpecialization("Yoga & Mindfulness");
            hardin.setExperienceYears(8);
            hardin.setBio("Passionate yoga instructor specializing in Vinyasa and stress management.");
            hardin.setImageUrl("https://randomuser.me/api/portraits/men/44.jpg");
            hardin.setAge(30);
        }

        User hardinUser = userRepository.findByEmail(hardinEmail).orElse(null);
        if (hardinUser == null) {
            hardinUser = new User();
            hardinUser.setFullName("Hardin");
            hardinUser.setEmail(hardinEmail);
            hardinUser.setPassword("Hardin@wellnest");
            hardinUser.setRole("TRAINER");
            hardinUser = userRepository.save(hardinUser);
            System.out.println("DEBUG: Created User account for Hardin");
        }

        hardin.setUserId(hardinUser.getId());
        trainerRepository.save(hardin);
    }

    // Force reset data (to update images)
    @GetMapping("/reset")
    public String resetTrainers() {
        trainerRepository.deleteAll();
        seedAdmin();
        seedJack(); 
        seedHardin();

        // Also cleanup Mohammad if he exists as a trainer in User table logic
        // AND clear trainerId for everyone to start fresh
        List<User> allU = userRepository.findAll();
        for (User u : allU) {
            u.setTrainerId(null); // Clear connection
            if (u.getFullName().toLowerCase().contains("mohammad") || u.getFullName().toLowerCase().contains("saidanima")) {
                u.setRole("USER"); // Reset back to regular user
            }
            userRepository.save(u);
        }

        return "Trainers reset successfully! Only Jack remains. Mohammad has been reset to USER.";
    }

    @GetMapping
    public List<Trainer> getAllTrainers() {
        return trainerRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Trainer> getTrainerById(@PathVariable Long id) {
        return trainerRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
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

    // Get clients for a logged-in trainer
    @GetMapping("/clients")
    public ResponseEntity<?> getTrainerClients(@RequestParam String trainerEmail) {
        String email = (trainerEmail != null) ? trainerEmail.trim().toLowerCase() : "";
        System.out.println("DEBUG: Fetching clients for trainer email: [" + email + "]");
        
        // Log all trainers in DB for debugging
        List<Trainer> allTrainers = trainerRepository.findAll();
        System.out.println("DEBUG: Total trainers in DB: " + allTrainers.size());
        allTrainers.forEach(t -> System.out.println("DEBUG: Trainer in DB: " + t.getName() + " (" + t.getContactEmail() + ")"));

        // Find all trainer profiles with this email
        List<Trainer> profiles = allTrainers.stream()
                .filter(t -> t.getContactEmail() != null && t.getContactEmail().trim().equalsIgnoreCase(email))
                .toList();
            
        if (profiles.isEmpty()) {
            System.out.println("DEBUG: No trainer profiles found for email: [" + email + "]");
            return ResponseEntity.badRequest().body("Trainer profile not found for email: " + email);
        }
        
        List<User> clients = new ArrayList<>();
        for (Trainer p : profiles) {
            System.out.println("DEBUG: Fetching clients for trainer profile ID: " + p.getId());
            clients.addAll(userRepository.findByTrainerId(p.getId()));
        }
        
        System.out.println("DEBUG: Total clients found across " + profiles.size() + " profiles: " + clients.size());
        
        // Remove potential duplicates if a user is somehow linked multiple times (shouldn't happen)
        List<User> distinctClients = clients.stream().distinct().toList();

        List<Map<String, Object>> response = new ArrayList<>();
        for (User c : distinctClients) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", c.getId());
            map.put("name", (c.getFullName() != null) ? c.getFullName() : "Unknown User");
            map.put("email", (c.getEmail() != null) ? c.getEmail() : "");
            map.put("goal", (c.getGoal() != null) ? c.getGoal() : "No goal set");
            int progress = (c.getFullName() != null) ? (c.getFullName().length() * 7) % 71 + 15 : 15;
            map.put("progress", progress); 
            map.put("status", "Active");
            response.add(map);
        }
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/debug-connections")
    public List<Map<String, Object>> debugConnections() {
        List<User> users = userRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        for (User u : users) {
            Map<String, Object> map = new HashMap<>();
            map.put("name", u.getFullName());
            map.put("email", u.getEmail());
            map.put("trainerId", u.getTrainerId());
            map.put("role", u.getRole());
            result.add(map);
        }
        return result;
    }

    // User enrolls with a Trainer
    @PostMapping("/hire")
    public ResponseEntity<?> hireTrainer(@RequestBody Map<String, String> payload) {
        String userEmail = payload.get("userEmail");
        String trainerIdStr = payload.get("trainerId");

        if (userEmail == null || trainerIdStr == null) {
            return ResponseEntity.badRequest().body("Missing data");
        }

        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (user == null) return ResponseEntity.badRequest().body("User not found");

        Long trainerId = Long.parseLong(trainerIdStr);
        
        // Update user: set as pending request instead of direct hire
        System.out.println("DEBUG: Linking user " + userEmail + " to PENDING trainer ID " + trainerId);
        user.setPendingTrainerId(trainerId);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Enrollment request sent! Waiting for trainer's approval."));
    }

    // User cancels enrollment
    @PostMapping("/unhire")
    public ResponseEntity<?> unhireTrainer(@RequestBody Map<String, String> payload) {
        String userEmail = payload.get("userEmail");

        if (userEmail == null) {
            return ResponseEntity.badRequest().body("User email is required");
        }

        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (user == null) return ResponseEntity.badRequest().body("User not found");

        user.setTrainerId(null);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Enrollment cancelled successfully!"));
    }

    // Trainer removes/cancels a client enrollment
    @PostMapping("/remove-client")
    public ResponseEntity<?> removeClient(@RequestBody Map<String, Long> payload) {
        Long clientId = payload.get("clientId");
        if (clientId == null) return ResponseEntity.badRequest().body("Client ID is required");

        return userRepository.findById(clientId).map(user -> {
            user.setTrainerId(null);
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "Client enrollment cancelled successfully!"));
        }).orElse(ResponseEntity.notFound().build());
    }

    // Assign a plan to a client
    @PostMapping("/assign-plan")
    public ResponseEntity<?> assignPlan(@RequestBody WorkoutPlan plan) {
        if (plan.getUserId() == null || plan.getTrainerId() == null) {
            return ResponseEntity.badRequest().body("Client ID and Trainer ID are required");
        }
        
        // Ensure user exists
        if (!userRepository.existsById(plan.getUserId())) {
            return ResponseEntity.badRequest().body("Client not found");
        }

        // Set assignment time
        plan.setAssignedAt(java.time.LocalDateTime.now());
        workoutPlanRepository.save(plan);
        
        return ResponseEntity.ok(Map.of("message", "Workout plan assigned successfully!"));
    }

    // Get plans for a user (called by both user and trainer)
    @GetMapping("/user-plans/{userId}")
    public ResponseEntity<List<WorkoutPlan>> getUserPlans(@PathVariable Long userId) {
        return ResponseEntity.ok(workoutPlanRepository.findByUserIdOrderByAssignedAtDesc(userId));
    }

    // Assign a meal plan
    @PostMapping("/assign-meal-plan")
    public ResponseEntity<?> assignMealPlan(@RequestBody MealPlan plan) {
        if (plan.getUserId() == null || plan.getTrainerId() == null) {
            return ResponseEntity.badRequest().body("Client ID and Trainer ID are required");
        }
        plan.setAssignedAt(java.time.LocalDateTime.now());
        mealPlanRepository.save(plan);
        return ResponseEntity.ok(Map.of("message", "Meal plan assigned successfully!"));
    }

    // Get meal plans for a user
    @GetMapping("/user-meal-plans/{userId}")
    public ResponseEntity<List<MealPlan>> getUserMealPlans(@PathVariable Long userId) {
        return ResponseEntity.ok(mealPlanRepository.findByUserIdOrderByAssignedAtDesc(userId));
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
    // Get pending requests for a trainer
    @GetMapping("/pending-requests")
    public ResponseEntity<?> getPendingRequests(@RequestParam String trainerEmail) {
        Trainer myProfile = trainerRepository.findAll().stream()
                .filter(t -> t.getContactEmail() != null && t.getContactEmail().trim().equalsIgnoreCase(trainerEmail))
                .findFirst()
                .orElse(null);

        if (myProfile == null) return ResponseEntity.badRequest().body("Trainer not found");

        List<User> pendingUsers = userRepository.findAll().stream()
                .filter(u -> myProfile.getId().equals(u.getPendingTrainerId()))
                .toList();

        List<Map<String, Object>> result = new ArrayList<>();
        for (User u : pendingUsers) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getId());
            map.put("name", u.getFullName());
            map.put("goal", u.getGoal());
            map.put("email", u.getEmail());
            result.add(map);
        }
        return ResponseEntity.ok(result);
    }

    // Accept a pending request
    @PostMapping("/accept-request")
    public ResponseEntity<?> acceptRequest(@RequestBody Map<String, Long> payload) {
        Long userId = payload.get("userId");
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return ResponseEntity.badRequest().body("User not found");

        user.setTrainerId(user.getPendingTrainerId());
        user.setPendingTrainerId(null);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "User accepted!"));
    }

    // Reject a pending request
    @PostMapping("/reject-request")
    public ResponseEntity<?> rejectRequest(@RequestBody Map<String, Long> payload) {
        Long userId = payload.get("userId");
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return ResponseEntity.badRequest().body("User not found");

        user.setPendingTrainerId(null);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "User request rejected."));
    }

    // Update trainer profile
    @PutMapping("/{id}")
    public ResponseEntity<?> updateTrainer(@PathVariable Long id, @RequestBody Trainer trainerData) {
        return trainerRepository.findById(id).map(trainer -> {
            trainer.setName(trainerData.getName());
            trainer.setSpecialization(trainerData.getSpecialization());
            trainer.setExperienceYears(trainerData.getExperienceYears());
            trainer.setBio(trainerData.getBio());
            trainer.setImageUrl(trainerData.getImageUrl());
            trainer.setAge(trainerData.getAge());
            
            Trainer saved = trainerRepository.save(trainer);
            
            // Also sync user name if it changed
            userRepository.findByEmail(trainer.getContactEmail()).ifPresent(user -> {
                user.setFullName(trainerData.getName());
                userRepository.save(user);
            });
            
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }
}
