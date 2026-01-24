// tracker.js – connects tracker UI to Spring Boot backend

const API_BASE_URL = "http://localhost:8080/api/tracker";

function getAuthInfo() {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  if (!token || !userId) {
    alert("Please login first.");
    window.location.href = "login.html";
    return null;
  }

  return { token, userId };
}

// -------- WORKOUTS --------

async function logWorkout() {
  const auth = getAuthInfo();
  if (!auth) return;

  const exerciseType = document.getElementById("exerciseType").value.trim();
  const durationStr = document.getElementById("durationMinutes").value;
  const caloriesStr = document.getElementById("caloriesBurned").value;

  if (!exerciseType || !durationStr) {
    alert("Please enter exercise type and duration.");
    return;
  }

  const payload = {
    userId: auth.userId,
    exerciseType,
    durationMinutes: parseInt(durationStr, 10),
    caloriesBurned: caloriesStr ? parseInt(caloriesStr, 10) : null,
    logDate: new Date().toISOString().slice(0, 10) // yyyy-MM-dd
  };

  try {
    const res = await fetch(`${API_BASE_URL}/workouts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
        // "Authorization": "Bearer " + auth.token  // add if you enforce JWT
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Workout log error:", text);
      alert("Failed to log workout.\n" + text);
      return;
    }

    await loadWorkouts();
    // clear inputs
    document.getElementById("durationMinutes").value = "";
    document.getElementById("caloriesBurned").value = "";
  } catch (err) {
    console.error("Workout fetch error:", err);
    alert("Error while logging workout. Check console.");
  }
}

async function loadWorkouts() {
  const auth = getAuthInfo();
  if (!auth) return;

  const listEl = document.getElementById("workoutList");
  listEl.innerHTML = "Loading history...";

  const endDate = new Date().toISOString().slice(0, 10);
  const start = new Date();
  start.setDate(start.getDate() - 6);
  const startDate = start.toISOString().slice(0, 10);

  try {
    const res = await fetch(
      `${API_BASE_URL}/workouts/${auth.userId}/range?start=${startDate}&end=${endDate}`
    );
    if (!res.ok) {
      listEl.innerHTML = "Could not load workout history.";
      return;
    }
    const items = await res.json();

    if (!items || items.length === 0) {
      listEl.className = "list-empty";
      listEl.textContent = "No workouts logged in the last 7 days";
      return;
    }

    listEl.className = "";
    listEl.innerHTML = "";
    // Sort by date desc
    items.sort((a, b) => new Date(b.logDate) - new Date(a.logDate));

    items.forEach((w) => {
      const div = document.createElement("div");
      div.className = "log-item";
      div.innerHTML = `
        <div class="log-main">
          <div class="log-title">${w.exerciseType || "Workout"}</div>
          <div class="log-meta">
            ${w.durationMinutes || 0} min
            ${w.caloriesBurned ? " • " + w.caloriesBurned + " kcal" : ""}
          </div>
        </div>
        <div class="log-secondary">
          ${w.logDate || ""}
        </div>
      `;
      listEl.appendChild(div);
    });
  } catch (err) {
    console.error("Load workouts error:", err);
    listEl.innerHTML = "Error loading workouts.";
  }
}

// -------- MEALS --------

async function logMeal() {
  const auth = getAuthInfo();
  if (!auth) return;

  const mealType = document.getElementById("mealType").value.trim();
  const mealTime = document.getElementById("mealTime").value;
  const description = document.getElementById("mealDescription").value.trim();
  const caloriesStr = document.getElementById("mealCalories").value;
  const proteinStr = document.getElementById("mealProtein").value;
  const carbsStr = document.getElementById("mealCarbs").value;

  if (!mealType || !description) {
    alert("Please enter meal type and description.");
    return;
  }

  const payload = {
    userId: auth.userId,
    mealType,
    description,
    calories: caloriesStr ? parseInt(caloriesStr, 10) : null,
    protein: proteinStr ? parseInt(proteinStr, 10) : null,
    carbs: carbsStr ? parseInt(carbsStr, 10) : null,
    logDate: new Date().toISOString().slice(0, 10),
    mealTime: mealTime || null
  };

  try {
    const res = await fetch(`${API_BASE_URL}/meals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Meal log error:", text);
      alert("Failed to log meal.\n" + text);
      return;
    }

    await loadMeals();

    document.getElementById("mealDescription").value = "";
    document.getElementById("mealCalories").value = "";
    document.getElementById("mealProtein").value = "";
    document.getElementById("mealCarbs").value = "";
  } catch (err) {
    console.error("Meal fetch error:", err);
    alert("Error while logging meal. Check console.");
  }
}

