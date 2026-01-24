// dashboard-new.js - Enhanced dashboard with complete analytics implementation

const API_BASE_URL = "http://localhost:8080/api";
const TRACKER_API = "http://localhost:8080/api/tracker";

let trainerUserId = null;
let chatInterval = null;
let currentPeriod = 'today'; // Matches the 'active' button in HTML on load

// Chart instances
let workoutDurationChart = null;
let dualCalorieChart = null;
let waterPatternChart = null;
let sleepConsistencyChart = null;
let dailyStepsChart = null;
let dailyGoalChart = null;

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

    // Role Check for Admin - Dedicated Admins don't need personal tracking
    const userRole = localStorage.getItem("userRole");
    if (userRole === 'ADMIN' && window.location.pathname.includes('dashboard.html')) {
        window.location.href = "admin.html";
        return;
    }


    // Role Check for Admin Link
    const storedRole = localStorage.getItem("userRole");
    const adminLink = document.getElementById("adminLink");
    if (adminLink && storedRole === 'ADMIN') {
        adminLink.style.display = 'inline-block';
    }


    // Bind Chat Button
    const chatBtn = document.getElementById("chatBtn");
    if (chatBtn) {
        chatBtn.onclick = function () {
            toggleChat();
        };
    }

    // Fetch User Profile
    await fetchUserProfile(userEmail);


    // Load Analytics Data
    await loadAnalyticsData(currentPeriod);

    // Load Trainer, Plans, Meals
    await fetchTrainerInfo();
    await fetchUserPlans(userId);
    await fetchUserMealPlans(userId);

    // Setup Tab Listeners
    setupTabListeners();

    // Logout
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
            tabBtns.forEach(b => {
                b.classList.remove('active');
            });
            btn.classList.add('active');
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
                welcomeSpan.innerText = user.fullName || user.name || email.split('@')[0];
            }

            // Update Nav Profile section
            const navUserName = document.getElementById("navUserName");
            if (navUserName) {
                navUserName.innerText = user.fullName || user.name || email.split('@')[0];
            }
            if (navUserRole) {
                navUserRole.innerText = user.role || "USER";
                // Sync localStorage just in case it was changed via admin panel
                localStorage.setItem('userRole', user.role || "USER");
            }
            const navUserAvatar = document.getElementById("navUserAvatar");
            const navUserIcon = document.getElementById("navUserIcon");
            if (navUserAvatar && user.image_url) {
                navUserAvatar.src = user.image_url;
                navUserAvatar.style.display = "block";
                if (navUserIcon) navUserIcon.style.display = "none";
                if (navUserIcon) {
                    navUserIcon.style.display = "block";
                    if (navUserAvatar) navUserAvatar.style.display = "none";
                }
            }

            // Disable profile link for Admin
            if (user.role === 'ADMIN') {
                const profileLink = document.querySelector('.user-profile-section > a');
                if (profileLink) {
                    profileLink.href = 'javascript:void(0)';
                    profileLink.style.cursor = 'default';
                }
            }
        }
    } catch (e) {
        console.error("Error fetching profile:", e);
    }
}

async function loadAnalyticsData(period) {
    const userId = localStorage.getItem("userId");

    try {
        const stats = await fetchTrackerStats(userId, period);
        updateDashboardUI(stats);
    } catch (error) {
        console.error("Error loading analytics:", error);
        // Error handling: Show empty stats instead of mock data to avoid confusion
        const emptyStats = processTrackerData([], [], [], period);
        updateDashboardUI(emptyStats);
    }
}

