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
        const submitBtn = postForm.querySelector('.btn-primary');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';

        const postId = document.getElementById('postId').value;
        const postData = {
            title: document.getElementById('postTitle').value,
            content: document.getElementById('postContent').value,
            category: document.getElementById('postCategory').value,
            imageUrl: document.getElementById('postImageUrl').value,
            authorName: localStorage.getItem('fullName') || 'Unknown User'
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
                modal.style.display = 'none';
                postForm.reset();
                fetchPosts(document.querySelector('.tab-btn.active').dataset.type);
            } else {
                alert('Failed to save post.');
            }
        } catch (error) {
            console.error('Error saving post:', error);
            alert('Error saving post.');
        } finally {
            if (!postId) submitBtn.textContent = 'PUBLISH POST';
            submitBtn.disabled = false;
        }
    });

});

async function fetchPosts(type = 'all') {
    console.log("DEBUG: fetchPosts called with type:", type);
    const postsList = document.getElementById('postsList');
    postsList.innerHTML = '<p style="text-align:center; color:#666;">Loading...</p>';

    if (type === 'TRAINER_HISTORY') {
        postsList.style.gridTemplateColumns = '1fr';
        postsList.style.maxWidth = '600px';
        postsList.style.margin = '0 auto';
        fetchTrainerHistory();
        return;
    } else {
        postsList.style.gridTemplateColumns = 'repeat(auto-fill, minmax(320px, 1fr))';
        postsList.style.maxWidth = 'none';
        postsList.style.margin = '0';
    }

    try {
        let url = '/api/blog';
        if (type !== 'all') {
            url = `/api/blog/type/${type}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch');

        const posts = await response.json();
        renderPosts(posts);

    } catch (error) {
        console.error('Error fetching posts:', error);
        postsList.innerHTML = '<p style="text-align:center; color:red;">Failed to load posts.</p>';
    }
}

async function fetchTrainerHistory() {
    const postsList = document.getElementById('postsList');
    const userEmail = localStorage.getItem('userEmail');

    // First, verify with backend to get latest trainerId
    try {
        const profileRes = await fetch(`/api/profile?email=${userEmail}`);
        if (profileRes.ok) {
            const user = await profileRes.json();
            if (user.trainerId) {
                localStorage.setItem('trainerId', user.trainerId);
            } else {
                localStorage.removeItem('trainerId');
            }
        }
    } catch (e) {
        console.error("Error verifying profile:", e);
    }

    const trainerId = localStorage.getItem('trainerId');

    if (!trainerId) {
        postsList.innerHTML = '<p style="text-align:center; color:#666; padding: 40px;">You are not enrolled with any trainer yet.</p>';
        return;
    }

    try {
        const response = await fetch(`/api/trainers/${trainerId}`);
        if (response.ok) {
            const trainer = await response.json();
            renderTrainerHistory([trainer]);
        } else {
            postsList.innerHTML = '<p style="text-align:center; color:#666;">No active enrollment found.</p>';
        }
    } catch (e) {
        console.error(e);
        postsList.innerHTML = '<p style="text-align:center; color:red;">Error loading trainer history.</p>';
    }
}

function renderTrainerHistory(trainers) {
    const postsList = document.getElementById('postsList');
    postsList.innerHTML = '';

    trainers.forEach(t => {
        const card = document.createElement('div');
        card.className = 'post-card';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.alignItems = 'center';
        card.style.textAlign = 'center';
        card.style.padding = '40px 20px'; // Generous padding
        card.style.gap = '15px';

        const initials = t.name ? t.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'T';

        card.innerHTML = `
            <div class="post-avatar" style="width: 80px; height: 80px; font-size: 32px; border: 2px solid #18b046; display: flex; align-items: center; justify-content: center; border-radius: 50%; color: #fff; font-weight: bold;">${initials}</div>
            <div>
                <h2 style="margin: 10px 0 5px; color: #fff; font-size: 24px;">${t.name}</h2>
                <p style="color: #18b046; font-size: 16px; font-weight: 500; margin-bottom: 5px;">${t.specialization}</p>
                <div style="background: rgba(24, 176, 70, 0.1); border: 1px solid rgba(24, 176, 70, 0.3); color: #18b046; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: bold; text-transform: uppercase; display: inline-block; margin-top: 5px;">
                    Active Enrollment
                </div>
            </div>
            
            <div style="margin-top: 15px; width: 100%; display: flex; flex-direction: column; gap: 10px; align-items: center;">
                <button onclick="cancelEnrollment(${t.id}, '${t.name}')" 
                    style="background: rgba(255, 77, 77, 0.1); border: 1px solid #ff4d4d; color: #ff4d4d; padding: 12px 24px; border-radius: 99px; cursor: pointer; font-weight: bold; font-size: 13px; text-transform: uppercase; transition: all 0.3s; width: 100%; max-width: 250px;">
                    Cancel Enrollment
                </button>
                <p style="font-size: 11px; color: #666;">You can only have one active trainer at a time.</p>
            </div>
        `;
        postsList.appendChild(card);
    });
}

async function cancelEnrollment(trainerId, trainerName) {
    if (!confirm(`Are you sure you want to cancel your enrollment with ${trainerName}?`)) {
        return;
    }

    const userEmail = localStorage.getItem('userEmail');
    try {
        const response = await fetch('/api/trainers/unhire', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userEmail: userEmail })
        });

        if (response.ok) {
            localStorage.removeItem('trainerId');
            alert(`You have successfully cancelled your enrollment with ${trainerName}.`);
            fetchPosts('TRAINER_HISTORY');
        } else {
            const txt = await response.text();
            alert("Failed to cancel enrollment: " + txt);
        }
    } catch (e) {
        console.error(e);
        alert("Error cancelling enrollment.");
    }
}

function renderPosts(posts) {
    const postsList = document.getElementById('postsList');
    postsList.innerHTML = '';

    if (posts.length === 0) {
        postsList.innerHTML = '<p style="text-align:center; color:#666;">No posts found. Be the first to post!</p>';
        return;
    }

    posts.forEach(post => {
        const card = document.createElement('div');
        card.className = 'post-card';
        const initials = post.authorName ? post.authorName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'U';
        const date = new Date(post.createdAt).toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric'
        });

        const imageHtml = post.imageUrl
            ? `<img src="${post.imageUrl}" class="post-cover-img" style="display:block;" alt="${escapeHtml(post.title)}">`
            : '';

        card.innerHTML = `
            ${imageHtml}
            <div class="post-meta">
                <div class="post-avatar">${initials}</div>
                <div class="post-author">${post.authorName || 'Unknown User'}</div>
                <div>• ${date}</div>
                <div class="post-category">${post.category || 'General'}</div>
            </div>
            <h3 class="post-title">${escapeHtml(post.title)}</h3>
            <div class="post-excerpt">${escapeHtml(post.content)}</div>
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
                <div class="action-item delete-btn" style="color: #ff4d4d; display: ${post.authorName === localStorage.getItem('fullName') ? 'flex' : 'none'};" onclick="deletePost(${post.id})">
                    <span>🗑</span> Delete
                </div>
                <div class="action-item edit-btn" style="color: #4da6ff; display: ${post.authorName === localStorage.getItem('fullName') ? 'flex' : 'none'};" onclick='openEditModal(${JSON.stringify(post).replace(/'/g, "&#39;")})'>
                    <span>✎</span> Edit
                </div>
            </div>
        `;
        postsList.appendChild(card);
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function deletePost(id) {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
        const response = await fetch(`/api/blog/${id}`, { method: 'DELETE' });
        if (response.ok) {
            fetchPosts(document.querySelector('.tab-btn.active').dataset.type);
        } else {
            alert('Error deleting post.');
        }
    } catch (e) { console.error(e); }
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