async function loadMeals() {
  const auth = getAuthInfo();
  if (!auth) return;

  const listEl = document.getElementById("mealList");
  listEl.innerHTML = "Loading history...";

  const endDate = new Date().toISOString().slice(0, 10);
  const start = new Date();
  start.setDate(start.getDate() - 6);
  const startDate = start.toISOString().slice(0, 10);

  try {
    const res = await fetch(`${API_BASE_URL}/meals/${auth.userId}/range?start=${startDate}&end=${endDate}`);
    if (!res.ok) {
      listEl.innerHTML = "Could not load meal history.";
      return;
    }
    const items = await res.json();

    if (!items || items.length === 0) {
      listEl.className = "list-empty";
      listEl.textContent = "No meals logged in the last 7 days";
      return;
    }

    listEl.className = "";
    listEl.innerHTML = "";
    // Sort by date desc
    items.sort((a, b) => new Date(b.logDate) - new Date(a.logDate));

    items.forEach((m) => {
      const div = document.createElement("div");
      div.className = "log-item";
      div.innerHTML = `
        <div class="log-main">
          <div class="log-title">${m.mealType || "Meal"}</div>
          <div class="log-meta">
            ${m.calories ? m.calories + " kcal" : "Calories not set"}
          </div>
          <div class="log-secondary">${m.description || ""}</div>
        </div>
        <div class="log-secondary">
          ${m.mealTime || ""}<br/>
          ${m.logDate || ""}
        </div>
      `;
      listEl.appendChild(div);
    });
  } catch (err) {
    console.error("Load meals error:", err);
    listEl.innerHTML = "Error loading meals.";
  }
}

// -------- WATER & SLEEP --------

async function logWaterSleep() {
  const auth = getAuthInfo();
  if (!auth) return;

  const waterStr = document.getElementById("waterIntakeLiters").value;
  const sleepStr = document.getElementById("sleepHours").value;
  const quality = document.getElementById("sleepQuality").value;

  if (!waterStr && !sleepStr) {
    alert("Enter at least water intake or sleep hours.");
    return;
  }

  const payload = {
    userId: auth.userId,
    waterIntakeLiters: waterStr ? parseFloat(waterStr) : null,
    sleepHours: sleepStr ? parseFloat(sleepStr) : null,
    sleepQuality: quality || null,
    logDate: new Date().toISOString().slice(0, 10)
  };

  try {
    const res = await fetch(`${API_BASE_URL}/water-sleep`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Water/sleep log error:", text);
      alert("Failed to log water/sleep.\n" + text);
      return;
    }

    await loadWaterSleep();
  } catch (err) {
    console.error("Water/sleep fetch error:", err);
    alert("Error while logging water/sleep. Check console.");
  }
}

async function loadWaterSleep() {
  const auth = getAuthInfo();
  if (!auth) return;

  const listEl = document.getElementById("waterSleepList");
  listEl.innerHTML = "Loading history...";

  const endDate = new Date().toISOString().slice(0, 10);
  const start = new Date();
  start.setDate(start.getDate() - 6);
  const startDate = start.toISOString().slice(0, 10);

  try {
    const res = await fetch(
      `${API_BASE_URL}/water-sleep/${auth.userId}/range?start=${startDate}&end=${endDate}`
    );
    if (!res.ok) {
      listEl.innerHTML = "Could not load water/sleep history.";
      return;
    }
    const items = await res.json();

    if (!items || items.length === 0) {
      listEl.className = "list-empty";
      listEl.textContent = "No water & sleep logs in the last 7 days";
      return;
    }

    listEl.className = "";
    listEl.innerHTML = "";
    // Sort by date desc
    items.sort((a, b) => new Date(b.logDate) - new Date(a.logDate));

    items.forEach((ws) => {
      const div = document.createElement("div");
      div.className = "log-item";
      div.innerHTML = `
        <div class="log-main">
          <div class="log-title">
            ${ws.waterIntakeLiters || 0} L water
          </div>
          <div class="log-meta">
            ${ws.sleepHours ? ws.sleepHours + " hrs sleep" : "Sleep not set"}
          </div>
          <div class="log-secondary">
            ${ws.sleepQuality || ""}
          </div>
        </div>
        <div class="log-secondary">
          ${ws.logDate || ""}
        </div>
      `;
      listEl.appendChild(div);
    });
  } catch (err) {
    console.error("Load water/sleep error:", err);
    listEl.innerHTML = "Error loading water & sleep logs.";
  }
}

