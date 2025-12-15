document.addEventListener('DOMContentLoaded', () => {
    fetchPosts();

    // Modal logic
    const modal = document.getElementById('createPostModal');
    const openBtn = document.getElementById('openModalBtn');
    const closeBtn = document.getElementById('closeModalBtn');

    openBtn.onclick = () => modal.style.display = 'flex';
    closeBtn.onclick = () => modal.style.display = 'none';
    window.onclick = (e) => {
        if (e.target === modal) modal.style.display = 'none';
    };

    // Tab logic
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const type = tab.getAttribute('data-type');
            fetchPosts(type);
        });
    });

    // Create/Edit Post
    document.getElementById('createPostForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('postTitle').value;
        const imageUrl = document.getElementById('postImageUrl').value;
        const category = document.getElementById('postCategory').value;
        const content = document.getElementById('postContent').value;
        const submitBtn = document.getElementById('submitPostBtn');
        const postId = submitBtn.getAttribute('data-edit-id'); // Check if editing

        const userEmail = localStorage.getItem('userEmail');
        if (!userEmail) {
            alert('You must be logged in to post.');
            window.location.href = 'login.html';
            return;
        }

        submitBtn.textContent = postId ? 'Updating...' : 'Publishing...';
        submitBtn.disabled = true;

        try {
            const url = postId ? `/api/blog/${postId}` : '/api/blog';
            const method = postId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title,
                    imageUrl,
                    category,
                    content,
                    postType: 'USER_POST',
                    userEmail: userEmail
                })
            });

            if (response.ok) {
                modal.style.display = 'none';
                document.getElementById('createPostForm').reset();
                submitBtn.removeAttribute('data-edit-id'); // Clear edit mode
                document.querySelector('#createPostModal h2').textContent = 'Create New Post';
                submitBtn.textContent = 'PUBLISH POST';
                fetchPosts(); // Refresh list
            } else {
                alert('Failed to save post');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error saving post');
        } finally {
            if (!postId) submitBtn.textContent = 'PUBLISH POST';
            submitBtn.disabled = false;
        }
    });

});

async function fetchPosts(type = 'all') {
    const postsList = document.getElementById('postsList');
    postsList.innerHTML = '<p style="text-align:center; color:#666;">Loading posts...</p>';

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
        // Generate Initials
        const initials = post.authorName ? post.authorName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'U';

        // Format Date
        const date = new Date(post.createdAt).toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric'
        });

        // Image HTML (only if exists)
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
                <!-- Delete Button (Only shows if current user is author - basic check) -->
                <div class="action-item delete-btn" style="color: #ff4d4d; display: none;" data-author="${post.authorName}" onclick="deletePost(${post.id})">
                    <span>🗑</span> Delete
                </div>
                 <!-- Edit Button (Only shows if current user is author) -->
                <div class="action-item edit-btn" style="color: #4da6ff; display: none;" data-author="${post.authorName}" onclick='openEditModal(${JSON.stringify(post).replace(/'/g, "&#39;")})'>
                    <span>✎</span> Edit
                </div>
            </div>
            
            <div class="comments-section" id="comments-${post.id}">
                <div id="comments-list-${post.id}"></div>
                <div class="comment-input-box">
                    <input type="text" class="comment-input" placeholder="Write a comment..." id="comment-input-${post.id}">
                    <button class="comment-submit" onclick="submitComment(${post.id})">Send</button>
                </div>
            </div>
        `;
        postsList.appendChild(card);

        // Check ownership
        const currentUser = localStorage.getItem('fullName');
        if (currentUser && post.authorName === currentUser) {
            const deleteBtn = card.querySelector('.delete-btn');
            const editBtn = card.querySelector('.edit-btn');
            if (deleteBtn) deleteBtn.style.display = 'flex';
            if (editBtn) editBtn.style.display = 'flex';
        }
    });
}

function openEditModal(post) {
    const modal = document.getElementById('createPostModal');

    document.querySelector('#createPostModal h2').textContent = 'Edit Post';
    document.getElementById('postTitle').value = post.title;
    document.getElementById('postImageUrl').value = post.imageUrl || '';
    document.getElementById('postCategory').value = post.category || 'General';
    document.getElementById('postContent').value = post.content;

    const submitBtn = document.getElementById('submitPostBtn');
    submitBtn.textContent = 'UPDATE POST';
    submitBtn.setAttribute('data-edit-id', post.id);

    modal.style.display = 'flex';
}

async function likePost(id, btnElement) {
    try {
        const response = await fetch(`/api/blog/${id}/like`, { method: 'POST' });
        if (response.ok) {
            const updatedPost = await response.json();
            btnElement.innerHTML = `<span>♥</span> ${updatedPost.likesCount} Likes`;
            btnElement.classList.add('liked');
        }
    } catch (e) {
        console.error(e);
    }
}

function toggleComments(id) {
    const section = document.getElementById(`comments-${id}`);
    if (section.style.display === 'none' || !section.style.display) {
        section.style.display = 'block';
        loadComments(id);
    } else {
        section.style.display = 'none';
    }
}

async function loadComments(id) {
    const list = document.getElementById(`comments-list-${id}`);
    list.innerHTML = '<p style="color:#666; font-size:12px;">Loading comments...</p>';

    try {
        const response = await fetch(`/api/blog/${id}/comments`);
        const comments = await response.json();

        list.innerHTML = '';
        comments.forEach(c => {
            const div = document.createElement('div');
            div.className = 'comment';
            div.innerHTML = `
                <div class="comment-header">
                    <span class="comment-author">${escapeHtml(c.authorName)}</span>
                    <span>${new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
                <div>${escapeHtml(c.content)}</div>
            `;
            list.appendChild(div);
        });

        if (comments.length === 0) {
            list.innerHTML = '<p style="color:#666; font-size:12px; margin-bottom:10px;">No comments yet.</p>';
        }

    } catch (e) {
        console.error(e);
        list.innerHTML = '<p style="color:red; font-size:12px;">Error loading comments</p>';
    }
}

async function submitComment(id) {
    const input = document.getElementById(`comment-input-${id}`);
    const content = input.value.trim();
    if (!content) return;

    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) {
        alert('Please login to comment.');
        return;
    }

    try {
        const response = await fetch(`/api/blog/${id}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: content,
                userEmail: userEmail
            })
        });

        if (response.ok) {
            input.value = '';
            loadComments(id); // Reload comments
        }
    } catch (e) {
        console.error(e);
    }
}

function sharePost(id) {
    // Simple alert for now, or use navigator.share if available
    const url = window.location.origin + '/blog.html?post=' + id;
    if (navigator.share) {
        navigator.share({
            title: 'Check out this post on WellNest',
            url: url
        }).catch(console.error);
    } else {
        navigator.clipboard.writeText(url);
        alert('Post link copied to clipboard!');
    }
}

// ... escapeHtml function ...
function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

async function deletePost(id) {
    if (!confirm('Are you sure you want to delete this post?')) return;

    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) return;

    try {
        const response = await fetch(`/api/blog/${id}?userEmail=${userEmail}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('Post deleted.');
            fetchPosts(); // Refresh
        } else {
            alert('Failed to delete post.');
        }
    } catch (e) {
        console.error(e);
        alert('Error deleting post.');
    }
}
