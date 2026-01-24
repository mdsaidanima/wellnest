// trainer-dashboard.js

let trainerData = null;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

document.addEventListener('DOMContentLoaded', () => {
    console.log("DEBUG: Trainer Dashboard Loaded");
    fetchClients();
    fetchPendingRequests();
    fetchTrainerProfileAndStats();
    renderCalendar();

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
                window.location.href = "index.html";
            }
        });
    }
});

let currentClientId = null;
let chatInterval = null;

async function fetchClients() {
    const trainerEmail = localStorage.getItem('userEmail');
    if (!trainerEmail) return;

    const clientsList = document.getElementById('clientsList');
    const activeClientsCount = document.getElementById('activeClientsCount');
    const sessionsTodayCount = document.getElementById('sessionsTodayCount');
    const quickScheduleList = document.getElementById('quickScheduleList');

    try {
        const response = await fetch(`/api/trainers/clients?trainerEmail=${trainerEmail}`);
        if (response.ok) {
            const clients = await response.json();

            // Update Active Clients Count
            if (activeClientsCount) activeClientsCount.textContent = clients.length;

            // Update Sessions Today Count (Mock active clients = mock sessions for today)
            if (sessionsTodayCount) {
                sessionsTodayCount.textContent = clients.length > 0 ? clients.length : 0;
            }

            // Populate Quick Schedule
            if (quickScheduleList) {
                if (clients.length === 0) {
                    quickScheduleList.innerHTML = '<p style="color: #666; font-size: 13px; text-align: center; padding: 10px;">No sessions today.</p>';
                } else {
                    // Create mock sessions for current clients
                    quickScheduleList.innerHTML = clients.map((client, index) => {
                        const times = ["09:00 AM", "11:30 AM", "02:00 PM", "04:30 PM"];
                        const time = times[index % times.length];
                        return `
                            <div class="schedule-item">
                                <div class="time-box">${time}</div>
                                <div class="event-info">
                                    <h4>Session with ${client.name.split(' ')[0]}</h4>
                                    <p>${client.goal || 'General Fitness'} • 45m</p>
                                </div>
                            </div>
                        `;
                    }).join('');
                }
            }

            if (clientsList) {
                if (clients.length === 0) {
                    clientsList.innerHTML = '<p style="color: #666; text-align: center; padding: 20px; font-size: 13px;">You don\'t have any clients yet.</p>';
                } else {
                    clientsList.innerHTML = clients.map(client => `
                        <div class="client-row">
                            <div class="client-avatar">${getInitials(client.name || "U")}</div>
                            <div class="client-info">
                                <span class="client-name">${client.name || "Unknown"}</span>
                                <span class="client-goal">${client.goal || 'General Fitness'}</span>
                            </div>
                            <div style="display: flex; gap: 8px;">
                                <button type="button" class="btn-small" onclick="openChatWithClient(${client.id}, '${client.name}')">CHAT</button>
                                <button type="button" class="btn-small" onclick="openPlanModal(${client.id}, '${client.name}')">WORKOUT</button>
                                <button type="button" class="btn-small" onclick="openMealModal(${client.id}, '${client.name}')">DIET</button>
                                <button type="button" class="btn-small" style="background: rgba(255, 77, 77, 0.1); border-color: #ff4d4d; color: #ff4d4d;" onclick="cancelClientEnrollment(${client.id}, '${client.name}')">CANCEL</button>
                            </div>
                        </div>
                    `).join('');
                }
            }
        }
    } catch (error) {
        console.error("Error fetching clients:", error);
    }
}

