// admin.js - Enhanced Admin Dashboard with Search, Filter, and Details Modal

const API_BASE = "/api/admin";

// Store all data for filtering
let allUsers = [];
let allTrainers = [];

document.addEventListener('DOMContentLoaded', () => {
    // Basic Security Check
    const role = localStorage.getItem('userRole');
    if (role !== 'ADMIN') {
        alert("Access Denied: You do not have administrator privileges.");
        window.location.href = "dashboard.html";
        return;
    }

    fetchStats();
    fetchUsers();
    fetchTrainers();
    setupEventListeners();
});


async function fetchStats() {
    try {
        const res = await fetch(`${API_BASE}/stats`);
        if (res.ok) {
            const data = await res.json();
            document.getElementById('statUsers').textContent = data.totalUsers;
            document.getElementById('statTrainers').textContent = data.totalTrainers;
            document.getElementById('statWorkouts').textContent = data.totalWorkouts;
            document.getElementById('statMeals').textContent = data.totalMeals;
            document.getElementById('statPosts').textContent = data.totalBlogPosts;
        }
    } catch (err) {
        console.error("Error fetching stats:", err);
    }
}

async function fetchUsers() {
    const container = document.getElementById('userTableBody');
    container.innerHTML = '<div style="text-align:center; color:#888; padding: 40px;">Loading users...</div>';

    try {
        const res = await fetch(`${API_BASE}/users`);
        if (res.ok) {
            const allData = await res.json();

            // Filter to show only USER role (not ADMIN or TRAINER)
            allUsers = allData.filter(user => user.role === 'USER');

            renderUsers(allUsers);
        }
    } catch (err) {
        console.error("Error fetching users:", err);
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#ff4d4d">Error loading users.</td></tr>';
    }
}

async function fetchTrainers() {
    const container = document.getElementById('trainerTableBody');
    container.innerHTML = '<div style="text-align:center; color:#888; padding: 40px;">Loading trainers...</div>';

    try {
        const res = await fetch(`${API_BASE}/trainers`);
        if (res.ok) {
            allTrainers = await res.json();
            renderTrainers(allTrainers);
        }
    } catch (err) {
        console.error("Error fetching trainers:", err);
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#ff4d4d">Error loading trainers.</td></tr>';
    }
}

function renderUsers(users) {
    const container = document.getElementById('userTableBody');

    if (users.length === 0) {
        container.innerHTML = '<div style="text-align:center; color:#888; padding: 40px;">No users found</div>';
        return;
    }

    container.innerHTML = users.map(user => `
        <div class="user-card" onclick="event.target.classList.contains('user-card-delete') ? null : viewUserDetails(${user.id})" style="cursor: pointer;">
            <div class="user-card-info">
                <div class="user-card-name">${user.fullName || 'N/A'}</div>
                <div class="user-card-email">${user.email}</div>
            </div>
            <button class="user-card-delete" onclick="event.stopPropagation(); deleteUser(${user.id}, '${user.fullName}')">Delete</button>
        </div>
    `).join('');
}

function renderTrainers(trainers) {
    const container = document.getElementById('trainerTableBody');

    if (trainers.length === 0) {
        container.innerHTML = '<div style="text-align:center; color:#888; padding: 40px;">No trainers found</div>';
        return;
    }

    container.innerHTML = trainers.map(trainer => `
        <div class="user-card" onclick="event.target.classList.contains('user-card-delete') ? null : viewTrainerDetails(${trainer.id})" style="cursor: pointer;">
            <div class="user-card-info">
                <div class="user-card-name">${trainer.name}</div>
                <div class="user-card-email">${trainer.contactEmail}</div>
            </div>
            <button class="user-card-delete" onclick="event.stopPropagation(); deleteTrainer(${trainer.id}, '${trainer.name}')">Delete</button>
        </div>
    `).join('');
}