async function fetchTrackerStats(userId, period) {
    const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
    let startDate, endDate;
    const todayDate = new Date();

    switch (period) {
        case 'today':
            startDate = endDate = today;
            break;
        case 'week':
            const weekAgo = new Date(todayDate);
            weekAgo.setDate(weekAgo.getDate() - 6);
            startDate = weekAgo.toLocaleDateString('en-CA');
            endDate = today;
            break;
        case 'month':
            const monthAgo = new Date(todayDate);
            monthAgo.setDate(monthAgo.getDate() - 29);
            startDate = monthAgo.toLocaleDateString('en-CA');
            endDate = today;
            break;
        default:
            startDate = endDate = today;
    }

    try {
        const [workoutsRes, mealsRes, waterSleepRes] = await Promise.all([
            fetch(`${TRACKER_API}/workouts/${userId}/range?start=${startDate}&end=${endDate}`),
            fetch(`${TRACKER_API}/meals/${userId}/range?start=${startDate}&end=${endDate}`),
            fetch(`${TRACKER_API}/water-sleep/${userId}/range?start=${startDate}&end=${endDate}`)
        ]);

        const workouts = workoutsRes.ok ? await workoutsRes.json() : [];
        const meals = mealsRes.ok ? await mealsRes.json() : [];
        const waterSleep = waterSleepRes.ok ? await waterSleepRes.json() : [];

        return processTrackerData(workouts, meals, waterSleep, period);
    } catch (error) {
        console.error("Error fetching tracker data:", error);
        throw error;
    }
}

function processTrackerData(workouts, meals, waterSleep, period) {
    const totalCaloriesBurned = workouts.reduce((sum, w) => sum + (Number(w.caloriesBurned) || 0), 0);
    const totalCaloriesConsumed = meals.reduce((sum, m) => sum + (Number(m.calories) || 0), 0);

    const todayStr = new Date().toLocaleDateString('en-CA');
    const todayWaterLogs = waterSleep.filter(ws => ws.logDate === todayStr);
    const waterToday = todayWaterLogs.reduce((sum, ws) => sum + (Number(ws.waterIntakeLiters) || 0), 0);

    const uniqueWorkoutDays = new Set(workouts.map(w => w.logDate));
    window.exerciseDaysThisWeek = uniqueWorkoutDays.size;

    const totalDistance = workouts.reduce((sum, w) => {
        const duration = Number(w.durationMinutes) || 0;
        if (w.exerciseType && w.exerciseType.toLowerCase().includes('run')) {
            return sum + (duration / 60) * 8;
        } else if (w.exerciseType && w.exerciseType.toLowerCase().includes('walk')) {
            return sum + (duration / 60) * 5;
        }
        return sum + (duration / 60) * 3;
    }, 0);

    const steps = Math.round(totalDistance * 1300);
    const distance = Number(totalDistance).toFixed(1);

    const labels = generateLabels(period);
    const workoutDurationData = generateWorkoutDurationData(workouts, labels, period);
    const calorieHistory = generateCalorieHistory(workouts, meals, labels, period);
    const waterHistory = generateWaterHistory(waterSleep, labels, period);
    const sleepHistory = generateSleepHistory(waterSleep, labels, period);

    return {
        steps: steps,
        calories: totalCaloriesBurned,
        distance: distance,
        waterToday: waterToday,
        labels: labels,
        workoutDurationData: workoutDurationData,
        calorieHistory: calorieHistory,
        waterHistory: waterHistory,
        sleepHistory: sleepHistory
    };
}

function generateLabels(period) {
    if (period === 'today') {
        return ['12AM', '4AM', '8AM', '12PM', '4PM', '8PM'];
    } else if (period === 'week') {
        const labels = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase());
        }
        return labels;
    } else if (period === 'month') {
        return ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    }
    return [];
}

function getDataIndex(logDate, logTime, period, labels) {
    if (!logDate) return -1;

    // Normalize logDate to YYYY-MM-DD string
    const dateStr = logDate.includes('T') ? logDate.split('T')[0] : logDate;
    const nowStr = new Date().toLocaleDateString('en-CA');

    if (period === 'today') {
        if (!logTime) return 3; // Default to 12PM
        const hours = parseInt(logTime.split(':')[0]);
        return Math.floor(hours / 4);
    } else if (period === 'week') {
        const dateObj = new Date(dateStr + "T00:00:00");
        const nowObj = new Date(nowStr + "T00:00:00");
        const diffTime = nowObj - dateObj;
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        const index = 6 - diffDays;
        return (index >= 0 && index < 7) ? index : -1;
    } else if (period === 'month') {
        const dateObj = new Date(dateStr + "T00:00:00");
        const nowObj = new Date(nowStr + "T00:00:00");
        const diffTime = nowObj - dateObj;
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays >= 30) return -1;
        return 3 - Math.floor(diffDays / 7);
    }
    return -1;
}