// -------- INIT --------

document.addEventListener("DOMContentLoaded", () => {
  const userEmail = localStorage.getItem("userEmail");
  if (userEmail) {
    fetchUserProfile(userEmail);
  }

  /* logoutBtn handled below in Role Handling section */

  const workoutBtn = document.getElementById("logWorkoutBtn");
  const mealBtn = document.getElementById("logMealBtn");
  const waterSleepBtn = document.getElementById("logWaterSleepBtn");

  if (workoutBtn) workoutBtn.addEventListener("click", logWorkout);
  if (mealBtn) mealBtn.addEventListener("click", logMeal);
  if (waterSleepBtn) waterSleepBtn.addEventListener("click", logWaterSleep);

  // Auto-detect Sleep Quality
  const sleepHoursInput = document.getElementById("sleepHours");
  const sleepQualitySelect = document.getElementById("sleepQuality");
  if (sleepHoursInput && sleepQualitySelect) {
    sleepHoursInput.addEventListener("input", () => {
      const hours = parseFloat(sleepHoursInput.value);
      if (isNaN(hours)) {
        sleepQualitySelect.value = "";
        return;
      }
      let quality = "";
      let emoji = "";
      if (hours >= 8.5) {
        quality = "Excellent";
        emoji = "🌟";
      } else if (hours >= 7) {
        quality = "Good";
        emoji = "✅";
      } else if (hours >= 5.5) {
        quality = "Average";
        emoji = "😐";
      } else {
        quality = "Poor";
        emoji = "😴";
      }

      if (sleepQualitySelect.value !== quality) {
        sleepQualitySelect.value = quality;
        showToast(`Auto-detected Sleep Quality: ${quality} ${emoji}`);
      }
    });
  }

  // Load today's logs
  loadWorkouts();
  loadMeals();
  loadWaterSleep();

  // Role Handling
  const userRole = localStorage.getItem('userRole');
  if (userRole === 'TRAINER') {
    const dashboardLink = document.getElementById('navDashboard');
    if (dashboardLink) dashboardLink.href = 'trainer-dashboard.html';

    const messagesLink = document.getElementById('navMessages');
    if (messagesLink) messagesLink.style.display = 'inline-block';
  }

  if (userRole === 'ADMIN') {
    const adminLink = document.getElementById('adminLink');
    if (adminLink) adminLink.style.display = 'inline-block';
  }

  // Hamburger Logic
  const hamburger = document.getElementById('hamburgerMenu');
  const navLinks = document.getElementById('navLinks');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navLinks.classList.toggle('active');
    });
  }

  // Logout Logic
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      if (confirm("Are you sure you want to logout?")) {
        localStorage.clear();
        window.location.href = "login.html";
      }
    });
  }
});

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  // Clear any existing timeout to avoid premature hiding
  if (toast.timeoutId) clearTimeout(toast.timeoutId);

  toast.innerHTML = `
    <svg xmlns="http://www.w3.org/2001/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
    <span>${message}</span>
  `;

  toast.classList.add("show");

  toast.timeoutId = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

async function fetchUserProfile(email) {
  try {
    const response = await fetch(`/api/profile?email=${email}`);
    if (response.ok) {
      const user = await response.json();

      // Update Nav Profile section
      const navUserName = document.getElementById("navUserName");
      if (navUserName) {
        navUserName.innerText = user.fullName || user.name || email.split('@')[0];
      }
      const navUserRole = document.getElementById("navUserRole");
      if (navUserRole) {
        navUserRole.innerText = user.role || "USER";
        const navUserAvatar = document.getElementById("navUserAvatar");
        const navUserIcon = document.getElementById("navUserIcon");
        if (navUserAvatar && user.image_url) {
          navUserAvatar.src = user.image_url;
          navUserAvatar.style.display = "block";
          if (navUserIcon) navUserIcon.style.display = "none";
        } else if (navUserIcon) {
          navUserIcon.style.display = "block";
          if (navUserAvatar) navUserAvatar.style.display = "none";
        }
      }
    }
  } catch (e) {
    console.error("Error fetching profile:", e);
  }
}
