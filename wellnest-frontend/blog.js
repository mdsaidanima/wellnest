// blog.js

document.addEventListener('DOMContentLoaded', () => {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            fetchPosts(btn.dataset.type);
        });
    });

    // Initial fetch
    fetchPosts('all');

    // Create Post Modal Logic
    const modal = document.getElementById('createPostModal');
    const openModalBtn = document.getElementById('openModalBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelPostBtn = document.getElementById('cancelPostBtn');
    const postForm = document.getElementById('postForm');

    if (openModalBtn) {
        openModalBtn.onclick = () => {
            document.getElementById('modalTitle').textContent = 'Create New Post';
            document.getElementById('postId').value = '';
            postForm.reset();
            modal.style.display = 'flex';
        };
    }

    if (closeModalBtn) closeModalBtn.onclick = () => modal.style.display = 'none';
    if (cancelPostBtn) cancelPostBtn.onclick = () => modal.style.display = 'none';

    window.onclick = (event) => {
        if (event.target == modal) modal.style.display = 'none';
    };

    // Form Submission
    postForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = postForm.querySelector('.submit-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';

        const postId = document.getElementById('postId').value;
        const userEmail = localStorage.getItem('userEmail');

        if (!userEmail) {
            alert('Please login to create a post.');
            submitBtn.textContent = 'PUBLISH POST';
            submitBtn.disabled = false;
            return;
        }

        const postData = {
            title: document.getElementById('postTitle').value,
            content: document.getElementById('postContent').value,
            category: document.getElementById('postCategory').value,
            imageUrl: document.getElementById('postImageUrl').value,
            userEmail: userEmail,
            postType: 'USER_POST'
        };

        try {
            const url = postId ? `/api/blog/${postId}` : '/api/blog';
            const method = postId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(postData)
            });

            if (response.ok) {
                alert(postId ? 'Post updated successfully!' : 'Post created successfully!');
                modal.style.display = 'none';
                postForm.reset();
                fetchPosts(document.querySelector('.tab-btn.active').dataset.type);
            } else {
                const errorText = await response.text();
                alert('Failed to save post: ' + errorText);
            }
        } catch (error) {
            console.error('Error saving post:', error);
            alert('Error saving post.');
        } finally {
            submitBtn.textContent = postId ? 'SAVE CHANGES' : 'PUBLISH POST';
            submitBtn.disabled = false;
        }
    });

    const userEmail = localStorage.getItem("userEmail");
    if (userEmail) {
        fetchUserProfile(userEmail);
    }

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            if (confirm("Are you sure you want to logout?")) {
                localStorage.clear();
                window.location.href = "login.html";
            }
        });
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

    const userRole = localStorage.getItem('userRole');
    if (userRole === 'TRAINER') {
        const dashboardLink = document.getElementById('navDashboard');
        if (dashboardLink) dashboardLink.href = 'trainer-dashboard.html';

        // Hide non-trainer links
        const trackerLink = document.getElementById('navTracker');
        const healthLink = document.getElementById('navHealth');
        const trainersLink = document.getElementById('navTrainers');
        if (trackerLink) trackerLink.style.display = 'none';
        if (healthLink) healthLink.style.display = 'none';
        if (trainersLink) trainersLink.style.display = 'none';

        // Ensure Messages link is present or visible if we add it
        const messagesLink = document.getElementById('navMessages');
        if (messagesLink) messagesLink.style.display = 'inline-block';
    }

    if (userRole === 'ADMIN') {
        const adminLink = document.getElementById('adminLink');
        if (adminLink) adminLink.style.display = 'inline-block';
    }
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

