// dashboard.js

document.addEventListener("DOMContentLoaded", () => {
  initDashboard();

  // Attach chat button listener
  const chatBtn = document.getElementById('chatBtn');
  if (chatBtn) {
    chatBtn.addEventListener('click', toggleChat);
  }
});

let trainerUserId = null; // Store trainer's User ID for messaging
let chatInterval = null;

function initDashboard() {
  console.log("Initializing Dashboard...");

  // 1. Auth Check
  const userId = localStorage.getItem("userId");
  const role = localStorage.getItem("role") || "USER";

  if (document.getElementById("roleBadge")) {
    document.getElementById("roleBadge").innerText = role;
  }

  // 2. Fetch Data
  if (userId) {
    fetchRealDashboardData(userId);
    fetchUserPlans(userId);
    fetchUserMealPlans(userId);
    fetchTrainerInfoFromProfile(); // Check profile for trainer linkage
  } else {
    // Fallback for demo
    fallbackToSimulation(12345);
  }

  // 3. Logout
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      // Stop polling
      if (chatInterval) clearInterval(chatInterval);
      localStorage.clear();
      window.location.href = "index.html";
    });
  }
}

async function fetchTrainerInfoFromProfile() {
  const email = localStorage.getItem('userEmail');
  if (!email) return;

  try {
    const response = await fetch(`http://localhost:8080/api/profile?email=${email}`);
    if (response.ok) {
      const user = await response.json();
      if (user.trainerId) {
        localStorage.setItem('trainerId', user.trainerId);
        fetchTrainerDetails(user.trainerId);
      } else {
        showNoTrainerState();
      }
    }
  } catch (e) {
    console.error("Error fetching profile:", e);
    showNoTrainerState();
  }
}

async function fetchTrainerDetails(trainerId) {
  try {
    const response = await fetch(`http://localhost:8080/api/trainers/${trainerId}`);
    if (response.ok) {
      const trainer = await response.json();

      // Populate Trainer Card
      const nameEl = document.getElementById("trainerName");
      const specEl = document.getElementById("trainerSpec");
      const imgEl = document.getElementById("trainerImg");

      if (nameEl) nameEl.innerText = trainer.name;
      if (specEl) specEl.innerText = trainer.specialization || "Expert Coach";
      if (imgEl && trainer.imageUrl) {
        imgEl.src = trainer.imageUrl;
      }

      // Show chat button
      const chatBtn = document.getElementById("chatBtn");
      const noTrainerMsg = document.getElementById("noTrainerMsg");
      if (chatBtn) chatBtn.style.display = "inline-block";
      if (noTrainerMsg) noTrainerMsg.style.display = "none";

      // Store ID for chat
      trainerUserId = trainer.userId;
    }
  } catch (e) {
    console.error("Error fetching trainer details:", e);
    showNoTrainerState();
  }
}

function showNoTrainerState() {
  const nameEl = document.getElementById("trainerName");
  const specEl = document.getElementById("trainerSpec");
  const chatBtn = document.getElementById("chatBtn");
  const noTrainerMsg = document.getElementById("noTrainerMsg");

  if (nameEl) nameEl.innerText = "No Trainer";
  if (specEl) specEl.innerText = "";
  if (chatBtn) chatBtn.style.display = "none";
  if (noTrainerMsg) noTrainerMsg.style.display = "block";
}

async function fetchUserPlans(userId) {
  try {
    const response = await fetch(`http://localhost:8080/api/trainers/user-plans/${userId}`);
    if (response.ok) {
      const plans = await response.json();
      const planTitle = document.getElementById("planTitle");
      const planDesc = document.getElementById("planDesc");
      const planExercises = document.getElementById("planExercises");

      if (plans.length > 0) {
        // Show latest plan
        const latest = plans[plans.length - 1];
        if (planTitle) planTitle.innerText = latest.title;
        if (planDesc) planDesc.innerText = latest.description || "Your personalized workout plan.";

        // Parse exercises (assuming newline or comma separated)
        const exercises = latest.exercises ? latest.exercises.split('\n') : [];
        const listHtml = exercises.slice(0, 4).map(ex => `<li>${ex}</li>`).join(''); // Limit to 4 items
        if (planExercises) planExercises.innerHTML = listHtml;
      } else {
        if (planExercises) planExercises.innerHTML = "<li>No active plans. Ask your trainer!</li>";
      }
    }
  } catch (e) {
    console.error("Error fetching plans:", e);
  }
}

