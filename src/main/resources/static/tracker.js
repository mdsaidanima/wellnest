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
  listEl.innerHTML = "Loading...";

  try {
    const res = await fetch(
      `${API_BASE_URL}/workouts/${auth.userId}/today`
    );
    if (!res.ok) {
      listEl.innerHTML = "Could not load workouts for today.";
      return;
    }
    const items = await res.json();

    if (!items || items.length === 0) {
      listEl.className = "list-empty";
      listEl.textContent = "No workouts logged today";
      return;
    }

    listEl.className = "";
    listEl.innerHTML = "";
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
  listEl.innerHTML = "Loading...";

  try {
    const res = await fetch(`${API_BASE_URL}/meals/${auth.userId}/today`);
    if (!res.ok) {
      listEl.innerHTML = "Could not load meals for today.";
      return;
    }
    const items = await res.json();

    if (!items || items.length === 0) {
      listEl.className = "list-empty";
      listEl.textContent = "No meals logged today";
      return;
    }

    listEl.className = "";
    listEl.innerHTML = "";
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

// Auto-detect sleep quality based on hours
function detectSleepQuality(hours) {
  if (!hours || hours <= 0) return "";

  if (hours >= 8) return "Excellent";
  if (hours >= 7) return "Good";
  if (hours >= 6) return "Average";
  return "Poor";
}

// Show water intake feedback
function showWaterFeedback(liters) {
  const feedbackEl = document.getElementById("waterFeedback");

  if (!liters || liters <= 0) {
    feedbackEl.style.display = "none";
    return;
  }

  feedbackEl.style.display = "block";

  const recommended = 2.5; // liters per day

  if (liters >= recommended) {
    feedbackEl.innerHTML = `✅ <span style="color: #18b046; font-weight: bold;">Sufficient hydration!</span> You're meeting the daily recommendation.`;
  } else if (liters >= recommended * 0.7) {
    feedbackEl.innerHTML = `⚠️ <span style="color: #ff9800; font-weight: bold;">Moderate hydration</span> - Try to reach ${recommended}L for optimal health.`;
  } else {
    feedbackEl.innerHTML = `❌ <span style="color: #ff5252; font-weight: bold;">Insufficient water intake</span> - Aim for at least ${recommended}L daily.`;
  }
}

async function logWaterSleep() {
  const auth = getAuthInfo();
  if (!auth) return;

  const waterStr = document.getElementById("waterIntakeLiters").value;
  const sleepStr = document.getElementById("sleepHours").value;
  const qualitySelect = document.getElementById("sleepQuality");

  if (!waterStr && !sleepStr) {
    alert("Enter at least water intake or sleep hours.");
    return;
  }

  // Auto-detect sleep quality
  const sleepHours = sleepStr ? parseFloat(sleepStr) : null;
  const autoQuality = sleepHours ? detectSleepQuality(sleepHours) : null;

  const payload = {
    userId: auth.userId,
    waterIntakeLiters: waterStr ? parseFloat(waterStr) : null,
    sleepHours: sleepHours,
    sleepQuality: autoQuality, // Use auto-detected quality
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

    // Show success message with detected quality
    if (autoQuality) {
      alert(`Logged successfully!\n\nSleep Quality Detected: ${autoQuality}\n${getSleepQualityMessage(autoQuality)}`);
    }
  } catch (err) {
    console.error("Water/sleep fetch error:", err);
    alert("Error while logging water/sleep. Check console.");
  }
}

// Get helpful message based on sleep quality
function getSleepQualityMessage(quality) {
  const messages = {
    "Excellent": "Great job! You're getting optimal rest. 🌟",
    "Good": "You're doing well! Keep maintaining this sleep schedule. 👍",
    "Average": "Consider adding 30-60 more minutes of sleep for better recovery. 😴",
    "Poor": "Try to get more sleep! Aim for 7-8 hours for optimal health. ⚠️"
  };
  return messages[quality] || "";
}

async function loadWaterSleep() {
  const auth = getAuthInfo();
  if (!auth) return;

  const listEl = document.getElementById("waterSleepList");
  listEl.innerHTML = "Loading...";

  try {
    const res = await fetch(
      `${API_BASE_URL}/water-sleep/${auth.userId}/today`
    );
    if (!res.ok) {
      listEl.innerHTML = "Could not load water/sleep logs.";
      return;
    }
    const items = await res.json();

    if (!items || items.length === 0) {
      listEl.className = "list-empty";
      listEl.textContent = "No water & sleep logs for today";
      return;
    }

    listEl.className = "";
    listEl.innerHTML = "";
    items.forEach((ws) => {
      const div = document.createElement("div");
      div.className = "log-item";

      // Determine water status
      const waterLiters = ws.waterIntakeLiters || 0;
      let waterStatus = "";
      let waterColor = "#666";

      if (waterLiters >= 2.5) {
        waterStatus = "✅ Sufficient";
        waterColor = "#18b046";
      } else if (waterLiters >= 1.75) {
        waterStatus = "⚠️ Moderate";
        waterColor = "#ff9800";
      } else if (waterLiters > 0) {
        waterStatus = "❌ Insufficient";
        waterColor = "#ff5252";
      }

      // Sleep quality emoji
      const qualityEmoji = {
        "Excellent": "🌟",
        "Good": "👍",
        "Average": "😴",
        "Poor": "⚠️"
      };
      const emoji = qualityEmoji[ws.sleepQuality] || "";

      div.innerHTML = `
        <div class="log-main">
          <div class="log-title">
            💧 ${waterLiters} L water <span style="color: ${waterColor}; font-size: 11px; margin-left: 8px;">${waterStatus}</span>
          </div>
          <div class="log-meta">
            ${ws.sleepHours ? ws.sleepHours + " hrs sleep" : "Sleep not set"}
            ${ws.sleepQuality ? ` • ${emoji} ${ws.sleepQuality}` : ""}
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
  const workoutBtn = document.getElementById("logWorkoutBtn");
  const mealBtn = document.getElementById("logMealBtn");
  const waterSleepBtn = document.getElementById("logWaterSleepBtn");

  if (workoutBtn) workoutBtn.addEventListener("click", logWorkout);
  if (mealBtn) mealBtn.addEventListener("click", logMeal);
  if (waterSleepBtn) waterSleepBtn.addEventListener("click", logWaterSleep);

  // Real-time auto-detection for sleep quality
  const sleepHoursInput = document.getElementById("sleepHours");
  const sleepQualitySelect = document.getElementById("sleepQuality");

  if (sleepHoursInput && sleepQualitySelect) {
    sleepHoursInput.addEventListener("input", (e) => {
      const hours = parseFloat(e.target.value);
      const quality = detectSleepQuality(hours);

      if (quality) {
        sleepQualitySelect.value = quality;
        sleepQualitySelect.style.color = "#18b046";
        sleepQualitySelect.style.fontWeight = "bold";
      } else {
        sleepQualitySelect.value = "";
        sleepQualitySelect.style.color = "";
        sleepQualitySelect.style.fontWeight = "";
      }
    });
  }

  // Real-time feedback for water intake
  const waterInput = document.getElementById("waterIntakeLiters");

  if (waterInput) {
    waterInput.addEventListener("input", (e) => {
      const liters = parseFloat(e.target.value);
      showWaterFeedback(liters);
    });
  }

  // Load today's logs
  loadWorkouts();
  loadMeals();
  loadWaterSleep();
});
