// dashboard.js - Fully functional dashboard with real data fetching

const API_BASE_URL = "http://localhost:8080/api";
const TRACKER_API = "http://localhost:8080/api/tracker";

let trainerUserId = null;
let chatInterval = null;
let currentPeriod = 'today';

document.addEventListener("DOMContentLoaded", () => {
    initDashboard();
});

async function initDashboard() {
    const userId = localStorage.getItem("userId");
    const userEmail = localStorage.getItem("userEmail");

    if (!userId || !userEmail) {
        window.location.href = "login.html";
        return;
    }

    // Bind Chat Button immediately so it's active while data loads
    const chatBtn = document.getElementById("chatBtn");
    if (chatBtn) {
        chatBtn.onclick = function () {
            console.log("Chat button clicked!");
            toggleChat();
        };
    }

    // 1. Fetch User Profile for Name
    await fetchUserProfile(userEmail);

    // 2. Load Analytics Data (with real data from tracker)
    await loadAnalyticsData(currentPeriod);

    // 3. Dynamic Side Info (Trainer, Plans, Meals)
    await fetchTrainerInfo();
    await fetchUserPlans(userId);
    await fetchUserMealPlans(userId);

    // 4. Tab Listeners for Today/Week/Month/Custom
    setupTabListeners();

    // 5. Logout
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.clear();
            window.location.href = "index.html";
        });
    }
}

function setupTabListeners() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            tabBtns.forEach(b => {
                b.classList.remove('active');
                b.style.background = 'transparent';
                b.style.color = '#aaa';
            });

            // Add active class to clicked button
            btn.classList.add('active');
            btn.style.background = '#18b046';
            btn.style.color = '#000';

            // Update current period and reload data
            currentPeriod = btn.getAttribute('data-period');
            loadAnalyticsData(currentPeriod);
        });
    });
}

async function fetchUserProfile(email) {
    try {
        const response = await fetch(`${API_BASE_URL}/profile?email=${email}`);
        if (response.ok) {
            const user = await response.json();
            const welcomeSpan = document.getElementById("welcomeName");
            if (welcomeSpan) {
                welcomeSpan.innerText = user.displayName || user.name || email.split('@')[0];
            }
        }
    } catch (e) {
        console.error("Error fetching profile:", e);
    }
}

async function loadAnalyticsData(period) {
    const userId = localStorage.getItem("userId");

    console.log("Loading analytics for period:", period, "userId:", userId);

    try {
        // Fetch real data from tracker API
        const stats = await fetchTrackerStats(userId, period);
        console.log("Fetched stats:", stats);
        updateDashboardUI(stats);
    } catch (error) {
        console.error("Error loading analytics:", error);
        // Show error message to user
        alert("Unable to load tracker data. Please make sure you have logged some activities in the tracker.");
    }
}

async function fetchTrackerStats(userId, period) {
    const today = new Date().toISOString().slice(0, 10);

    // Calculate date range based on period
    let startDate, endDate;
    const todayDate = new Date();

    switch (period) {
        case 'today':
            startDate = endDate = today;
            break;
        case 'week':
            const weekAgo = new Date(todayDate);
            weekAgo.setDate(weekAgo.getDate() - 6);
            startDate = weekAgo.toISOString().slice(0, 10);
            endDate = today;
            break;
        case 'month':
            const monthAgo = new Date(todayDate);
            monthAgo.setDate(monthAgo.getDate() - 29);
            startDate = monthAgo.toISOString().slice(0, 10);
            endDate = today;
            break;
        default:
            startDate = endDate = today;
    }

    console.log("Fetching data from", startDate, "to", endDate);

    // Fetch data from all tracker endpoints
    try {
        const [workoutsRes, mealsRes, waterSleepRes] = await Promise.all([
            fetch(`${TRACKER_API}/workouts/${userId}/range?start=${startDate}&end=${endDate}`),
            fetch(`${TRACKER_API}/meals/${userId}/range?start=${startDate}&end=${endDate}`),
            fetch(`${TRACKER_API}/water-sleep/${userId}/range?start=${startDate}&end=${endDate}`)
        ]);

        console.log("API responses:", {
            workouts: workoutsRes.status,
            meals: mealsRes.status,
            waterSleep: waterSleepRes.status
        });

        const workouts = workoutsRes.ok ? await workoutsRes.json() : [];
        const meals = mealsRes.ok ? await mealsRes.json() : [];
        const waterSleep = waterSleepRes.ok ? await waterSleepRes.json() : [];

        console.log("Fetched data:", { workouts, meals, waterSleep });

        // Process the data
        return processTrackerData(workouts, meals, waterSleep, period);
    } catch (error) {
        console.error("Error fetching tracker data:", error);
        throw error;
    }
}