async function fetchUserMealPlans(userId) {
  try {
    const response = await fetch(`http://localhost:8080/api/trainers/user-meal-plans/${userId}`);
    if (response.ok) {
      const plans = await response.json();
      const mealTitle = document.getElementById("mealTitle");
      const mealDesc = document.getElementById("mealDesc");
      const mealList = document.getElementById("mealList");

      if (plans.length > 0) {
        const latest = plans[plans.length - 1];
        if (mealTitle) mealTitle.innerText = latest.title;
        if (mealDesc) mealDesc.innerText = latest.description || "Daily nutritional targets.";

        const meals = latest.meals ? latest.meals.split('\n') : [];
        const listHtml = meals.slice(0, 4).map(m => `<li>${m}</li>`).join('');
        if (mealList) mealList.innerHTML = listHtml;
      } else {
        if (mealList) mealList.innerHTML = "<li>No specific diet plan assigned yet. </li>";
      }
    }
  } catch (e) {
    console.error("Error fetching meal plans:", e);
  }
}

// --- Dashboard Data & Charts ---

async function fetchRealDashboardData(userId) {
  try {
    // Fetch Analytics
    const response = await fetch(`http://localhost:8080/api/tracker/analytics/${userId}/dashboard`);
    if (response.ok) {
      const data = await response.json();

      // Generate some consumed calories based on burned + constant, if not provided
      const consumedData = data.calorieData.map(v => Math.floor(v * 1.5 + 1200));

      // Construct Stats Object
      const stats = {
        labels: data.labels, // ["Mon", "Tue"...]
        workoutData: data.workoutData, // [30, 45, ...]
        burnedData: data.calorieData, // [300, 400, ...]
        consumedData: consumedData,

        // Mock Water (current day)
        waterCurrent: 2.1,
        waterTarget: 3.7,

        // Mock Sleep (last 3 days)
        sleepHistory: [
          { day: 'FRI', hours: 7, quality: 'excellent' },
          { day: 'THU', hours: 9, quality: 'excellent' },
          { day: 'WED', hours: 6, quality: 'good' }
        ]
      };

      updateDashboardVisuals(stats);
    } else {
      fallbackToSimulation(userId);
    }
  } catch (e) {
    console.error("Fetch data error:", e);
    fallbackToSimulation(userId);
  }
}

function fallbackToSimulation(userId) {
  const seed = userId ? parseInt(userId) : 12345;
  const days = ['SAT', 'SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI'];

  updateDashboardVisuals({
    labels: days,
    workoutData: [45, 60, 30, 0, 50, 75, 40],
    burnedData: [300, 450, 200, 0, 350, 500, 280],
    consumedData: [2100, 2400, 1800, 2200, 1900, 2500, 2000],
    waterCurrent: 1.5,
    waterTarget: 3.7,
    sleepHistory: [
      { day: 'FRI', hours: 7, quality: 'excellent' },
      { day: 'THU', hours: 8, quality: 'good' },
      { day: 'WED', hours: 6, quality: 'fair' }
    ]
  });
}

function updateDashboardVisuals(stats) {
  initCharts(stats);

  // Water
  const waterPct = Math.min((stats.waterCurrent / stats.waterTarget) * 100, 100);
  const waterBar = document.getElementById("waterBar");
  const waterDisplay = document.getElementById("waterDisplay");

  if (waterBar) {
    waterBar.style.width = `${waterPct}%`;
  }
  if (waterDisplay) {
    waterDisplay.innerText = `${stats.waterCurrent}L / ${stats.waterTarget}L`;
  }

  // Sleep
  const sleepList = document.getElementById("sleepList");
  if (sleepList && stats.sleepHistory) {
    sleepList.innerHTML = stats.sleepHistory.map(s => `
            <div class="sleep-item">
                <span class="sleep-day">${s.day}</span>
                <span class="sleep-hours">${s.hours} hours</span>
                <span class="sleep-quality quality-${s.quality}">${s.quality}</span>
            </div>
        `).join('');
  }
}