// Filter Functions
function filterUsers() {
    const searchTerm = document.getElementById('userSearch').value.toLowerCase();
    const goalFilter = document.getElementById('userGoalFilter').value;

    let filtered = allUsers;

    // Apply search filter
    if (searchTerm) {
        filtered = filtered.filter(user =>
            (user.fullName && user.fullName.toLowerCase().includes(searchTerm)) ||
            (user.email && user.email.toLowerCase().includes(searchTerm))
        );
    }

    // Apply goal filter
    if (goalFilter) {
        filtered = filtered.filter(user => user.goal === goalFilter);
    }

    renderUsers(filtered);
}

function filterTrainers() {
    const searchTerm = document.getElementById('trainerSearch').value.toLowerCase();
    const specFilter = document.getElementById('trainerSpecFilter').value;

    let filtered = allTrainers;

    // Apply search filter
    if (searchTerm) {
        filtered = filtered.filter(trainer =>
            (trainer.name && trainer.name.toLowerCase().includes(searchTerm)) ||
            (trainer.contactEmail && trainer.contactEmail.toLowerCase().includes(searchTerm))
        );
    }

    // Apply specialization filter
    if (specFilter) {
        filtered = filtered.filter(trainer =>
            trainer.specialization && trainer.specialization.includes(specFilter)
        );
    }

    renderTrainers(filtered);
}

function clearUserFilters() {
    document.getElementById('userSearch').value = '';
    document.getElementById('userGoalFilter').value = '';
    renderUsers(allUsers);
}

function clearTrainerFilters() {
    document.getElementById('trainerSearch').value = '';
    document.getElementById('trainerSpecFilter').value = '';
    renderTrainers(allTrainers);
}