function processTrackerData(workouts, meals, waterSleep, period) {
    // Calculate totals
    const totalCaloriesBurned = workouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);
    const totalCaloriesConsumed = meals.reduce((sum, m) => sum + (m.calories || 0), 0);
    const totalWater = waterSleep.reduce((sum, ws) => sum + (ws.waterIntakeLiters || 0), 0);

    // Get today's water
    const today = new Date().toISOString().slice(0, 10);
    const todayWaterSleep = waterSleep.find(ws => ws.logDate === today);
    const waterToday = todayWaterSleep ? todayWaterSleep.waterIntakeLiters : 0;

    // Calculate exercise days this week (unique days with workouts)
    const uniqueWorkoutDays = new Set(workouts.map(w => w.logDate));
    window.exerciseDaysThisWeek = uniqueWorkoutDays.size;

    // Calculate steps (estimate: 1300 steps per km, avg 5 km/day)
    const totalDistance = workouts.reduce((sum, w) => {
        // Estimate distance based on duration (rough: 5 km per 60 min of cardio)
        if (w.exerciseType && w.exerciseType.toLowerCase().includes('run')) {
            return sum + (w.durationMinutes / 60) * 8; // Running: 8 km/hr
        } else if (w.exerciseType && w.exerciseType.toLowerCase().includes('walk')) {
            return sum + (w.durationMinutes / 60) * 5; // Walking: 5 km/hr
        }
        return sum + (w.durationMinutes / 60) * 3; // Other: 3 km/hr
    }, 0);

    const steps = Math.round(totalDistance * 1300);
    const distance = totalDistance.toFixed(1);

    // Generate labels based on period
    const labels = generateLabels(period);

    // Generate history data
    const calorieHistory = generateCalorieHistory(workouts, meals, labels, period);
    const waterHistory = generateWaterHistory(waterSleep, labels, period);
    const sleepHistory = generateSleepHistory(waterSleep, labels, period);

    return {
        steps: steps || 0,
        calories: totalCaloriesBurned || 0,
        distance: distance || 0,
        waterToday: waterToday || 0,
        labels: labels,
        calorieHistory: calorieHistory,
        waterHistory: waterHistory,
        sleepHistory: sleepHistory
    };
}

function generateLabels(period) {
    if (period === 'today') {
        return ['12AM', '4AM', '8AM', '12PM', '4PM', '8PM'];
    } else if (period === 'week') {
        return ['SAT', 'SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI'];
    } else if (period === 'month') {
        return ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    }
    return ['SAT', 'SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI'];
}

function generateCalorieHistory(workouts, meals, labels, period) {
    const burned = new Array(labels.length).fill(0);
    const consumed = new Array(labels.length).fill(0);

    if (period === 'today') {
        meals.forEach(m => {
            if (m.mealTime) {
                // Format is HH:mm or HH:mm:ss
                const hour = parseInt(m.mealTime.split(':')[0]);
                const index = Math.min(Math.floor(hour / 4), labels.length - 1);
                consumed[index] += m.calories || 0;
                console.log(`Today Meal: ${m.mealType} at hour ${hour} -> index ${index}`);
            } else {
                // Default to 12PM if no time
                consumed[3] += m.calories || 0;
            }
        });
        workouts.forEach(w => {
            // Logs today, map to a reasonable hour if missing, or use current hour for real-time update
            const now = new Date();
            const hour = now.getHours();
            const index = Math.min(Math.floor(hour / 4), labels.length - 1);
            burned[index] += w.caloriesBurned || 0;
            console.log(`Today Workout: ${w.exerciseType} mapping to hour ${hour} -> index ${index}`);
        });
    } else if (period === 'week') {
        // Group by day of week
        workouts.forEach(w => {
            const date = new Date(w.logDate);
            const dayIndex = (date.getDay() + 1) % 7; // Adjust to SAT=0
            if (dayIndex < labels.length) {
                burned[dayIndex] += w.caloriesBurned || 0;
            }
        });

        meals.forEach(m => {
            const date = new Date(m.logDate);
            const dayIndex = (date.getDay() + 1) % 7;
            if (dayIndex < labels.length) {
                consumed[dayIndex] += m.calories || 0;
            }
        });
    }

    return { burned, consumed };
}

