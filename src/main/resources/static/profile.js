document.addEventListener('DOMContentLoaded', () => {
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) {
        window.location.href = "login.html";
        return;
    }

    fetchProfile(userEmail);
    fetchNavProfile(userEmail);

    document.getElementById('profileForm').addEventListener('submit', handleSave);

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            if (confirm("Are you sure you want to logout?")) {
                localStorage.clear();
                window.location.href = "index.html";
            }
        });
    }

    // Role Handling
    const userRole = localStorage.getItem('userRole');
    if (userRole === 'TRAINER') {
        const dashboardLink = document.getElementById('navDashboard');
        if (dashboardLink) dashboardLink.href = 'trainer-dashboard.html';

        const trackerLink = document.getElementById('navTracker');
        const healthLink = document.getElementById('navHealth');
        const trainersLink = document.getElementById('navTrainers');
        if (trackerLink) trackerLink.style.display = 'none';
        if (healthLink) healthLink.style.display = 'none';
        if (trainersLink) trainersLink.style.display = 'none';

        const messagesLink = document.getElementById('navMessages');
        if (messagesLink) messagesLink.style.display = 'inline-block';
    }

    if (userRole === 'ADMIN') {
        const adminLink = document.getElementById('adminLink');
        if (adminLink) adminLink.style.display = 'inline-block';
    }

    // Hamburger Logic
    const hamburger = document.getElementById('hamburgerMenu');
    const navLinksList = document.getElementById('navLinks');
    if (hamburger && navLinksList) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinksList.classList.toggle('active');
        });
    }
});

async function fetchNavProfile(email) {
    try {
        const response = await fetch(`/api/profile?email=${email}`);
        if (response.ok) {
            const user = await response.json();
            const navUserName = document.getElementById("navUserName");
            if (navUserName) {
                navUserName.innerText = user.fullName || email.split('@')[0];
            }
            const navUserRole = document.getElementById("navUserRole");
            if (navUserRole) {
                navUserRole.innerText = user.role || "USER";
            }
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
    } catch (e) {
        console.error("Error fetching nav profile:", e);
    }
}

async function fetchProfile(email) {
    try {
        const response = await fetch(`/api/profile?email=${email}`);
        if (!response.ok) throw new Error('Failed to load profile');

        const user = await response.json();

        // Populate fields
        document.getElementById('fullName').value = user.fullName || '';
        document.getElementById('age').value = user.age || '';
        document.getElementById('weight').value = user.weight || '';
        document.getElementById('goal').value = user.goal || 'General Health';
        document.getElementById('email').value = user.email || email;

        // Profile Image / Icon Handling
        const profileImage = document.getElementById('profileImage');
        const profileIcon = document.getElementById('profileIcon');
        const userInitials = document.getElementById('userInitials');

        if (user.image_url) {
            if (profileImage) {
                profileImage.src = user.image_url;
                profileImage.style.display = 'block';
            }
            if (profileIcon) profileIcon.style.display = 'none';
            if (userInitials) userInitials.style.display = 'none';
        } else if (user.fullName) {
            // Fallback to human icon by default, initials are hidden
            if (profileIcon) profileIcon.style.display = 'block';
            if (profileImage) profileImage.style.display = 'none';
            if (userInitials) {
                const initials = user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
                userInitials.textContent = initials;
                // userInitials.style.display = 'block'; // Uncomment if initials preferred over icon
            }
        }

    } catch (error) {
        console.error(error);
        showMessage('Error loading profile data.', 'error');
    }
}

async function handleSave(e) {
    e.preventDefault();

    const saveBtn = document.getElementById('saveBtn');
    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;

    const userEmail = localStorage.getItem('userEmail');
    const fullName = document.getElementById('fullName').value;
    const age = document.getElementById('age').value;
    const weight = document.getElementById('weight').value;
    const goal = document.getElementById('goal').value;

    try {
        const response = await fetch('/api/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: userEmail,
                fullName,
                age,
                weight,
                goal
            })
        });

        if (response.ok) {
            showMessage('Profile updated successfully!', 'success');

            // Update localStorage for other pages
            localStorage.setItem('fullName', fullName);
            localStorage.setItem('goal', goal);

            // Update initials
            const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            document.getElementById('userInitials').textContent = initials;

        } else {
            showMessage('Failed to update profile.', 'error');
        }
    } catch (error) {
        console.error(error);
        showMessage('Error updating profile.', 'error');
    } finally {
        saveBtn.textContent = 'Save Changes';
        saveBtn.disabled = false;
    }
}

function showMessage(text, type) {
    const box = document.getElementById('msgBox');
    box.textContent = text;
    box.className = 'message ' + (type === 'success' ? 'msg-success' : 'msg-error');

    // Clear after 3 seconds
    if (type === 'success') {
        setTimeout(() => {
            box.textContent = '';
        }, 3000);
    }
}