function generateWorkoutDurationData(workouts, labels, period) {
    // Create stacked data for different workout types
    const activities = {
        walking: new Array(labels.length).fill(0),
        cycling: new Array(labels.length).fill(0),
        running: new Array(labels.length).fill(0),
        yoga: new Array(labels.length).fill(0),
        swimming: new Array(labels.length).fill(0),
        gym: new Array(labels.length).fill(0)
    };

    workouts.forEach(w => {
        const idx = getDataIndex(w.logDate, w.logTime, period, labels);
        if (idx !== -1 && idx < labels.length) {
            const type = (w.exerciseType || '').toLowerCase();
            if (type.includes('walk')) activities.walking[idx] += w.durationMinutes || 0;
            else if (type.includes('cycl')) activities.cycling[idx] += w.durationMinutes || 0;
            else if (type.includes('run')) activities.running[idx] += w.durationMinutes || 0;
            else if (type.includes('yoga')) activities.yoga[idx] += w.durationMinutes || 0;
            else if (type.includes('swim')) activities.swimming[idx] += w.durationMinutes || 0;
            else activities.gym[idx] += w.durationMinutes || 0;
        }
    });

    return activities;
}

function generateCalorieHistory(workouts, meals, labels, period) {
    const burned = new Array(labels.length).fill(0);
    const consumed = new Array(labels.length).fill(0);

    workouts.forEach(w => {
        const idx = getDataIndex(w.logDate, w.logTime, period, labels);
        if (idx !== -1 && idx < labels.length) {
            burned[idx] += w.caloriesBurned || 0;
        }
    });

    meals.forEach(m => {
        const idx = getDataIndex(m.logDate, m.mealTime, period, labels);
        if (idx !== -1 && idx < labels.length) {
            consumed[idx] += m.calories || 0;
        }
    });

    return { burned, consumed };
}

function generateWaterHistory(waterSleep, labels, period) {
    const history = new Array(labels.length).fill(0);

    waterSleep.forEach(ws => {
        const idx = getDataIndex(ws.logDate, ws.logTime, period, labels);
        if (idx !== -1 && idx < labels.length) {
            history[idx] += ws.waterIntakeLiters || 0;
        }
    });

    return history;
}

function generateSleepHistory(waterSleep, labels, period) {
    const history = new Array(labels.length).fill(0);

    waterSleep.forEach(ws => {
        const idx = getDataIndex(ws.logDate, ws.logTime, period, labels);
        if (idx !== -1 && idx < labels.length) {
            if (ws.sleepHours !== undefined && ws.sleepHours !== null) {
                history[idx] = ws.sleepHours;
            }
        }
    });

    return history;
}

function getMockStats(period) {
    const labels = generateLabels(period);
    const count = labels.length;

    return {
        steps: 7679,
        calories: 425,
        distance: 5.9,
        waterToday: 3.5,
        labels: labels,
        workoutDurationData: {
            walking: new Array(count).fill(0).map(() => Math.floor(Math.random() * 40)),
            cycling: new Array(count).fill(0).map(() => Math.floor(Math.random() * 30)),
            running: new Array(count).fill(0).map(() => Math.floor(Math.random() * 45)),
            yoga: new Array(count).fill(0).map(() => Math.floor(Math.random() * 60)),
            swimming: new Array(count).fill(0).map(() => Math.floor(Math.random() * 40)),
            gym: new Array(count).fill(0).map(() => Math.floor(Math.random() * 50))
        },
        calorieHistory: {
            burned: new Array(count).fill(0).map(() => 200 + Math.floor(Math.random() * 400)),
            consumed: new Array(count).fill(0).map(() => 1500 + Math.floor(Math.random() * 1000))
        },
        waterHistory: new Array(count).fill(0).map(() => (1.5 + Math.random() * 2).toFixed(1)),
        sleepHistory: new Array(count).fill(0).map(() => (6 + Math.random() * 3).toFixed(1))
    };
}