function generateWaterHistory(waterSleep, labels, period) {
    const history = new Array(labels.length).fill(0);

    if (period === 'today') {
        waterSleep.forEach(ws => {
            const now = new Date();
            const hour = now.getHours();
            const index = Math.min(Math.floor(hour / 4), labels.length - 1);
            history[index] += ws.waterIntakeLiters || 0;
            console.log(`Today Water: ${ws.waterIntakeLiters}L mapping to hour ${hour} -> index ${index}`);
        });
    } else if (period === 'week') {
        waterSleep.forEach(ws => {
            const date = new Date(ws.logDate);
            const dayIndex = (date.getDay() + 1) % 7;
            if (dayIndex < labels.length) {
                history[dayIndex] += ws.waterIntakeLiters || 0;
            }
        });
    }

    return history;
}

function generateSleepHistory(waterSleep, labels, period) {
    const history = new Array(labels.length).fill(0);

    if (period === 'today') {
        waterSleep.forEach(ws => {
            const now = new Date();
            const hour = now.getHours();
            const index = Math.min(Math.floor(hour / 4), labels.length - 1);
            history[index] = ws.sleepHours || 0;
            console.log(`Today Sleep: ${ws.sleepHours}h mapping to hour ${hour} -> index ${index}`);
        });
    } else if (period === 'week') {
        waterSleep.forEach(ws => {
            const date = new Date(ws.logDate);
            const dayIndex = (date.getDay() + 1) % 7;
            if (dayIndex < labels.length) {
                history[dayIndex] = ws.sleepHours || 0;
            }
        });
    }

    return history;
}

function getSimulatedStats(period) {
    const labels = generateLabels(period);

    return {
        steps: 8234,
        calories: 2150,
        distance: 5.6,
        waterToday: 1.8,
        labels: labels,
        calorieHistory: {
            burned: [50, 400, 50, 50, 3600, 50, 50],
            consumed: [100, 100, 150, 100, 100, 200, 100]
        },
        waterHistory: [0.5, 0.8, 0.3, 0.2, 3.2, 0.8, 1.4],
        sleepHistory: [0, 2, 4, 3, 38, 5, 2]
    };
}

function updateDashboardUI(stats) {
    // Summary Cards
    setElText("newStepsVal", stats.steps.toLocaleString());
    setElText("newBurnedValToday", stats.calories.toLocaleString());
    setElText("newDistanceVal", stats.distance + " km");
    setElText("newWaterValToday", stats.waterToday + " L");

    // Charts
    renderDualCalorieChart(stats);
    renderWaterPatternChart(stats);
    renderSleepConsistencyChart(stats);

    // Goal Progress Tracking
    updateGoalProgress(stats);
}

function updateGoalProgress(stats) {
    // Goals
    const GOAL_STEPS = 10000;
    const GOAL_EXERCISE_DAYS = 5;
    const GOAL_WATER = 2.5;

    // Calculate current values
    const currentSteps = stats.steps || 0;
    const currentWater = stats.waterToday || 0;

    // Calculate exercise days this week (count unique days with workouts)
    const currentExerciseDays = calculateExerciseDays();

    // Update Steps Goal
    const stepsPercentage = Math.min(Math.round((currentSteps / GOAL_STEPS) * 100), 100);
    setElText("currentSteps", currentSteps.toLocaleString());
    setElText("stepsPercentage", stepsPercentage + "%");
    updateProgressBar("stepsProgressBar", stepsPercentage);

    // Update Exercise Goal
    const exercisePercentage = Math.min(Math.round((currentExerciseDays / GOAL_EXERCISE_DAYS) * 100), 100);
    setElText("currentExerciseDays", currentExerciseDays);
    setElText("exercisePercentage", exercisePercentage + "%");
    updateProgressBar("exerciseProgressBar", exercisePercentage);

    // Update Water Goal
    const waterPercentage = Math.min(Math.round((currentWater / GOAL_WATER) * 100), 100);
    setElText("currentWater", currentWater.toFixed(1));
    setElText("waterPercentage", waterPercentage + "%");
    updateProgressBar("waterGoalProgressBar", waterPercentage);

    // Provide actionable insights
    provideGoalInsights(stepsPercentage, exercisePercentage, waterPercentage, currentSteps, currentExerciseDays, currentWater, GOAL_STEPS, GOAL_EXERCISE_DAYS, GOAL_WATER);
}

