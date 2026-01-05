package com.wellnest.wellnest.repository;

import com.wellnest.wellnest.model.MealPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MealPlanRepository extends JpaRepository<MealPlan, Long> {
    List<MealPlan> findByUserIdOrderByAssignedAtDesc(Long userId);
}