function updateDashboardUI(stats) {
    // Update Summary Cards
    setElText("newStepsVal", stats.steps.toLocaleString());
    setElText("newBurnedValToday", stats.calories.toLocaleString());
    setElText("newDistanceVal", stats.distance + " km");
    setElText("newWaterValToday", stats.waterToday + " L");

    // Update Chart Titles dynamically
    const periodLabel = currentPeriod === 'today' ? 'Today' :
        currentPeriod === 'week' ? 'Last 7 Days' :
            currentPeriod === 'month' ? 'Last 30 Days' : 'Custom';

    setElText("workoutDurationTitle", `📊 Workout Duration (${periodLabel})`);
    setElText("calorieTrendTitle", `🔥 Calorie Trend (${periodLabel})`);
    setElText("waterPatternTitle", `💧 Water Intake Patterns (${periodLabel})`);
    setElText("sleepConsistencyTitle", `😴 Sleep Consistency (${periodLabel})`);

    // Render All Charts
    renderWorkoutDurationChart(stats);
    renderDualCalorieChart(stats);
    renderWaterPatternChart(stats);
    renderSleepConsistencyChart(stats);
    renderDailyStepsChart(stats);
    renderDailyGoalChart(stats);

    // Update Progress Tracking
    updateGoalProgress(stats);
}

function renderWorkoutDurationChart(stats) {
    const ctx = document.getElementById('workoutDurationChart');
    if (!ctx) return;

    if (workoutDurationChart) workoutDurationChart.destroy();

    const data = stats.workoutDurationData;

    workoutDurationChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: stats.labels,
            datasets: [
                {
                    label: 'Walking',
                    data: data.walking,
                    backgroundColor: '#18b046',
                    borderRadius: 4
                },
                {
                    label: 'Cycling',
                    data: data.cycling,
                    backgroundColor: '#ff9f0a',
                    borderRadius: 4
                },
                {
                    label: 'Running',
                    data: data.running,
                    backgroundColor: '#007aff',
                    borderRadius: 4
                },
                {
                    label: 'Yoga',
                    data: data.yoga,
                    backgroundColor: '#ff375f',
                    borderRadius: 4
                },
                {
                    label: 'Swimming',
                    data: data.swimming,
                    backgroundColor: '#00c7be',
                    borderRadius: 4
                },
                {
                    label: 'Gym - Strength',
                    data: data.gym,
                    backgroundColor: '#bf5af2',
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        color: '#fff',
                        padding: 15,
                        font: { size: 11 }
                    }
                },
                title: {
                    display: false
                }
            },
            scales: {
                x: {
                    stacked: true,
                    grid: { display: false },
                    ticks: { color: '#888', font: { size: 12 } }
                },
                y: {
                    stacked: true,
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: {
                        color: '#888',
                        font: { size: 12 },
                        callback: function (value) {
                            return value + ' min';
                        }
                    },
                    title: {
                        display: true,
                        text: 'Minutes',
                        color: '#888',
                        font: { size: 12 }
                    }
                }
            }
        }
    });
}

function renderDualCalorieChart(stats) {
    const ctx = document.getElementById('dualCalorieChart');
    if (!ctx) return;

    if (dualCalorieChart) dualCalorieChart.destroy();

    dualCalorieChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: stats.labels,
            datasets: [
                {
                    label: 'Calories Burned',
                    data: stats.calorieHistory.burned,
                    borderColor: '#8b7fff',
                    backgroundColor: 'rgba(139, 127, 255, 0.3)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 5,
                    pointBackgroundColor: '#8b7fff'
                },
                {
                    label: 'Calories Consumed',
                    data: stats.calorieHistory.consumed,
                    borderColor: '#ff9aa2',
                    backgroundColor: 'rgba(255, 154, 162, 0.2)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 5,
                    pointBackgroundColor: '#ff9aa2'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        color: '#fff',
                        padding: 15,
                        font: { size: 11 }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: '#888', font: { size: 12 } }
                },
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: {
                        color: '#888',
                        font: { size: 12 },
                        callback: function (value) {
                            return value + ' kcal';
                        }
                    }
                }
            }
        }
    });
}