async function fetchPosts(type = 'all') {
    console.log("DEBUG: fetchPosts called with type:", type);
    const postsList = document.getElementById('postsList');
    postsList.innerHTML = '<p style="text-align:center; color:#666;">Loading...</p>';

    // Determine Layout
    let layout = 'list';
    // Use GRID for Featured Articles AND Community (cards with pics request)
    if (type === 'ARTICLE' || type === 'USER_POST' || type === 'all') {
        layout = 'grid';
    }

    // Apply Layout Styles
    if (layout === 'grid') {
        postsList.style.display = 'grid';
        postsList.style.gridTemplateColumns = 'repeat(auto-fill, minmax(300px, 1fr))';
        postsList.style.gap = '25px';
        postsList.style.maxWidth = 'none';
        postsList.style.margin = '0';
    } else {
        // List Layout (Wide) - unlikely to be used if we switch everything to grid, but safe to keep
        postsList.style.display = 'flex';
        postsList.style.flexDirection = 'column';
        postsList.style.gap = '20px';
        postsList.style.maxWidth = '800px';
        postsList.style.margin = '0 auto';
    }

    if (type === 'TRAINER_HISTORY') {
        fetchTrainerHistory();
        return;
    }

    try {
        let url = '/api/blog';
        if (type !== 'all') {
            url = `/api/blog/type/${type}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch');

        const posts = await response.json();
        renderPosts(posts, layout);

    } catch (error) {
        console.error('Error fetching posts:', error);
        postsList.innerHTML = '<p style="text-align:center; color:red;">Failed to load posts.</p>';
    }
}

async function fetchTrainerHistory() {
    const postsList = document.getElementById('postsList');
    postsList.innerHTML = '<p style="text-align:center; color:#666;">Loading history...</p>';
    postsList.style.display = 'block'; // Reset to block for list layout

    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) return;

    try {
        // Fetch User Profile to get Trainer ID
        const profileResp = await fetch(`/api/profile?email=${userEmail}`);
        if (!profileResp.ok) throw new Error("Failed to fetch profile");
        const profile = await profileResp.json();

        if (!profile.trainerId) {
            postsList.innerHTML = `
                <div style="text-align:center; padding: 40px; color: #aaa;">
                    <p>You have no active trainer enrollments.</p>
                     <a href="trainers.html" style="color:#18b046; text-decoration:none; font-weight:bold;">Find a Trainer</a>
                </div>
            `;
            return;
        }

        // Fetch Trainer Details
        const trainerResp = await fetch(`/api/trainers/${profile.trainerId}`);
        if (!trainerResp.ok) throw new Error("Failed to fetch trainer");
        const trainer = await trainerResp.json();

        // Render Trainer History Card
        renderTrainerHistoryCard(trainer);

    } catch (e) {
        console.error(e);
        postsList.innerHTML = '<p style="text-align:center; color:red;">Failed to load history.</p>';
    }
}

function renderTrainerHistoryCard(trainer) {
    const postsList = document.getElementById('postsList');
    postsList.innerHTML = ''; // Clear loading

    const initials = trainer.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

    const card = document.createElement('div');
    card.className = 'trainer-history-card';
    card.innerHTML = `
        <div class="th-left">
            <div class="th-avatar">${initials}</div>
            <div class="th-info">
                <div class="th-name">${escapeHtml(trainer.name)}</div>
                <div class="th-spec">${escapeHtml(trainer.specialization)}</div>
            </div>
        </div>
        <div class="th-right">
            <span class="th-status" style="background: rgba(24, 176, 70, 0.2); color: #18b046;">ACTIVE</span>
            <button class="th-cancel-btn" onclick="cancelEnrollment('${localStorage.getItem('userEmail')}')">CANCEL ENROLLMENT</button>
            <div class="th-menu">⋮</div>
        </div>
    `;
    postsList.appendChild(card);
}

async function cancelEnrollment(userEmail) {
    if (!confirm("Are you sure you want to cancel your enrollment with this trainer?")) return;
    try {
        const response = await fetch('/api/trainers/unhire', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userEmail })
        });
        if (response.ok) {
            alert("Enrollment cancelled.");
            fetchTrainerHistory(); // Refresh view
        } else {
            alert("Failed to cancel.");
        }
    } catch (e) { console.error(e); }
}

function renderPosts(posts, layout = 'list') {
    const postsList = document.getElementById('postsList');
    postsList.innerHTML = '';

    if (posts.length === 0) {
        postsList.innerHTML = '<p style="text-align:center; color:#666;">No posts found. Be the first to post!</p>';
        return;
    }

    posts.forEach(post => {
        const card = document.createElement('div');
        card.className = 'post-card';
        // Ensure card fills width in list mode
        if (layout === 'list') {
            card.style.width = '100%';
        }

        const initials = post.authorName ? post.authorName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'U';
        const date = new Date(post.createdAt).toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric'
        });

        const hasImage = post.imageUrl && post.imageUrl.trim().length > 0;
        const imgHtml = hasImage
            ? `<img src="${post.imageUrl}" class="post-cover-img" alt="${escapeHtml(post.title)}" onerror="this.src='https://via.placeholder.com/600x400/0f3d1e/ffffff?text=WellNest+Post'">`
            : '';

        const badgeHtml = `<div class="post-category-badge" style="${!hasImage ? 'position:relative; top:0; right:0; display:inline-block; margin-bottom:15px;' : ''}">${post.category || 'General'}</div>`;

        card.innerHTML = `
            ${hasImage ? badgeHtml : ''}
            ${imgHtml}
            <div class="post-content-area">
                ${!hasImage ? badgeHtml : ''}
                <div class="post-meta">
                    <div class="post-avatar">${initials}</div>
                    <div class="post-info">
                        <div class="post-author">${post.authorName || 'Unknown User'}</div>
                        <div style="font-size: 11px; opacity: 0.7;">${date}</div>
                    </div>
                </div>
                <h3 class="post-title">${escapeHtml(post.title)}</h3>
                <div class="post-excerpt" style="${!hasImage ? '-webkit-line-clamp: none; max-height: none;' : ''}">${escapeHtml(post.content)}</div>
                <div class="post-actions">
                    <div class="action-item" onclick="likePost(${post.id}, this)">
                        <span>♥</span> ${post.likesCount} Likes
                    </div>
                    <div class="action-item" onclick="toggleComments(${post.id})">
                        <span>💬</span> Comment
                    </div>
                     <div class="action-item" onclick="sharePost(${post.id})">
                        <span>↗</span> Share
                    </div>
                    <div class="action-item delete-btn" style="display: ${post.authorName === localStorage.getItem('fullName') ? 'flex' : 'none'};" onclick="deletePost(${post.id})">
                        <span>🗑</span> Delete
                    </div>
                    <div class="action-item edit-btn" style="display: ${post.authorName === localStorage.getItem('fullName') ? 'flex' : 'none'};" onclick='openEditModal(${JSON.stringify(post).replace(/'/g, "&#39;")})'>
                        <span>✎</span> Edit
                    </div>
                </div>
            </div>
            
            <!-- Hidden Comment Section -->
            <div id="comments-${post.id}" class="comments-section">
                <div id="comments-list-${post.id}"></div>
                <div class="comment-input-box">
                    <input type="text" id="comment-input-${post.id}" class="comment-input" placeholder="Write a comment...">
                    <button onclick="submitComment(${post.id})" class="comment-submit">Post</button>
                </div>
            </div>
        `;
        postsList.appendChild(card);
    });
}

// Interactive Functions
async function likePost(id, btn) {
    try {
        const response = await fetch(`/api/blog/${id}/like`, { method: 'POST' });
        if (response.ok) {
            const updatedPost = await response.json();
            btn.innerHTML = `<span>♥</span> ${updatedPost.likesCount} Likes`;
            btn.classList.add('liked');
        }
    } catch (e) { console.error(e); }
}

function toggleComments(id) {
    const section = document.getElementById(`comments-${id}`);
    if (section.style.display === 'block') {
        section.style.display = 'none';
    } else {
        section.style.display = 'block';
        loadComments(id);
    }
}

async function loadComments(id) {
    const list = document.getElementById(`comments-list-${id}`);
    list.innerHTML = '<p style="color:#666; font-size:12px;">Loading comments...</p>';
    try {
        const response = await fetch(`/api/blog/${id}/comments`);
        const comments = await response.json();
        if (comments.length === 0) {
            list.innerHTML = '<p style="color:#666; font-size:12px;">No comments yet. Be the first!</p>';
        } else {
            list.innerHTML = comments.map(c => `
                <div class="comment">
                    <div class="comment-header">
                        <span class="comment-author">${escapeHtml(c.authorName)}</span>
                        <span>${new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div>${escapeHtml(c.content)}</div>
                </div>
            `).join('');
        }
    } catch (e) {
        list.innerHTML = '<p style="color:red; font-size:12px;">Failed to load comments.</p>';
    }
}

async function submitComment(id) {
    const input = document.getElementById(`comment-input-${id}`);
    const content = input.value.trim();
    if (!content) return;

    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) {
        alert("Please login to comment.");
        return;
    }

    try {
        const response = await fetch(`/api/blog/${id}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userEmail, content })
        });
        if (response.ok) {
            input.value = '';
            loadComments(id); // Reload comments
        } else {
            alert("Failed to post comment.");
        }
    } catch (e) { console.error(e); }
}

function sharePost(id) {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        alert("Link copied to clipboard!");
    }).catch(() => {
        alert("Failed to copy link.");
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function deletePost(id) {
    if (!confirm('Are you sure you want to delete this post?')) return;

    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) {
        alert('Please login to delete posts.');
        return;
    }

    try {
        const response = await fetch(`/api/blog/${id}?userEmail=${encodeURIComponent(userEmail)}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('Post deleted successfully!');
            fetchPosts(document.querySelector('.tab-btn.active').dataset.type);
        } else {
            const errorText = await response.text();
            alert('Error deleting post: ' + errorText);
        }
    } catch (e) {
        console.error('Delete error:', e);
        alert('Error deleting post.');
    }
}

function openEditModal(post) {
    document.getElementById('modalTitle').textContent = 'Edit Post';
    document.getElementById('postId').value = post.id;
    document.getElementById('postTitle').value = post.title;
    document.getElementById('postContent').value = post.content;
    document.getElementById('postCategory').value = post.category;
    document.getElementById('postImageUrl').value = post.imageUrl || '';
    document.getElementById('createPostModal').style.display = 'flex';
}
