package com.wellnest.wellnest.controller;

import com.wellnest.wellnest.model.WorkoutLog;
import com.wellnest.wellnest.model.MealLog;
import com.wellnest.wellnest.model.WaterSleepLog;
import com.wellnest.wellnest.repository.WorkoutLogRepository;
import com.wellnest.wellnest.repository.MealLogRepository;
import com.wellnest.wellnest.repository.WaterSleepLogRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/tracker")
@CrossOrigin
public class TrackerController {

    private final WorkoutLogRepository workoutRepo;
    private final MealLogRepository mealRepo;
    private final WaterSleepLogRepository waterSleepRepo;

    public TrackerController(
            WorkoutLogRepository workoutRepo,
            MealLogRepository mealRepo,
            WaterSleepLogRepository waterSleepRepo
    ) {
        this.workoutRepo = workoutRepo;
        this.mealRepo = mealRepo;
        this.waterSleepRepo = waterSleepRepo;
    }

    // ========= WORKOUTS =========

    @PostMapping("/workouts")
    public ResponseEntity<WorkoutLog> logWorkout(@RequestBody Map<String, Object> payload) {
        Long userId = Long.valueOf(payload.get("userId").toString());
        String exerciseType = (String) payload.get("exerciseType");

        Integer duration = payload.get("durationMinutes") != null
                ? Integer.valueOf(payload.get("durationMinutes").toString())
                : null;

        Integer calories = payload.get("caloriesBurned") != null
                ? Integer.valueOf(payload.get("caloriesBurned").toString())
                : null;

        LocalDate date = payload.get("logDate") != null
                ? LocalDate.parse(payload.get("logDate").toString())
                : LocalDate.now();

        LocalTime time = payload.get("logTime") != null
                ? LocalTime.parse(payload.get("logTime").toString())
                : LocalTime.now();

        WorkoutLog log = new WorkoutLog();
        log.setUserId(userId);
        log.setExerciseType(exerciseType);
        log.setDurationMinutes(duration);
        log.setCaloriesBurned(calories);
        log.setLogDate(date);
        log.setLogTime(time);

        WorkoutLog saved = workoutRepo.save(log);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/workouts/{userId}/today")
    public List<WorkoutLog> getTodayWorkouts(@PathVariable Long userId) {
        LocalDate today = LocalDate.now();
        return workoutRepo.findByUserIdAndLogDateOrderByLogDateDesc(userId, today);
    }

    @GetMapping("/workouts/{userId}/range")
    public List<WorkoutLog> getWorkoutsByRange(
            @PathVariable Long userId,
            @RequestParam String start,
            @RequestParam String end) {
        LocalDate startDate = LocalDate.parse(start);
        LocalDate endDate = LocalDate.parse(end);
        return workoutRepo.findByUserIdAndLogDateBetween(userId, startDate, endDate);
    }

    // ========= MEALS =========

    @PostMapping("/meals")
    public ResponseEntity<MealLog> logMeal(@RequestBody Map<String, Object> payload) {
        Long userId = Long.valueOf(payload.getOrDefault("userId", "0").toString());
        String mealType = (String) payload.get("mealType");
        String description = (String) payload.get("description");

        Integer calories = payload.get("calories") != null
                ? Integer.valueOf(payload.get("calories").toString())
                : null;

        Integer protein = payload.get("protein") != null
                ? Integer.valueOf(payload.get("protein").toString())
                : null;

        Integer carbs = payload.get("carbs") != null
                ? Integer.valueOf(payload.get("carbs").toString())
                : null;

        LocalDate date = payload.get("logDate") != null
                ? LocalDate.parse(payload.get("logDate").toString())
                : LocalDate.now();

        LocalTime time = payload.get("mealTime") != null
                ? LocalTime.parse(payload.get("mealTime").toString())
                : LocalTime.now();

        MealLog log = new MealLog();
        log.setUserId(userId);
        log.setMealType(mealType);
        log.setDescription(description);
        log.setCalories(calories);
        log.setProtein(protein);
        log.setCarbs(carbs);
        log.setLogDate(date);
        log.setMealTime(time);

        MealLog saved = mealRepo.save(log);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/meals/{userId}/today")
    public List<MealLog> getTodayMeals(@PathVariable Long userId) {
        LocalDate today = LocalDate.now();
        return mealRepo.findByUserIdAndLogDateOrderByMealTimeAsc(userId, today);
    }

    @GetMapping("/meals/{userId}/range")
    public List<MealLog> getMealsByRange(
            @PathVariable Long userId,
            @RequestParam String start,
            @RequestParam String end) {
        LocalDate startDate = LocalDate.parse(start);
        LocalDate endDate = LocalDate.parse(end);
        return mealRepo.findByUserIdAndLogDateBetween(userId, startDate, endDate);
    }

    // ========= WATER + SLEEP =========

    @PostMapping("/water-sleep")
    public ResponseEntity<WaterSleepLog> logWaterSleep(@RequestBody Map<String, Object> payload) {
        Long userId = Long.valueOf(payload.get("userId").toString());

        Double water = payload.get("waterIntakeLiters") != null
                ? Double.valueOf(payload.get("waterIntakeLiters").toString())
                : 0.0;

        Double sleep = payload.get("sleepHours") != null
                ? Double.valueOf(payload.get("sleepHours").toString())
                : 0.0;

        String quality = (String) payload.get("sleepQuality");

        LocalDate date = payload.get("logDate") != null
                ? LocalDate.parse(payload.get("logDate").toString())
                : LocalDate.now();

        LocalTime time = payload.get("logTime") != null
                ? LocalTime.parse(payload.get("logTime").toString())
                : LocalTime.now();

        WaterSleepLog log = new WaterSleepLog();
        log.setUserId(userId);
        log.setLogDate(date);
        log.setLogTime(time);
        log.setWaterIntakeLiters(water);
        log.setSleepHours(sleep);
        log.setSleepQuality(quality);

        WaterSleepLog saved = waterSleepRepo.save(log);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/water-sleep/{userId}/today")
    public List<WaterSleepLog> getTodayWaterSleep(@PathVariable Long userId) {
        LocalDate today = LocalDate.now();
        return waterSleepRepo.findByUserIdAndLogDate(userId, today);

    }

    @GetMapping("/water-sleep/{userId}/range")
    public List<WaterSleepLog> getWaterSleepByRange(
            @PathVariable Long userId,
            @RequestParam String start,
            @RequestParam String end) {
        LocalDate startDate = LocalDate.parse(start);
        LocalDate endDate = LocalDate.parse(end);
        return waterSleepRepo.findByUserIdAndLogDateBetween(userId, startDate, endDate);
    }
// ============ ANALYTICS (Milestone 4) ============

    // ========= DASHBOARD ANALYTICS =========
    @GetMapping("/analytics/{userId}/dashboard")
    public Map<String, Object> getDashboardStats(@PathVariable Long userId) {
        LocalDate today = LocalDate.now();
        LocalDate sevenDaysAgo = today.minusDays(6);

        // Fetch logs for last 7 days
        List<WorkoutLog> workouts = workoutRepo.findByUserIdAndLogDateBetween(userId, sevenDaysAgo, today);

        // Maps to hold daily sums
        Map<LocalDate, Integer> workoutMap = new HashMap<>();
        Map<LocalDate, Integer> calorieMap = new HashMap<>();

        // Initialize with 0s
        for (int i = 0; i < 7; i++) {
            LocalDate d = sevenDaysAgo.plusDays(i);
            workoutMap.put(d, 0);
            calorieMap.put(d, 0);
        }

        // Aggregate Data
        for (WorkoutLog w : workouts) {
            LocalDate d = w.getLogDate();
            // Ensure date is within range (safety check)
            if (!d.isBefore(sevenDaysAgo) && !d.isAfter(today)) {
                int duration = w.getDurationMinutes() != null ? w.getDurationMinutes() : 0;
                int cals = w.getCaloriesBurned() != null ? w.getCaloriesBurned() : 0;

                workoutMap.put(d, workoutMap.get(d) + duration);
                calorieMap.put(d, calorieMap.get(d) + cals);
            }
        }

        // Prepare arrays for Frontend
        int[] workoutArr = new int[7];
        int[] calorieArr = new int[7];
        String[] labels = new String[7];

        for (int i = 0; i < 7; i++) {
            LocalDate d = sevenDaysAgo.plusDays(i);
            workoutArr[i] = workoutMap.get(d);
            calorieArr[i] = calorieMap.get(d);
            // Label: e.g. "MON"
            labels[i] = d.getDayOfWeek().toString().substring(0, 3);
        }

        int todayCalories = calorieMap.get(today);

        Map<String, Object> result = new HashMap<>();
        result.put("labels", labels);
        result.put("workoutData", workoutArr);
        result.put("calorieData", calorieArr);
        result.put("todayCalories", todayCalories);

        return result;
    }

    // ========= WEEKLY ANALYTICS =========
    @GetMapping("/analytics/{userId}/weekly")
    public Map<String, Object> getWeeklyAnalytics(@PathVariable Long userId) {
        
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(6); // last 7 days

        // ✅ these method names MUST match the repositories above
        List<WorkoutLog> workouts =
                workoutRepo.findByUserIdAndLogDateBetween(userId, startDate, endDate);

        List<MealLog> meals =
                mealRepo.findByUserIdAndLogDateBetween(userId, startDate, endDate);

        List<WaterSleepLog> waterSleepLogs =
                waterSleepRepo.findByUserIdAndLogDateBetween(userId, startDate, endDate);

        int totalWorkoutMinutes = workouts.stream()
                .filter(w -> w.getDurationMinutes() != null)
                .mapToInt(WorkoutLog::getDurationMinutes)
                .sum();

        int totalWorkoutSessions = workouts.size();

        int totalMealCalories = meals.stream()
                .filter(m -> m.getCalories() != null)
                .mapToInt(MealLog::getCalories)
                .sum();

        double avgWaterIntake = waterSleepLogs.stream()
                .filter(ws -> ws.getWaterIntakeLiters() != null)
                .mapToDouble(WaterSleepLog::getWaterIntakeLiters)
                .average()
                .orElse(0.0);

        double avgSleepHours = waterSleepLogs.stream()
                .filter(ws -> ws.getSleepHours() != null)
                .mapToDouble(WaterSleepLog::getSleepHours)
                .average()
                .orElse(0.0);

        Map<String, Object> result = new HashMap<>();
        result.put("startDate", startDate);
        result.put("endDate", endDate);
        result.put("totalWorkoutMinutes", totalWorkoutMinutes);
        result.put("totalWorkoutSessions", totalWorkoutSessions);
        result.put("totalMealCalories", totalMealCalories);
        result.put("avgWaterIntake", avgWaterIntake);
        result.put("avgSleepHours", avgSleepHours);

        return result;
    }

}