function renderWaterPatternChart(stats) {
    const ctx = document.getElementById('waterPatternChart');
    if (!ctx) return;

    if (waterPatternChart) waterPatternChart.destroy();

    waterPatternChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: stats.labels,
            datasets: [{
                label: 'Water Intake (L)',
                data: stats.waterHistory,
                backgroundColor: '#18b046',
                borderRadius: 6,
                barThickness: 30
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                annotation: {
                    annotations: {
                        line1: {
                            type: 'line',
                            yMin: 2.5,
                            yMax: 2.5,
                            borderColor: '#ffc107',
                            borderWidth: 2,
                            borderDash: [5, 5],
                            label: {
                                content: 'Goal (2.5L)',
                                enabled: true,
                                position: 'end'
                            }
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: '#888', font: { size: 11 } }
                },
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: {
                        color: '#888',
                        font: { size: 11 },
                        callback: function (value) {
                            return value + 'L';
                        }
                    },
                    suggestedMax: 4.0,
                    title: {
                        display: true,
                        text: 'Liters',
                        color: '#888'
                    }
                }
            }
        }
    });
}

function renderSleepConsistencyChart(stats) {
    const ctx = document.getElementById('sleepConsistencyChart');
    if (!ctx) return;

    if (sleepConsistencyChart) sleepConsistencyChart.destroy();

    sleepConsistencyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: stats.labels,
            datasets: [{
                label: 'Sleep (hours)',
                data: stats.sleepHistory,
                backgroundColor: '#bf5af2',
                borderRadius: 6,
                barThickness: 30
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: '#888', font: { size: 11 } }
                },
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: {
                        color: '#888',
                        font: { size: 11 },
                        callback: function (value) {
                            return value + 'h';
                        }
                    },
                    suggestedMax: 10,
                    title: {
                        display: true,
                        text: 'Hours',
                        color: '#888'
                    }
                }
            }
        }
    });
}

function renderDailyStepsChart(stats) {
    const ctx = document.getElementById('dailyStepsChart');
    if (!ctx) return;

    if (dailyStepsChart) dailyStepsChart.destroy();

    const stepsPercentage = Math.min((stats.steps / 10000) * 100, 100);

    dailyStepsChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Steps', 'Remaining'],
            datasets: [{
                data: [stepsPercentage, 100 - stepsPercentage],
                backgroundColor: ['#007aff', 'rgba(255,255,255,0.1)'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            }
        },
        plugins: [{
            id: 'centerText',
            afterDraw: (chart) => {
                const ctx = chart.ctx;
                const centerX = chart.chartArea.left + (chart.chartArea.right - chart.chartArea.left) / 2;
                const centerY = chart.chartArea.top + (chart.chartArea.bottom - chart.chartArea.top) / 2;

                ctx.save();
                ctx.font = 'bold 32px sans-serif';
                ctx.fillStyle = '#fff';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(stats.steps.toLocaleString(), centerX, centerY - 10);

                ctx.font = '12px sans-serif';
                ctx.fillStyle = '#888';
                ctx.fillText('Steps', centerX, centerY + 20);
                ctx.restore();
            }
        }]
    });
}

function renderDailyGoalChart(stats) {
    const ctx = document.getElementById('dailyGoalChart');
    if (!ctx) return;

    if (dailyGoalChart) dailyGoalChart.destroy();

    // Calculate percentages for each goal category based on actual stats
    const GOAL_STEPS = 10000;
    const GOAL_WATER = 2.5;
    const GOAL_SLEEP = 8;

    // Normalize percentages so they fit in the donut (out of 75%, leaving 25% for bottom spacing or just full)
    const sPerc = Math.min((stats.steps / GOAL_STEPS) * 100, 100);
    const wPerc = Math.min((stats.waterToday / GOAL_WATER) * 100, 100);
    const slPerc = Math.min(((stats.sleepHistory[stats.sleepHistory.length - 1] || 0) / GOAL_SLEEP) * 100, 100);

    const avgProgress = Math.round((sPerc + wPerc + slPerc) / 3);
    const remaining = 100 - avgProgress;

    dailyGoalChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Steps', 'Water', 'Sleep', 'Remaining'],
            datasets: [{
                data: [sPerc / 3, wPerc / 3, slPerc / 3, remaining],
                backgroundColor: ['#007aff', '#18b046', '#bf5af2', 'rgba(255,255,255,0.1)'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        color: '#fff',
                        padding: 10,
                        font: { size: 10 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return context.label + ': ' + context.parsed + '%';
                        }
                    }
                }
            }
        }
    });
}