function calculateExerciseDays() {
    // This will be populated from actual workout data
    // For now, return a placeholder that will be updated when we fetch workout data
    return window.exerciseDaysThisWeek || 0;
}

function updateProgressBar(elementId, percentage) {
    const bar = document.getElementById(elementId);
    if (bar) {
        bar.style.width = percentage + "%";

        // Color code based on progress
        if (percentage >= 80) {
            bar.style.background = "#18b046"; // Green - on track
        } else if (percentage >= 50) {
            bar.style.background = "#ffc107"; // Yellow - needs attention
        } else {
            bar.style.background = "#ff6b6b"; // Red - off track
        }
    }
}

function provideGoalInsights(stepsPercentage, exercisePercentage, waterPercentage, currentSteps, currentExerciseDays, currentWater, goalSteps, goalExerciseDays, goalWater) {
    const insights = [];

    // Steps insights
    const stepsInsightEl = document.getElementById("stepsInsight");
    if (stepsPercentage < 50) {
        stepsInsightEl.style.display = "block";
        stepsInsightEl.style.color = "#ff6b6b";
        stepsInsightEl.innerHTML = `⚠️ You need ${(goalSteps - currentSteps).toLocaleString()} more steps to reach your goal. Try a 15-minute walk!`;
        insights.push("Daily steps goal is off-track");
    } else if (stepsPercentage < 80) {
        stepsInsightEl.style.display = "block";
        stepsInsightEl.style.color = "#ffc107";
        stepsInsightEl.innerHTML = `💪 You're ${stepsPercentage}% there! ${(goalSteps - currentSteps).toLocaleString()} steps to go.`;
    } else if (stepsPercentage >= 100) {
        stepsInsightEl.style.display = "block";
        stepsInsightEl.style.color = "#18b046";
        stepsInsightEl.innerHTML = `🎉 Goal achieved! You've exceeded your daily target!`;
    } else {
        stepsInsightEl.style.display = "none";
    }

    // Exercise insights
    const exerciseInsightEl = document.getElementById("exerciseInsight");
    const daysLeft = 7 - new Date().getDay(); // Days left in week
    const exerciseDaysNeeded = goalExerciseDays - currentExerciseDays;

    if (exercisePercentage < 50 && daysLeft > 0) {
        exerciseInsightEl.style.display = "block";
        exerciseInsightEl.style.color = "#ff6b6b";
        exerciseInsightEl.innerHTML = `⚠️ You need to exercise ${exerciseDaysNeeded} more days this week. ${daysLeft} days remaining!`;
        insights.push("Weekly exercise goal needs attention");
    } else if (exercisePercentage < 80) {
        exerciseInsightEl.style.display = "block";
        exerciseInsightEl.style.color = "#ffc107";
        exerciseInsightEl.innerHTML = `💪 Great progress! ${exerciseDaysNeeded} more workout days to reach your goal.`;
    } else if (exercisePercentage >= 100) {
        exerciseInsightEl.style.display = "block";
        exerciseInsightEl.style.color = "#18b046";
        exerciseInsightEl.innerHTML = `🎉 Weekly goal achieved! Keep up the excellent work!`;
    } else {
        exerciseInsightEl.style.display = "none";
    }

    // Water insights
    const waterInsightEl = document.getElementById("waterInsight");
    if (waterPercentage < 50) {
        waterInsightEl.style.display = "block";
        waterInsightEl.style.color = "#ff6b6b";
        waterInsightEl.innerHTML = `⚠️ You need ${(goalWater - currentWater).toFixed(1)}L more water today. Stay hydrated!`;
        insights.push("Water intake is below target");
    } else if (waterPercentage < 80) {
        waterInsightEl.style.display = "block";
        waterInsightEl.style.color = "#007aff";
        waterInsightEl.innerHTML = `💧 Almost there! ${(goalWater - currentWater).toFixed(1)}L more to reach your goal.`;
    } else if (waterPercentage >= 100) {
        waterInsightEl.style.display = "block";
        waterInsightEl.style.color = "#18b046";
        waterInsightEl.innerHTML = `🎉 Hydration goal achieved! Excellent!`;
    } else {
        waterInsightEl.style.display = "none";
    }

    // Overall insight alert
    const overallInsightEl = document.getElementById("overallInsight");
    const overallInsightTextEl = document.getElementById("overallInsightText");

    if (insights.length > 0) {
        overallInsightEl.style.display = "block";
        overallInsightTextEl.innerHTML = `
            <strong>Areas needing attention:</strong><br/>
            ${insights.map(i => `• ${i}`).join('<br/>')}
            <br/><br/>
            <strong>Recommendation:</strong> Focus on completing at least one goal today to stay on track with your fitness journey.
        `;
    } else {
        overallInsightEl.style.display = "none";
    }
}