function initCharts(stats) {
  // 1. Workout Duration (Stacked Bar Mockup)
  const ctxWorkout = document.getElementById('workoutChart');
  if (ctxWorkout) {
    // Fix: Use a new canvas if chart exists or just overwrite logic assuming standard Chartjs behavior.
    // For best practice, we'd destroy old chart. But assuming single init for now.

    // Mock distribution
    const d1 = stats.workoutData.map(v => Math.floor(v * 0.4));
    const d2 = stats.workoutData.map(v => Math.floor(v * 0.3));
    const d3 = stats.workoutData.map(v => Math.max(0, v - Math.floor(v * 0.7)));

    new Chart(ctxWorkout, {
      type: 'bar',
      data: {
        labels: stats.labels,
        datasets: [
          { label: 'Running', data: d1, backgroundColor: '#4caf50' }, // Green
          { label: 'Yoga', data: d2, backgroundColor: '#ffc107' },    // Yellow
          { label: 'Strength', data: d3, backgroundColor: '#2196f3' } // Blue
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { stacked: true, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#aaa' } },
          y: { stacked: true, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#aaa' } }
        },
        plugins: {
          legend: { labels: { color: '#fff' } }
        }
      }
    });
  }

  // 2. Calories (Grouped Bar)
  const ctxCalories = document.getElementById('caloriesChart');
  if (ctxCalories) {
    new Chart(ctxCalories, {
      type: 'bar',
      data: {
        labels: stats.labels,
        datasets: [
          {
            label: 'Burned',
            data: stats.burnedData,
            backgroundColor: '#bf5af2', // Purple
            borderRadius: 4
          },
          {
            label: 'Consumed',
            data: stats.consumedData,
            backgroundColor: '#ff9f0a', // Orange
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { display: false }, ticks: { color: '#aaa' } },
          y: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#aaa' } }
        },
        plugins: {
          legend: { display: false } // Custom legend in HTML
        }
      }
    });
  }
}

// --- Chat Functions ---

function toggleChat() {
  const modal = document.getElementById('chatModal');
  if (!modal) return;
  const isOpening = modal.style.display === 'none';
  modal.style.display = isOpening ? 'flex' : 'none';

  if (isOpening) {
    fetchMessages();
    if (chatInterval) clearInterval(chatInterval);
    chatInterval = setInterval(fetchMessages, 3000);
  } else {
    clearInterval(chatInterval);
  }
}

async function fetchMessages() {
  if (!trainerUserId) return;
  const myId = localStorage.getItem('userId');
  if (!myId) return;

  try {
    const response = await fetch(`http://localhost:8080/api/messages/conversation?u1=${myId}&u2=${trainerUserId}`);
    if (response.ok) {
      const msgs = await response.json();
      const box = document.getElementById('chatMessages');
      if (box) {
        box.innerHTML = msgs.map(m => `
                    <div style="align-self: ${m.senderId == myId ? 'flex-end' : 'flex-start'}; 
                                background: ${m.senderId == myId ? 'rgba(24, 176, 70, 0.3)' : '#222'}; 
                                padding: 8px 12px; border-radius: 8px; font-size: 13px; max-width: 80%;">
                        ${m.content}
                    </div>
                `).join('');
        box.scrollTop = box.scrollHeight;
      }
    }
  } catch (e) {
    console.error(e);
  }
}

async function sendChatMessage() {
  const input = document.getElementById('chatInput');
  const myId = localStorage.getItem('userId');
  if (!input) return;
  const val = input.value.trim();

  if (!val || !myId || !trainerUserId) return;

  const msgData = {
    senderId: myId,
    receiverId: trainerUserId,
    content: val
  };

  try {
    await fetch('http://localhost:8080/api/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msgData)
    });
    input.value = '';
    fetchMessages();
  } catch (e) {
    console.error(e);
  }
}
