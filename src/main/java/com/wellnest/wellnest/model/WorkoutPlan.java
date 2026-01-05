package com.wellnest.wellnest.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "workout_plans")
public class WorkoutPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private Long trainerId;
    
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(columnDefinition = "TEXT")
    private String exercises; // e.g., "Pushups: 3x12, Squats: 4x10"

    private LocalDateTime assignedAt;

    public WorkoutPlan() {
        this.assignedAt = LocalDateTime.now();
    }

    public WorkoutPlan(Long userId, Long trainerId, String title, String description, String exercises) {
        this.userId = userId;
        this.trainerId = trainerId;
        this.title = title;
        this.description = description;
        this.exercises = exercises;
        this.assignedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getTrainerId() { return trainerId; }
    public void setTrainerId(Long trainerId) { this.trainerId = trainerId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getExercises() { return exercises; }
    public void setExercises(String exercises) { this.exercises = exercises; }

    public LocalDateTime getAssignedAt() { return assignedAt; }
    public void setAssignedAt(LocalDateTime assignedAt) { this.assignedAt = assignedAt; }
}
