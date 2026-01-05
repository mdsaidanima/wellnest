package com.wellnest.wellnest.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "meal_plans")
public class MealPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private Long trainerId;
    
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(columnDefinition = "TEXT")
    private String meals; // Breakfast, Lunch, Dinner, Snacks as formatted text
    
    private LocalDateTime assignedAt;

    public MealPlan() {
        this.assignedAt = LocalDateTime.now();
    }

    public MealPlan(Long userId, Long trainerId, String title, String description, String meals) {
        this.userId = userId;
        this.trainerId = trainerId;
        this.title = title;
        this.description = description;
        this.meals = meals;
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

    public String getMeals() { return meals; }
    public void setMeals(String meals) { this.meals = meals; }

    public LocalDateTime getAssignedAt() { return assignedAt; }
    public void setAssignedAt(LocalDateTime assignedAt) { this.assignedAt = assignedAt; }
}