// View Details Functions
async function viewUserDetails(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    document.getElementById('modalTitle').textContent = `User Details - ${user.fullName}`;

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div class="detail-grid">
            <div class="detail-item">
                <div class="detail-label">User ID</div>
                <div class="detail-value">#${user.id}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Full Name</div>
                <div class="detail-value">${user.fullName || 'N/A'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Email</div>
                <div class="detail-value">${user.email}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Role</div>
                <div class="detail-value">${user.role}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Age</div>
                <div class="detail-value">${user.age || 'N/A'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Weight</div>
                <div class="detail-value">${user.weight ? user.weight + ' kg' : 'N/A'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Goal</div>
                <div class="detail-value">${user.goal || 'Not set'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Trainer Assigned</div>
                <div class="detail-value">${user.trainerId ? 'Yes (ID: ' + user.trainerId + ')' : 'No'}</div>
            </div>
        </div>
    `;

    openModal();
}

async function viewTrainerDetails(trainerId) {
    const trainer = allTrainers.find(t => t.id === trainerId);
    if (!trainer) return;

    document.getElementById('modalTitle').textContent = `Trainer Details - ${trainer.name}`;

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div class="detail-grid">
            <div class="detail-item">
                <div class="detail-label">Trainer ID</div>
                <div class="detail-value">#${trainer.id}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Name</div>
                <div class="detail-value">${trainer.name}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Email</div>
                <div class="detail-value">${trainer.contactEmail}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Age</div>
                <div class="detail-value">${trainer.age || 'N/A'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Specialization</div>
                <div class="detail-value">${trainer.specialization}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Experience</div>
                <div class="detail-value">${trainer.experienceYears} years</div>
            </div>
            <div class="detail-item" style="grid-column: 1 / -1;">
                <div class="detail-label">Bio</div>
                <div class="detail-value">${trainer.bio || 'No bio available'}</div>
            </div>
        </div>
    `;

    openModal();
}

// Modal Functions
function openModal() {
    const modal = document.getElementById('detailsModal');
    modal.style.display = 'flex';
}

function closeModal() {
    const modal = document.getElementById('detailsModal');
    modal.style.display = 'none';
}

// Delete Functions
async function deleteUser(userId, userName) {
    if (!confirm(`⚠️ CRITICAL ACTION\n\nAre you sure you want to delete user "${userName}"?\n\nThis will permanently remove:\n- User account\n- All workout logs\n- All meal logs\n- All progress data\n\nThis action CANNOT be undone!`)) {
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/users/${userId}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            showToast(`✓ User "${userName}" successfully removed`);
            fetchUsers();
            fetchStats();
        } else {
            showToast(`✗ Failed to delete user`, true);
        }
    } catch (err) {
        console.error("Error deleting user:", err);
        showToast(`✗ Error deleting user`, true);
    }
}

async function deleteTrainer(trainerId, trainerName) {
    if (!confirm(`⚠️ CRITICAL ACTION\n\nAre you sure you want to delete trainer "${trainerName}"?\n\nThis will:\n- Remove trainer profile\n- Unassign all their clients\n- Delete trainer account\n\nThis action CANNOT be undone!`)) {
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/trainers/${trainerId}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            showToast(`✓ Trainer "${trainerName}" successfully removed`);
            fetchTrainers();
            fetchStats();
        } else {
            showToast(`✗ Failed to delete trainer`, true);
        }
    } catch (err) {
        console.error("Error deleting trainer:", err);
        showToast(`✗ Error deleting trainer`, true);
    }
}

function showToast(msg, isError = false) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.style.background = isError ? '#ff4d4d' : '#18b046';
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

function logout() {
    localStorage.clear();
    window.location.href = "login.html";
}

// Admin Profile Functions
function showAdminProfile() {
    const modal = document.getElementById('adminProfileModal');
    const adminEmail = localStorage.getItem('userEmail') || 'admin@wellnest.com';

    // Update email in modal
    document.getElementById('adminEmail').textContent = adminEmail;

    // Update last login time
    const now = new Date();
    const timeString = now.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
    document.getElementById('adminLastLogin').textContent = timeString;

    // Show modal
    modal.style.display = 'flex';
}

function closeAdminProfile() {
    const modal = document.getElementById('adminProfileModal');
    modal.style.display = 'none';
}

// Tab Switching Function
function switchTab(tab) {
    // Update tab buttons
    document.getElementById('usersTab').classList.remove('active');
    document.getElementById('trainersTab').classList.remove('active');

    // Update tab content
    document.getElementById('usersContent').classList.remove('active');
    document.getElementById('trainersContent').classList.remove('active');

    if (tab === 'users') {
        document.getElementById('usersTab').classList.add('active');
        document.getElementById('usersContent').classList.add('active');
    } else if (tab === 'trainers') {
        document.getElementById('trainersTab').classList.add('active');
        document.getElementById('trainersContent').classList.add('active');
    }
}

// Setup Event Listeners for Search and Filter
function setupEventListeners() {
    // User search and filter
    const userSearch = document.getElementById('userSearch');
    const userGoalFilter = document.getElementById('userGoalFilter');

    if (userSearch) {
        userSearch.addEventListener('input', filterUsers);
    }
    if (userGoalFilter) {
        userGoalFilter.addEventListener('change', filterUsers);
    }

    // Trainer search and filter
    const trainerSearch = document.getElementById('trainerSearch');
    const trainerSpecFilter = document.getElementById('trainerSpecFilter');

    if (trainerSearch) {
        trainerSearch.addEventListener('input', filterTrainers);
    }
    if (trainerSpecFilter) {
        trainerSpecFilter.addEventListener('change', filterTrainers);
    }
}

// Filter Users
function filterUsers() {
    const searchTerm = document.getElementById('userSearch').value.toLowerCase();
    const goalFilter = document.getElementById('userGoalFilter').value;

    const filtered = allUsers.filter(user => {
        const matchesSearch = !searchTerm ||
            (user.fullName && user.fullName.toLowerCase().includes(searchTerm)) ||
            (user.email && user.email.toLowerCase().includes(searchTerm));

        const matchesGoal = !goalFilter || user.goal === goalFilter;

        return matchesSearch && matchesGoal;
    });

    renderUsers(filtered);
}

// Filter Trainers
function filterTrainers() {
    const searchTerm = document.getElementById('trainerSearch').value.toLowerCase();
    const specFilter = document.getElementById('trainerSpecFilter').value;

    const filtered = allTrainers.filter(trainer => {
        const matchesSearch = !searchTerm ||
            (trainer.name && trainer.name.toLowerCase().includes(searchTerm)) ||
            (trainer.contactEmail && trainer.contactEmail.toLowerCase().includes(searchTerm));

        const matchesSpec = !specFilter || trainer.specialization === specFilter;

        return matchesSearch && matchesSpec;
    });

    renderTrainers(filtered);
}

// Clear User Filters
function clearUserFilters() {
    document.getElementById('userSearch').value = '';
    document.getElementById('userGoalFilter').value = '';
    renderUsers(allUsers);
}

// Clear Trainer Filters
function clearTrainerFilters() {
    document.getElementById('trainerSearch').value = '';
    document.getElementById('trainerSpecFilter').value = '';
    renderTrainers(allTrainers);
}

// Add User Modal Functions
function openAddUserModal() {
    const modal = document.getElementById('addUserModal');
    modal.style.display = 'flex';
    // Reset form
    document.getElementById('addUserForm').reset();
}

function closeAddUserModal() {
    const modal = document.getElementById('addUserModal');
    modal.style.display = 'none';
}

async function submitAddUser(event) {
    event.preventDefault();

    const userData = {
        fullName: document.getElementById('newUserName').value.trim(),
        email: document.getElementById('newUserEmail').value.trim(),
        password: document.getElementById('newUserPassword').value,
        age: document.getElementById('newUserAge').value ? parseInt(document.getElementById('newUserAge').value) : null,
        weight: document.getElementById('newUserWeight').value ? parseFloat(document.getElementById('newUserWeight').value) : null,
        goal: document.getElementById('newUserGoal').value || null,
        role: 'USER'
    };

    try {
        const res = await fetch('/api/users/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        if (res.ok) {
            showToast(`✓ User "${userData.fullName}" added successfully!`);
            closeAddUserModal();
            fetchUsers();
            fetchStats();
        } else {
            const error = await res.text();
            showToast(`✗ Failed to add user: ${error}`, true);
        }
    } catch (err) {
        console.error("Error adding user:", err);
        showToast(`✗ Error adding user`, true);
    }
}

// Add Trainer Modal Functions
function openAddTrainerModal() {
    const modal = document.getElementById('addTrainerModal');
    modal.style.display = 'flex';
    // Reset form
    document.getElementById('addTrainerForm').reset();
}

function closeAddTrainerModal() {
    const modal = document.getElementById('addTrainerModal');
    modal.style.display = 'none';
}

async function submitAddTrainer(event) {
    event.preventDefault();

    const trainerData = {
        name: document.getElementById('newTrainerName').value.trim(),
        contactEmail: document.getElementById('newTrainerEmail').value.trim(),
        age: document.getElementById('newTrainerAge').value ? parseInt(document.getElementById('newTrainerAge').value) : null,
        experienceYears: parseInt(document.getElementById('newTrainerExperience').value),
        specialization: document.getElementById('newTrainerSpecialization').value,
        bio: document.getElementById('newTrainerBio').value.trim() || null
    };

    try {
        const res = await fetch(`${API_BASE}/trainers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(trainerData)
        });

        if (res.ok) {
            showToast(`✓ Trainer "${trainerData.name}" added successfully!`);
            closeAddTrainerModal();
            fetchTrainers();
            fetchStats();
        } else {
            const error = await res.text();
            showToast(`✗ Failed to add trainer: ${error}`, true);
        }
    } catch (err) {
        console.error("Error adding trainer:", err);
        showToast(`✗ Error adding trainer`, true);
    }
}

// Close modals on outside click
document.addEventListener('DOMContentLoaded', () => {
    const addUserModal = document.getElementById('addUserModal');
    const addTrainerModal = document.getElementById('addTrainerModal');
    const adminProfileModal = document.getElementById('adminProfileModal');

    if (addUserModal) {
        addUserModal.addEventListener('click', (e) => {
            if (e.target === addUserModal) {
                closeAddUserModal();
            }
        });
    }

    if (addTrainerModal) {
        addTrainerModal.addEventListener('click', (e) => {
            if (e.target === addTrainerModal) {
                closeAddTrainerModal();
            }
        });
    }

    if (adminProfileModal) {
        adminProfileModal.addEventListener('click', (e) => {
            if (e.target === adminProfileModal) {
                closeAdminProfile();
            }
        });
    }
});
