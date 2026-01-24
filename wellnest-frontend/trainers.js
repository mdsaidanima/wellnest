document.addEventListener('DOMContentLoaded', () => {
    const userEmail = localStorage.getItem("userEmail");
    if (userEmail) {
        fetchUserProfile(userEmail);
    }

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.clear();
            window.location.href = "login.html";
        });
    }

    const userRole = localStorage.getItem('userRole');
    if (userRole === 'TRAINER') {
        const dashboardLink = document.getElementById('navDashboard');
        if (dashboardLink) dashboardLink.href = 'trainer-dashboard.html';

        const trackerLink = document.getElementById('navTracker');
        const healthLink = document.getElementById('navHealth');
        if (trackerLink) trackerLink.style.display = 'none';
        if (healthLink) healthLink.style.display = 'none';

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

    fetchTrainers();
});

async function fetchUserProfile(email) {
    try {
        const response = await fetch(`/api/profile?email=${email}`);
        if (response.ok) {
            const user = await response.json();
            const navUserName = document.getElementById("navUserName");
            if (navUserName) navUserName.innerText = user.fullName || user.name || email.split('@')[0];
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

async function fetchTrainers() {
    const userEmail = localStorage.getItem('userEmail');
    const allGrid = document.getElementById('allTrainersGrid');
    const recGrid = document.getElementById('recommendedGrid');
    const recSection = document.getElementById('recommendedSection');

    try {
        // 1. Fetch Recommendations specifically for this user
        let recommendedIds = [];
        if (userEmail) {
            const recResponse = await fetch(`/api/trainers/recommend?userEmail=${userEmail}`);
            if (recResponse.ok) {
                const recTrainers = await recResponse.json();
                if (recTrainers.length > 0) {
                    recSection.style.display = 'block';
                    renderTrainers(recTrainers, recGrid);
                    recommendedIds = recTrainers.map(t => t.id);
                }
            }
        }

        // 2. Fetch All Trainers
        const allResponse = await fetch('/api/trainers');
        if (allResponse.ok) {
            let allTrainers = await allResponse.json();

            // Filter out those already shown in recommended
            if (recommendedIds.length > 0) {
                allTrainers = allTrainers.filter(t => !recommendedIds.includes(t.id));
            }

            renderTrainers(allTrainers, allGrid);
        } else {
            allGrid.innerHTML = '<p style="text-align:center;">Failed to load trainers.</p>';
        }

    } catch (error) {
        console.error('Error loading trainers:', error);
        allGrid.innerHTML = '<p style="text-align:center;">Error loading trainers.</p>';
    }
}

function renderTrainers(trainers, gridElement) {
    gridElement.innerHTML = '';

    if (trainers.length === 0) {
        gridElement.innerHTML = '<p style="color:#666;">No trainers found.</p>';
        return;
    }

    trainers.forEach(t => {
        const card = document.createElement('div');
        card.className = 'trainer-card';

        card.innerHTML = `
            <div class="trainer-img-wrapper">
                <img src="${t.imageUrl || 'https://via.placeholder.com/300x220?text=Trainer'}" class="trainer-img" alt="${t.name}">
                <div class="specialization-badge">${t.specialization}</div>
            </div>
            <div class="trainer-info">
                <div class="trainer-name">${t.name}</div>
                <div class="trainer-exp">${t.experienceYears} Years Experience</div>
                <div class="trainer-bio">${t.bio}</div>
                <button class="join-btn" onclick="joinTrainer(${t.id}, '${t.name}')">Select Trainer</button>
            </div>
        `;
        gridElement.appendChild(card);
    });
}

async function joinTrainer(trainerId, trainerName) {
    if (!confirm(`Do you want to enroll with ${trainerName}?`)) return;

    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) {
        alert("Please login first!");
        return;
    }

    try {
        const response = await fetch('/api/trainers/hire', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userEmail: userEmail, trainerId: String(trainerId) })
        });

        if (response.ok) {
            localStorage.setItem('trainerId', trainerId); // Store locally immediately
            alert(`You have successfully enrolled with ${trainerName}!`);
            window.location.href = "dashboard.html";
        } else {
            const txt = await response.text();
            alert("Failed to enroll: " + txt);
        }
    } catch (e) {
        console.error(e);
        alert("Error enrolling.");
    }
}