async function fetchPendingRequests() {
    const trainerEmail = localStorage.getItem('userEmail');
    if (!trainerEmail) return;

    const list = document.getElementById('pendingRequestsList');
    try {
        const response = await fetch(`/api/trainers/pending-requests?trainerEmail=${trainerEmail}`);
        if (response.ok) {
            const requests = await response.json();
            if (requests.length === 0) {
                list.innerHTML = '<p style="color: #666; font-size: 13px; text-align: center; padding: 20px;">No pending requests.</p>';
                return;
            }

            list.innerHTML = requests.map(req => `
                <div class="client-row">
                    <div class="client-avatar">${getInitials(req.name || "U")}</div>
                    <div class="client-info">
                        <span class="client-name">${req.name}</span>
                        <span class="client-goal">Wants to enroll • ${req.goal || 'General Fitness'}</span>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn-small" onclick="acceptRequest(${req.id})">ACCEPT</button>
                        <button class="btn-small" style="border-color: #ff4d4d; color: #ff4d4d;" onclick="rejectRequest(${req.id})">REJECT</button>
                    </div>
                </div>
            `).join('');
        }
    } catch (e) { console.error(e); }
}

async function acceptRequest(userId) {
    try {
        const response = await fetch('/api/trainers/accept-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });
        if (response.ok) {
            fetchPendingRequests();
            fetchClients();
            updateStatsBar();
        }
    } catch (e) { console.error(e); }
}

async function rejectRequest(userId) {
    if (!confirm("Are you sure you want to reject this request?")) return;
    try {
        const response = await fetch('/api/trainers/reject-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });
        if (response.ok) {
            fetchPendingRequests();
        }
    } catch (e) { console.error(e); }
}

async function cancelClientEnrollment(clientId, clientName) {
    if (!confirm(`Are you sure you want to cancel the enrollment for ${clientName}?`)) return;

    try {
        const response = await fetch('/api/trainers/remove-client', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId: clientId })
        });

        if (response.ok) {
            alert(`Enrollment for ${clientName} has been cancelled.`);
            fetchClients();
            updateStatsBar();
        }
    } catch (e) { console.error(e); }
}

async function updateStatsBar() {
    fetchTrainerProfileAndStats();
}

function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

function explainAddNew() {
    alert("New clients can find your profile on the 'Trainers' page and send you an enrollment request. Once they do, they will appear in your 'Pending Requests' section where you can accept them!");
    const pendingSection = document.getElementById('pendingRequestsList');
    if (pendingSection) {
        pendingSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        pendingSection.parentElement.style.borderColor = '#18b046';
        setTimeout(() => {
            pendingSection.parentElement.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        }, 2000);
    }
}

function logout() {
    if (confirm("Are you sure you want to logout?")) {
        localStorage.clear();
        window.location.href = "index.html";
    }
}

// --- Plan Management ---

function openPlanModal(clientId, clientName) {
    closeChat();
    closeMealModal();
    document.getElementById('targetClientId').value = clientId;
    document.getElementById('targetClientName').textContent = clientName;
    document.getElementById('planModal').style.display = 'flex';
}

function closePlanModal() { document.getElementById('planModal').style.display = 'none'; }

async function submitPlan() {
    const userId = document.getElementById('targetClientId').value;
    const title = document.getElementById('planTitle').value;
    const description = document.getElementById('planDesc').value;
    const exercises = document.getElementById('planExercises').value;
    const trainerId = localStorage.getItem('trainerProfileId');

    if (!title || !exercises) { alert("Please provide title and exercises."); return; }

    try {
        const response = await fetch('/api/trainers/assign-plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, trainerId, title, description, exercises })
        });
        if (response.ok) {
            alert("Plan assigned!");
            closePlanModal();
        }
    } catch (e) { console.error(e); }
}

// --- Meal Plan Management ---

function openMealModal(clientId, clientName) {
    closeChat();
    closePlanModal();
    document.getElementById('targetMealClientId').value = clientId;
    document.getElementById('targetMealClientName').textContent = clientName;
    document.getElementById('mealModal').style.display = 'flex';
}

function closeMealModal() { document.getElementById('mealModal').style.display = 'none'; }

async function submitMealPlan() {
    const userId = document.getElementById('targetMealClientId').value;
    const title = document.getElementById('mealTitle').value;
    const description = document.getElementById('mealDesc').value;
    const meals = document.getElementById('mealDetails').value;
    const trainerId = localStorage.getItem('trainerProfileId');

    if (!title || !meals) { alert("Please provide title and details."); return; }

    try {
        const response = await fetch('/api/trainers/assign-meal-plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, trainerId, title, description, meals })
        });
        if (response.ok) {
            alert("Diet plan assigned!");
            closeMealModal();
        }
    } catch (e) { console.error(e); }
}