function updateGoalProgress(stats) {
    const GOAL_STEPS = 10000;
    const GOAL_EXERCISE_DAYS = 5;
    const GOAL_WATER = 2.5;

    const currentSteps = stats.steps || 2000;
    const currentWater = stats.waterToday || 0;
    const currentExerciseDays = window.exerciseDaysThisWeek || 0;

    // Update Steps
    const stepsPercentage = Math.min(Math.round((currentSteps / GOAL_STEPS) * 100), 100);
    setElText("currentSteps", currentSteps.toLocaleString());
    setElText("stepsPercentage", stepsPercentage + "%");
    updateProgressBar("stepsProgressBar", stepsPercentage);

    // Update Exercise
    const exercisePercentage = Math.min(Math.round((currentExerciseDays / GOAL_EXERCISE_DAYS) * 100), 100);
    setElText("currentExerciseDays", currentExerciseDays);
    setElText("exercisePercentage", exercisePercentage + "%");
    updateProgressBar("exerciseProgressBar", exercisePercentage);

    // Update Water
    const waterPercentage = Math.min(Math.round((currentWater / GOAL_WATER) * 100), 100);
    setElText("currentWater", currentWater.toFixed(1));
    setElText("waterPercentage", waterPercentage + "%");
    updateProgressBar("waterGoalProgressBar", waterPercentage);

    // Provide Smart Insights
    provideSmartInsights(stepsPercentage, exercisePercentage, waterPercentage, currentSteps, currentExerciseDays, currentWater, GOAL_STEPS, GOAL_EXERCISE_DAYS, GOAL_WATER);
}

function updateProgressBar(elementId, percentage) {
    const bar = document.getElementById(elementId);
    if (bar) {
        bar.style.width = percentage + "%";

        // Color code based on progress
        if (percentage >= 80) {
            bar.style.background = "#18b046";
        } else if (percentage >= 50) {
            bar.style.background = "#ffc107";
        } else {
            bar.style.background = "#ff6b6b";
        }
    }
}

