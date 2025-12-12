// dashboard.js

document.addEventListener("DOMContentLoaded", () => {
  initDashboard();
});

function initDashboard() {
  console.log("Initializing Dashboard...");

  // 1. Auth Check - Redirect if not logged in
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  /*
  if (!token) {
      window.location.href = "login.html";
      return;
  }
  */

  // 2. Load User Info
  const fullName = localStorage.getItem("fullName") || "WellNester";
  const goal = localStorage.getItem("goal") || "Stay Fit";
  const age = localStorage.getItem("age") || "25";
  const weight = localStorage.getItem("weight") || "70";
  const role = localStorage.getItem("role") || "USER";

  updateText("welcomeName", fullName);
  updateText("goalText", goal);
  updateText("ageText", age);
  updateText("weightText", weight + " kg");
  updateText("roleBadge", role);

  // 3. Fetch Real Analytics Data
  if (userId) {
    fetchRealDashboardData(userId);
  } else {
    // Fallback for demo/logged out
    const seed = 12345;
    const derivedStats = generateDerivedStats(seed);
    updateDashboardVisuals(derivedStats);
  }

  // 4. Logout
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.clear();
      window.location.href = "login.html";
    });
  }
}

// Fetch real data from backend
async function fetchRealDashboardData(userId) {
  try {
    const response = await fetch(`http://localhost:8080/api/tracker/analytics/${userId}/dashboard`);
    if (response.ok) {
      const data = await response.json();
      // Data format: { labels: [], workoutData: [], calorieData: [], todayCalories: 0 }

      // Map to existing visual structure
      const stats = {
        calories: data.todayCalories,
        chartLabels: data.labels, // New field for dynamic labels
        chartData: {
          workout: data.workoutData,
          calories: data.calorieData
        },
        progress: {
          steps: data.todayCalories * 2, // Approximate steps from calories if not tracked separately
          exerciseDays: data.workoutData.filter(d => d > 0).length // Count days with activity
        }
      };
      updateDashboardVisuals(stats);
    } else {
      console.warn("Failed to fetch dashboard data, using simulation.");
      fallbackToSimulation(userId);
    }
  } catch (e) {
    console.error("Error fetching dashboard data:", e);
    fallbackToSimulation(userId);
  }
}

function fallbackToSimulation(userId) {
  const seed = userId ? parseInt(userId) : 12345;
  const derivedStats = generateDerivedStats(seed);
  updateDashboardVisuals(derivedStats);
}

function updateDashboardVisuals(stats) {
  updateText("caloriesText", stats.calories.toLocaleString());
  initCharts(stats);
  updateProgressBars(stats);
}

// Helper to update text safely
function updateText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

// Keep simulation for fallback
function generateDerivedStats(seed) {
  const random = () => {
    let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  const dailyCalories = Math.floor(random() * 1000) + 1500;

  const workoutData = [];
  const calorieData = [];
  for (let i = 0; i < 7; i++) {
    workoutData.push(Math.floor(random() * 60) + 20);
    calorieData.push(Math.floor(random() * 300) + 200);
  }

  const steps = Math.floor(random() * 5000) + 4000;
  const exerciseDays = Math.floor(random() * 5);

  return {
    calories: dailyCalories,
    chartData: {
      workout: workoutData,
      calories: calorieData
    },
    progress: {
      steps: steps,
      exerciseDays: exerciseDays
    }
  };
}

function updateProgressBars(stats) {
  // New Goals Section
  const goalsSection = document.querySelector('.goals-section');
  if (goalsSection) {
    // Steps
    const items = goalsSection.querySelectorAll('.goal-item');
    if (items.length >= 2) {
      // Steps Goal
      const stepItem = items[0];
      const stepText = stepItem.querySelector('.goal-header span:last-child');
      const stepBar = stepItem.querySelector('.goal-fill');
      const stepStatus = stepItem.querySelector('.goal-status');

      if (stepText) stepText.textContent = `${stats.progress.steps.toLocaleString()} / 10,000`;
      if (stepBar) stepBar.style.width = `${(stats.progress.steps / 10000) * 100}%`;
      if (stepStatus) stepStatus.textContent = stats.progress.steps > 8000 ? "Amazing work!" : "Keep moving!";

      // Exercise Goal
      const exItem = items[1];
      const exText = exItem.querySelector('.goal-header span:last-child');
      const exBar = exItem.querySelector('.goal-fill');

      if (exText) exText.textContent = `${stats.progress.exerciseDays} / 5 days`;
      if (exBar) exBar.style.width = `${(stats.progress.exerciseDays / 5) * 100}%`;
    }
  }
}

function initCharts(stats) {
  // --- 1. Workout Duration Bar Chart (Last 7 Days) ---
  const ctxWorkout = document.getElementById('workoutChart');
  if (ctxWorkout) {
    new Chart(ctxWorkout, {
      type: 'bar',
      data: {
        labels: stats.chartLabels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Minutes',
          data: stats.chartData.workout,
          backgroundColor: 'rgba(24, 176, 70, 0.6)',
          borderColor: '#18b046',
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: 0.6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#aaa' }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#aaa' }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  // --- 2. Calories Burned Trend Line Chart ---
  const ctxCalories = document.getElementById('caloriesChart');
  if (ctxCalories) {
    new Chart(ctxCalories, {
      type: 'line',
      data: {
        labels: stats.chartLabels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Calories',
          data: stats.chartData.calories,
          borderColor: '#18b046',
          backgroundColor: 'rgba(24, 176, 70, 0.1)',
          borderWidth: 3,
          pointBackgroundColor: '#000',
          pointBorderColor: '#18b046',
          pointBorderWidth: 2,
          pointRadius: 5,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#aaa' }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#aaa' }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(0,0,0,0.8)',
            titleColor: '#18b046',
            bodyColor: '#fff',
            borderColor: '#333',
            borderWidth: 1
          }
        }
      }
    });
  }
}