// --- Trainer Profile & Stats ---

async function fetchTrainerProfileAndStats() {
    const email = localStorage.getItem('userEmail');
    if (!email) return;

    try {
        const response = await fetch(`/api/trainers`);
        if (response.ok) {
            const trainers = await response.json();
            const me = trainers.find(t => t.contactEmail === email);
            if (me) {
                console.log("DEBUG: Found trainer profile", me);
                trainerData = me;
                localStorage.setItem('trainerProfileId', me.id);
                localStorage.setItem('fullName', me.name);
                document.getElementById('trainerName').textContent = me.name.split(' ')[0];

                // Populate Profile Modal
                document.getElementById('profileModalName').textContent = me.name;
                document.getElementById('profileModalSpec').textContent = me.specialization;
                document.getElementById('profileModalBio').textContent = me.bio || "No bio available.";
                if (me.imageUrl) {
                    document.getElementById('profileModalImg').src = me.imageUrl;
                }

                // Update Navbar Chip
                const navUserName = document.getElementById("navUserName");
                if (navUserName) navUserName.innerText = me.name;
                const navUserAvatar = document.getElementById("navUserAvatar");
                const navUserIcon = document.getElementById("navUserIcon");
                if (me.imageUrl && navUserAvatar) {
                    navUserAvatar.src = me.imageUrl;
                    navUserAvatar.style.display = "block";
                    if (navUserIcon) navUserIcon.style.display = "none";
                }
            }
        }
    } catch (e) { console.error(e); }
}

function openTrainerProfile() {
    document.getElementById('trainerProfileModal').style.display = 'flex';
}

function closeTrainerProfile() {
    document.getElementById('trainerProfileModal').style.display = 'none';
}

function openEditProfile() {
    console.log("DEBUG: openEditProfile called", trainerData);
    if (!trainerData) {
        alert("Error: Trainer profile data is missing. Please refresh the page.");
        return;
    }

    // Fill form
    document.getElementById('editTrainerName').value = trainerData.name || '';
    document.getElementById('editTrainerSpec').value = trainerData.specialization || '';
    document.getElementById('editTrainerExp').value = trainerData.experienceYears || 0;
    document.getElementById('editTrainerAge').value = trainerData.age || 0;
    document.getElementById('editTrainerImg').value = trainerData.imageUrl || '';
    document.getElementById('editTrainerBio').value = trainerData.bio || '';

    // Toggle modals
    closeTrainerProfile();
    document.getElementById('trainerEditModal').style.display = 'flex';
}

function closeEditProfile() {
    document.getElementById('trainerEditModal').style.display = 'none';
}