function setElText(id, txt) {
    const el = document.getElementById(id);
    if (el) el.innerText = txt;
}

function renderDualCalorieChart(stats) {
    const ctx = document.getElementById('dualCalorieChart');
    if (!ctx) return;
    const existing = Chart.getChart(ctx);
    if (existing) existing.destroy();

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: stats.labels,
            datasets: [
                {
                    label: 'Burned',
                    data: stats.calorieHistory.burned,
                    borderColor: '#18b046',
                    backgroundColor: 'rgba(24, 176, 70, 0.2)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 4,
                    pointBackgroundColor: '#18b046'
                },
                {
                    label: 'Consumed',
                    data: stats.calorieHistory.consumed,
                    borderColor: '#ff375f',
                    backgroundColor: 'transparent',
                    fill: false,
                    tension: 0.4,
                    borderWidth: 2,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#666' } },
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#666' } }
            }
        }
    });
}

function renderWaterPatternChart(stats) {
    const ctx = document.getElementById('waterPatternChart');
    if (!ctx) return;
    const existing = Chart.getChart(ctx);
    if (existing) existing.destroy();

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: stats.labels,
            datasets: [{
                data: stats.waterHistory,
                backgroundColor: '#007aff',
                borderRadius: 5,
                barThickness: 25
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#666' } },
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#666' },
                    suggestedMax: 3.5
                }
            }
        }
    });
}

function renderSleepConsistencyChart(stats) {
    const ctx = document.getElementById('sleepConsistencyChart');
    if (!ctx) return;
    const existing = Chart.getChart(ctx);
    if (existing) existing.destroy();

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: stats.labels,
            datasets: [{
                data: stats.sleepHistory,
                borderColor: '#bf5af2',
                backgroundColor: 'transparent',
                fill: false,
                tension: 0.4,
                borderWidth: 3,
                pointRadius: 4,
                pointBackgroundColor: '#18b046'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#666' } },
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#666' } }
            }
        }
    });
}

async function fetchTrainerInfo() {
    const email = localStorage.getItem("userEmail");
    console.log("Fetching trainer info for:", email);
    try {
        const profileRes = await fetch(`${API_BASE_URL}/profile?email=${email}`);
        if (profileRes.ok) {
            const profile = await profileRes.json();
            console.log("User profile loaded:", profile);
            if (profile.trainerId) {
                console.log("Trainer ID found in profile:", profile.trainerId);
                const trainerRes = await fetch(`${API_BASE_URL}/trainers/${profile.trainerId}`);
                if (trainerRes.ok) {
                    const trainer = await trainerRes.json();
                    console.log("Trainer details loaded:", trainer);
                    document.getElementById("trainerName").innerText = trainer.name;
                    document.getElementById("trainerSpec").innerText = trainer.specialization || "Expert Coach";
                    if (trainer.imageUrl) {
                        document.getElementById("trainerImg").src = trainer.imageUrl;
                    }
                    trainerUserId = trainer.userId;
                    console.log("trainerUserId set to:", trainerUserId);

                    // Hide "no trainer" message
                    const noTrainerMsg = document.getElementById("noTrainerMsg");
                    if (noTrainerMsg) noTrainerMsg.style.display = 'none';
                } else {
                    console.error("Failed to fetch trainer details for ID:", profile.trainerId);
                }
            } else {
                console.log("No trainer assigned to this user.");
                // Show "no trainer" message
                const noTrainerMsg = document.getElementById("noTrainerMsg");
                if (noTrainerMsg) noTrainerMsg.style.display = 'block';
                document.getElementById("trainerName").innerText = "No Trainer";
            }
        } else {
            console.error("Failed to fetch user profile for trainer info");
        }
    } catch (e) {
        console.error("Error fetching trainer:", e);
    }
}