function provideSmartInsights(stepsPercentage, exercisePercentage, waterPercentage, currentSteps, currentExerciseDays, currentWater, goalSteps, goalExerciseDays, goalWater) {
    const issues = [];

    // Steps insights
    const stepsInsightEl = document.getElementById("stepsInsight");
    if (stepsPercentage < 50) {
        stepsInsightEl.innerHTML = `⚠️ You need ${(goalSteps - currentSteps).toLocaleString()} more steps to reach your goal. Try a 15-minute walk!`;
        stepsInsightEl.style.borderColor = "#ff6b6b";
        issues.push("Daily steps goal is off-track");
    } else if (stepsPercentage < 80) {
        stepsInsightEl.innerHTML = `💪 You're ${stepsPercentage}% there! ${(goalSteps - currentSteps).toLocaleString()} steps to go.`;
        stepsInsightEl.style.borderColor = "#ffc107";
    } else {
        stepsInsightEl.innerHTML = `🎉 Goal achieved! You've exceeded your daily target!`;
        stepsInsightEl.style.borderColor = "#18b046";
    }

    // Exercise insights
    const exerciseInsightEl = document.getElementById("exerciseInsight");
    const exerciseDaysNeeded = goalExerciseDays - currentExerciseDays;

    if (exercisePercentage < 50) {
        exerciseInsightEl.innerHTML = `⚠️ You need to exercise ${exerciseDaysNeeded} more days this week. Stay consistent!`;
        exerciseInsightEl.style.borderColor = "#ff6b6b";
        issues.push("Weekly exercise goal needs attention");
    } else if (exercisePercentage < 80) {
        exerciseInsightEl.innerHTML = `💪 Great progress! ${exerciseDaysNeeded} more workout days to reach your goal.`;
        exerciseInsightEl.style.borderColor = "#ffc107";
    } else {
        exerciseInsightEl.innerHTML = `🎉 Weekly goal achieved! Keep up the excellent work!`;
        exerciseInsightEl.style.borderColor = "#18b046";
    }

    // Water insights
    const waterInsightEl = document.getElementById("waterInsight");
    if (waterPercentage < 50) {
        waterInsightEl.innerHTML = `⚠️ You need ${(goalWater - currentWater).toFixed(1)}L more water today. Stay hydrated!`;
        waterInsightEl.style.borderColor = "#ff6b6b";
        issues.push("Water intake is below target");
    } else if (waterPercentage < 80) {
        waterInsightEl.innerHTML = `💧 Almost there! ${(goalWater - currentWater).toFixed(1)}L more to reach your goal.`;
        waterInsightEl.style.borderColor = "#007aff";
    } else {
        waterInsightEl.innerHTML = `🎉 Hydration goal achieved! Excellent!`;
        waterInsightEl.style.borderColor = "#18b046";
    }

    // Overall insight
    const mainInsightEl = document.getElementById("mainInsight");
    const mainInsightTextEl = document.getElementById("mainInsightText");

    if (issues.length > 0) {
        mainInsightEl.style.background = "rgba(255, 193, 7, 0.1)";
        mainInsightEl.style.borderColor = "#ffc107";
        mainInsightTextEl.innerHTML = `
            <strong>Areas needing attention:</strong><br/>
            ${issues.map(i => `• ${i}`).join('<br/>')}
            <br/><br/>
            <strong>Recommendation:</strong> Focus on completing at least one goal today to stay on track with your fitness journey.
        `;
    } else {
        mainInsightEl.style.background = "rgba(24, 176, 70, 0.1)";
        mainInsightEl.style.borderColor = "#18b046";
        mainInsightTextEl.innerHTML = `You're making excellent progress across all your health goals. Continue with your current routine to maintain this momentum.`;
    }
}

function setElText(id, txt) {
    const el = document.getElementById(id);
    if (el) el.innerText = txt;
}

async function fetchTrainerInfo() {
    const email = localStorage.getItem("userEmail");
    try {
        const profileRes = await fetch(`${API_BASE_URL}/profile?email=${email}`);
        if (profileRes.ok) {
            const profile = await profileRes.json();
            if (profile.trainerId) {
                const trainerRes = await fetch(`${API_BASE_URL}/trainers/${profile.trainerId}`);
                if (trainerRes.ok) {
                    const trainer = await trainerRes.json();
                    document.getElementById("trainerName").innerText = trainer.name;
                    document.getElementById("trainerSpec").innerText = trainer.specialization || "Expert Coach";
                    if (trainer.imageUrl) {
                        document.getElementById("trainerImg").src = trainer.imageUrl;
                    }
                    trainerUserId = trainer.userId;

                    const noTrainerMsg = document.getElementById("noTrainerMsg");
                    if (noTrainerMsg) noTrainerMsg.style.display = 'none';
                }
            } else {
                const noTrainerMsg = document.getElementById("noTrainerMsg");
                if (noTrainerMsg) noTrainerMsg.style.display = 'block';
                document.getElementById("trainerName").innerText = "No Trainer";
            }
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
                    planExercises.innerHTML = exercises.map(ex =>
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
                    mealList.innerHTML = meals.map(meal =>
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
    if (!trainerUserId) {
        alert("You need to have a trainer assigned before you can chat. Please visit the Trainers page to select a trainer.");
        return;
    }

    const modal = document.getElementById('chatModal');
    if (!modal) return;

    const isOpening = modal.style.display === 'none' || modal.style.display === '';
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
                            padding: 10px 14px; border-radius: 10px; font-size: 13px; max-width: 75%; margin-bottom: 5px;">
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

// Make functions globally accessible
window.toggleChat = toggleChat;
window.sendChatMessage = sendChatMessage;