async function submitTrainerUpdate() {
    if (!trainerData || !trainerData.id) return;

    const payload = {
        name: document.getElementById('editTrainerName').value.trim(),
        specialization: document.getElementById('editTrainerSpec').value.trim(),
        experienceYears: parseInt(document.getElementById('editTrainerExp').value) || 0,
        age: parseInt(document.getElementById('editTrainerAge').value) || 0,
        imageUrl: document.getElementById('editTrainerImg').value.trim(),
        bio: document.getElementById('editTrainerBio').value.trim()
    };

    if (!payload.name || !payload.specialization) {
        alert("Name and Specialization are required.");
        return;
    }

    try {
        const response = await fetch(`/api/trainers/${trainerData.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert("Profile updated successfully!");
            closeEditProfile();
            fetchTrainerProfileAndStats(); // Refresh view
        } else {
            const errorText = await response.text();
            alert("Failed to update profile: " + errorText);
        }
    } catch (e) {
        console.error("Error updating trainer profile:", e);
        alert("An error occurred. Check console.");
    }
}

// --- Dynamic Calendar Logic ---

function openCalendar() {
    document.getElementById('calendarModal').style.display = 'flex';
    renderCalendar();
}

function closeCalendar() {
    document.getElementById('calendarModal').style.display = 'none';
}

function renderCalendar() {
    const mainGrid = document.getElementById('calendarGrid');
    const mainLabel = document.getElementById('calendarMonthYear');
    const miniGrid = document.getElementById('miniCalendarGrid');
    const miniLabel = document.getElementById('miniCalendarMonth');

    if (!mainGrid || !mainLabel) return;

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const today = new Date();

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    mainLabel.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    if (miniLabel) miniLabel.textContent = `${monthNames[currentMonth]} ${currentYear}`;

    mainGrid.innerHTML = "";
    if (miniGrid) miniGrid.innerHTML = "";

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    dayNames.forEach(d => {
        const headerHtml = `<div class="calendar-day-name">${d}</div>`;
        mainGrid.innerHTML += headerHtml;
        if (miniGrid) miniGrid.innerHTML += headerHtml;
    });

    for (let i = 0; i < firstDay; i++) {
        const emptyHtml = `<div class="calendar-date other-month"></div>`;
        mainGrid.innerHTML += emptyHtml;
        if (miniGrid) miniGrid.innerHTML += emptyHtml;
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const isToday = today.getDate() === d && today.getMonth() === currentMonth && today.getFullYear() === currentYear;
        const hasEvent = d % 5 === 0;
        const dateHtml = `
            <div class="calendar-date ${isToday ? 'today' : ''} ${hasEvent ? 'has-event' : ''}" onclick="selectDate(${d})">
                ${d}
            </div>
        `;
        mainGrid.innerHTML += dateHtml;
        if (miniGrid) miniGrid.innerHTML += dateHtml;
    }
}

function prevMonth() {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar();
}

function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar();
}


function selectDate(day) {
    const eventsBox = document.getElementById('selectedDateEvents');
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    // Smoothly update the event list with mock data
    if (day % 5 === 0) {
        eventsBox.innerHTML = `
            <div class="event-item">
                <div class="event-time">10:30 AM</div>
                <div class="event-info">
                    <h5>Session with Client</h5>
                    <p>Training scheduled for ${monthNames[currentMonth]} ${day}</p>
                </div>
            </div>
        `;
    } else {
        eventsBox.innerHTML = `<p style="color: #444; font-size: 13px; text-align: center; padding: 20px;">No events for this date.</p>`;
    }
}

// --- Chat System ---

function openChatWithClient(clientId, clientName) {
    currentClientId = clientId;
    closePlanModal();
    closeMealModal();
    document.getElementById('chatTitle').textContent = `Chat with ${clientName}`;
    const modal = document.getElementById('chatModal');
    modal.style.display = 'flex';
    fetchMessages();
    if (chatInterval) clearInterval(chatInterval);
    chatInterval = setInterval(fetchMessages, 3000);
}

function closeChat() {
    document.getElementById('chatModal').style.display = 'none';
    clearInterval(chatInterval);
}

function toggleChat() { closeChat(); }

async function fetchMessages() {
    const myUserId = localStorage.getItem('userId');
    if (!myUserId || !currentClientId) return;
    try {
        const response = await fetch(`/api/messages/conversation?u1=${myUserId}&u2=${currentClientId}`);
        if (response.ok) {
            const msgs = await response.json();
            const box = document.getElementById('chatMessages');
            box.innerHTML = msgs.map(m => `
                <div class="chat-msg ${m.senderId == myUserId ? 'sent' : 'received'}">
                    ${m.content}
                </div>
            `).join('');
            box.scrollTop = box.scrollHeight;
        }
    } catch (e) { console.error(e); }
}

async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const myUserId = localStorage.getItem('userId');
    if (!input || !input.value.trim() || !myUserId || !currentClientId) return;

    const msgData = { senderId: myUserId, receiverId: currentClientId, content: input.value.trim() };
    try {
        const response = await fetch('/api/messages/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(msgData)
        });
        if (response.ok) {
            input.value = '';
            fetchMessages();
        }
    } catch (e) { console.error(e); }
}
