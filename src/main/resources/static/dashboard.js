// dashboard.js

document.addEventListener("DOMContentLoaded", () => {
  initDashboard();

  // Attach chat button listener
  const chatBtn = document.getElementById('chatBtn');
  if (chatBtn) {
    chatBtn.addEventListener('click', toggleChat);
  }

  // Hamburger Menu Logic
  const hamburger = document.getElementById('hamburgerMenu');
  const navLinks = document.getElementById('navLinks');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navLinks.classList.toggle('active');
    });
  }

  // Hide Home and About Us if logged in
  const userEmail = localStorage.getItem('userEmail');
  if (userEmail) {
    const homeLink = document.getElementById('navHome');
    const aboutLink = document.getElementById('navAbout');
    const dashboardLink = document.getElementById('navDashboard');
    if (homeLink) homeLink.style.display = 'none';
    if (aboutLink) aboutLink.style.display = 'none';
    if (dashboardLink) dashboardLink.style.display = 'inline-block';
  }
});

let trainerUserId = null; // Store trainer's User ID for messaging
let chatInterval = null;

function initDashboard() {
  console.log("Initializing Dashboard...");

  // 1. Auth Check - Redirect if not logged in
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

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
    fetchUserPlans(userId);
    fetchUserMealPlans(userId);
  } else {
    // Fallback for demo/logged out
    const seed = 12345;
    const derivedStats = generateDerivedStats(seed);
    updateDashboardVisuals(derivedStats);
  }

  // 3b. Fetch Latest Profile & Trainer Info
  const email = localStorage.getItem('userEmail');
  if (email) {
    fetchLatestProfile(email);
  }

  // 4. Logout
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.clear();
      window.location.href = "index.html";
    });
  }
}

// Fetch real data from backend
async function fetchLatestProfile(email) {
  try {
    const response = await fetch(`http://localhost:8080/api/profile?email=${email}`);
    if (response.ok) {
      const user = await response.json();
      if (user.trainerId) {
        // If user has a trainer, fetch trainer info which will unhide the card
        fetchTrainerInfo(user.trainerId);
      } else {
        // No trainer assigned - Show card with "Find a Coach" option
        const card = document.getElementById("trainerCard");
        if (card) {
          card.style.display = "block"; // Make it visible

          // Update Text
          const nameEl = document.getElementById("trainerNameDisplay");
          if (nameEl) nameEl.textContent = "No Trainer Assigned";

          const specEl = document.getElementById("trainerSpecDisplay");
          if (specEl) specEl.textContent = "";

          // Hide image or show default
          const img = document.getElementById("trainerImg");
          if (img) img.style.display = "none";

          // Update Button - Clone to remove existing 'toggleChat' listener
          const chatBtn = document.getElementById("chatBtn");
          if (chatBtn) {
            const newBtn = chatBtn.cloneNode(true);
            newBtn.textContent = "FIND A COACH";
            newBtn.onclick = function (e) {
              e.preventDefault();
              window.location.href = "trainers.html";
            };
            if (chatBtn.parentNode) chatBtn.parentNode.replaceChild(newBtn, chatBtn);
          }
        }
      }
    }
  } catch (e) {
    console.error("Error fetching latest profile:", e);
  }
}

async function fetchRealDashboardData(userId) {
  try {
    const response = await fetch(`http://localhost:8080/api/tracker/analytics/${userId}/dashboard`);
    if (response.ok) {
      const data = await response.json();
      const stats = {
        calories: data.todayCalories,
        chartLabels: data.labels,
        chartData: {
          workout: data.workoutData,
          calories: data.calorieData
        },
        progress: {
          steps: data.todayCalories * 2,
          exerciseDays: data.workoutData.filter(d => d > 0).length
        }
      };
      updateDashboardVisuals(stats);
    } else {
      fallbackToSimulation(userId);
    }
  } catch (e) {
    console.error("Error fetching dashboard data:", e);
    fallbackToSimulation(userId);
  }
}

async function fetchTrainerInfo(trainerId) {
  try {
    const response = await fetch(`http://localhost:8080/api/trainers/${trainerId}`);
    if (response.ok) {
      const trainer = await response.json();
      const card = document.getElementById("trainerCard");
      if (card) {
        card.style.display = "block";
        updateText("trainerNameDisplay", trainer.name);
        updateText("trainerSpecDisplay", trainer.specialization);
        const img = document.getElementById("trainerImg");
        if (img && trainer.imageUrl) img.src = trainer.imageUrl;

        // Store trainer's User ID for chat
        trainerUserId = trainer.userId;
        console.log("DEBUG: Trainer User ID stored for chat:", trainerUserId);
      }
    }
  } catch (e) {
    console.error("Error fetching trainer info:", e);
  }
}