async function fetchUserPlans(userId) {
    try {
        const response = await fetch(`${API_BASE_URL}/trainers/user-plans/${userId}`);
        if (response.ok) {
            const plans = await response.json();
            const planExercises = document.getElementById("planExercises");
            const planTitle = document.getElementById("planTitle");
            const planDesc = document.getElementById("planDesc");

            if (plans.length > 0) {
                const latestPlan = plans[plans.length - 1];
                planTitle.innerText = latestPlan.title || "Workout Plan";
                planDesc.innerText = latestPlan.description || "Your assigned workout plan";

                if (latestPlan.exercises) {
                    const exercises = latestPlan.exercises.split('\n').filter(e => e.trim());
                    planExercises.innerHTML = exercises.slice(0, 3).map(ex =>
                        `<li>${ex.trim()}</li>`
                    ).join('');
                }
            }
        }
    } catch (e) {
        console.error("Error fetching plans:", e);
    }
}

async function fetchUserMealPlans(userId) {
    try {
        const response = await fetch(`${API_BASE_URL}/trainers/user-meal-plans/${userId}`);
        if (response.ok) {
            const plans = await response.json();
            const mealList = document.getElementById("mealList");
            const mealTitle = document.getElementById("mealTitle");
            const mealDesc = document.getElementById("mealDesc");

            if (plans.length > 0) {
                const latestPlan = plans[plans.length - 1];
                mealTitle.innerText = latestPlan.title || "Meal Plan";
                mealDesc.innerText = latestPlan.description || "Your assigned diet plan";

                if (latestPlan.meals) {
                    const meals = latestPlan.meals.split('\n').filter(m => m.trim());
                    mealList.innerHTML = meals.slice(0, 3).map(meal =>
                        `<li>${meal.trim()}</li>`
                    ).join('');
                }
            }
        }
    } catch (e) {
        console.error("Error fetching meal plans:", e);
    }
}

function toggleChat() {
    console.log("toggleChat called, trainerUserId:", trainerUserId);

    // Check if user has a trainer
    if (!trainerUserId) {
        alert("You need to have a trainer assigned before you can chat. Please visit the Trainers page to select a trainer.");
        return;
    }

    const modal = document.getElementById('chatModal');
    console.log("Chat modal found:", modal);

    if (!modal) {
        console.error("Chat modal not found in DOM");
        return;
    }

    const isOpening = modal.style.display === 'none' || modal.style.display === '';
    console.log("Opening chat:", isOpening);

    modal.style.display = isOpening ? 'flex' : 'none';

    if (isOpening) {
        fetchMessages();
        chatInterval = setInterval(fetchMessages, 3000);
    } else {
        clearInterval(chatInterval);
    }
}

async function fetchMessages() {
    if (!trainerUserId) return;
    const myId = localStorage.getItem('userId');
    try {
        const res = await fetch(`${API_BASE_URL}/messages/conversation?u1=${myId}&u2=${trainerUserId}`);
        if (res.ok) {
            const msgs = await res.json();
            const box = document.getElementById('chatMessages');
            box.innerHTML = msgs.map(m => `
                <div style="align-self: ${m.senderId == myId ? 'flex-end' : 'flex-start'}; 
                            background: ${m.senderId == myId ? 'rgba(24, 176, 70, 0.3)' : '#222'}; 
                            padding: 8px 12px; border-radius: 8px; font-size: 13px; max-width: 80%; margin-bottom: 5px;">
                    ${m.content}
                </div>
            `).join('');
            box.scrollTop = box.scrollHeight;
        }
    } catch (e) {
        console.error("Error fetching messages:", e);
    }
}

async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const val = input.value.trim();
    if (!val || !trainerUserId) return;
    const myId = localStorage.getItem('userId');
    try {
        await fetch(`${API_BASE_URL}/messages/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ senderId: myId, receiverId: trainerUserId, content: val })
        });
        input.value = '';
        fetchMessages();
    } catch (e) {
        console.error("Error sending message:", e);
    }
}

// Make functions globally accessible for inline onclick handlers
window.toggleChat = toggleChat;
window.sendChatMessage = sendChatMessage;