async function fetchUserPlans(userId) {
  try {
    const response = await fetch(`http://localhost:8080/api/trainers/user-plans/${userId}`);
    if (response.ok) {
      const plans = await response.json();
      const card = document.getElementById("plansCard");
      const list = document.getElementById("plansList");

      if (plans.length > 0) {
        if (card) card.style.display = "block";
        if (list) {
          list.innerHTML = plans.map(p => `
            <div class="plan-entry">
              <div class="plan-title">${p.title}</div>
              <div class="plan-meta">Assigned on ${new Date(p.assignedAt).toLocaleDateString()}</div>
              <div class="plan-exercises">${p.exercises}</div>
            </div>
          `).join('');
        }
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
      const card = document.getElementById("mealPlansCard");
      const list = document.getElementById("mealPlansList");

      if (plans.length > 0) {
        if (card) card.style.display = "block";
        if (list) {
          list.innerHTML = plans.map(p => `
            <div class="plan-entry">
              <div class="plan-title">${p.title}</div>
              <div class="plan-meta">${p.description} • ${new Date(p.assignedAt).toLocaleDateString()}</div>
              <div class="plan-exercises">${p.meals}</div>
            </div>
          `).join('');
        }
      }
    }
  } catch (e) {
    console.error("Error fetching meal plans:", e);
  }
}

// --- Chat System Functions ---

function toggleChat() {
  const modal = document.getElementById('chatModal');
  if (!modal) return;

  const isOpening = modal.style.display !== 'flex';
  modal.style.display = isOpening ? 'flex' : 'none';

  if (isOpening) {
    fetchMessages();
    // Start polling
    if (chatInterval) clearInterval(chatInterval);
    chatInterval = setInterval(fetchMessages, 3000);
  } else {
    clearInterval(chatInterval);
  }
}

async function fetchMessages() {
  const myId = localStorage.getItem('userId');
  if (!myId || !trainerUserId) return;

  try {
    const response = await fetch(`http://localhost:8080/api/messages/conversation?u1=${myId}&u2=${trainerUserId}`);
    if (response.ok) {
      const msgs = await response.json();
      renderMessages(msgs);
    }
  } catch (e) {
    console.error("Error fetching messages:", e);
  }
}

function renderMessages(msgs) {
  const box = document.getElementById('chatMessages');
  if (!box) return;

  const myId = localStorage.getItem('userId');
  box.innerHTML = msgs.map(m => `
    <div class="chat-msg ${m.senderId == myId ? 'sent' : 'received'}">
      ${m.content}
    </div>
  `).join('');

  box.scrollTop = box.scrollHeight;
}

async function sendChatMessage() {
  const input = document.getElementById('chatInput');
  const myId = localStorage.getItem('userId');
  if (!input || !input.value.trim() || !myId || !trainerUserId) return;

  const msgData = {
    senderId: myId,
    receiverId: trainerUserId,
    content: input.value.trim()
  };

  try {
    const response = await fetch('http://localhost:8080/api/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msgData)
    });

    if (response.ok) {
      input.value = '';
      fetchMessages();
    }
  } catch (e) {
    console.error("Error sending message:", e);
  }
}

// Simulation fallback
function fallbackToSimulation(userId) {
  const seed = userId ? parseInt(userId) : 12345;
  const derivedStats = generateDerivedStats(seed);
  updateDashboardVisuals(derivedStats);
}

function updateDashboardVisuals(stats) {
  updateText("caloriesText", stats.calories.toLocaleString());
  initCharts(stats);
}

function updateText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function generateDerivedStats(seed) {
  const pseudoRandom = (offset) => {
    let s = seed + offset;
    s = Math.sin(s) * 10000;
    return s - Math.floor(s);
  };
  return {
    calories: Math.floor(1500 + pseudoRandom(1) * 1000),
    chartLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    chartData: {
      workout: [30, 45, 0, 60, 40, 20, 0].map(v => Math.floor(v * (0.8 + pseudoRandom(2) * 0.4))),
      calories: [2100, 2300, 1900, 2500, 2200, 2400, 2000].map(v => Math.floor(v * (0.9 + pseudoRandom(3) * 0.2)))
    }
  };
}

function initCharts(stats) {
  const ctxWorkout = document.getElementById('workoutChart');
  if (ctxWorkout) {
    new Chart(ctxWorkout, {
      type: 'bar',
      data: {
        labels: stats.chartLabels,
        datasets: [{
          label: 'Minutes',
          data: stats.chartData.workout,
          backgroundColor: 'rgba(24, 176, 70, 0.6)',
          borderColor: '#18b046',
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  const ctxCalories = document.getElementById('caloriesChart');
  if (ctxCalories) {
    new Chart(ctxCalories, {
      type: 'line',
      data: {
        labels: stats.chartLabels,
        datasets: [{
          label: 'Calories',
          data: stats.chartData.calories,
          borderColor: '#18b046',
          backgroundColor: 'rgba(24, 176, 70, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }
}
