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

// Global Image Error Handler to prevent inline JS issues
window.handleImageError = function (img) {
    img.onerror = null; // Prevent infinite loop
    img.src = 'https://images.unsplash.com/photo-1505751172569-e910a227e9fa?auto=format&fit=crop&q=80&w=800'; // Relaxing nature fallback
};

async function fetchPosts(type = 'all') {
    // console.log("DEBUG: fetchPosts called with type:", type);
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
        let posts = [];
        if (response.ok) {
            posts = await response.json();
        }

        // --- INJECT MOCK DATA FOR DEMO ---
        // Only inject if viewing 'all' or 'ARTICLE' and list is small
        if (type === 'all' || type === 'ARTICLE') {
            const mockPosts = [
                {
                    id: 901,
                    title: "The Science of Sleep: Why It Matters",
                    imageUrl: "https://images.unsplash.com/photo-1511295742362-92c96b504802?auto=format&fit=crop&q=80&w=800",
                    category: "Mental Wellness",
                    content: "Quality sleep is the foundation of good health. Learn how circadian rhythms affect your energy, recovery, and overall well-being in this deep dive into sleep science.",
                    authorName: "Dr. Sarah Sleep",
                    likesCount: 124,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 902,
                    title: "Hydration Hacks for Peak Performance",
                    imageUrl: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&q=80&w=800",
                    category: "Nutrition",
                    content: "Water is life. Discover simple strategies to stay hydrated throughout the day, boost your workouts, and improve cognitive function.",
                    authorName: "Coach Mike",
                    likesCount: 89,
                    createdAt: new Date(Date.now() - 86400000).toISOString()
                },
                {
                    id: 903,
                    title: "Mindfulness for Busy Professionals",
                    imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800",
                    category: "Mental Wellness",
                    content: "Stressed at work? Just 5 minutes of mindfulness can reset your day. Here are three simple techniques you can do right at your desk.",
                    authorName: "Zen Master",
                    likesCount: 205,
                    createdAt: new Date(Date.now() - 172800000).toISOString()
                },
                {
                    id: 904,
                    title: "Superfoods: Fact vs. Fiction",
                    imageUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=800",
                    category: "Nutrition",
                    content: "Are kale and quinoa really magic? We debunk common superfood myths and tell you which nutrient-dense foods are actually worth adding to your plate.",
                    authorName: "Nutritionist Jane",
                    likesCount: 156,
                    createdAt: new Date(Date.now() - 259200000).toISOString()
                },
                {
                    id: 905,
                    title: "Strength Training 101",
                    imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=800",
                    category: "Fitness",
                    content: "Lifting weights isn't just for bodybuilders. It builds bone density, boosts metabolism, and improves functional movement. Start your journey today.",
                    authorName: "Fit Fam",
                    likesCount: 98,
                    createdAt: new Date(Date.now() - 345600000).toISOString()
                },
                {
                    id: 906,
                    title: "Yoga for Flexibility and Balance",
                    imageUrl: "https://images.unsplash.com/photo-1599447421404-5e1905b060d2?auto=format&fit=crop&q=80&w=800",
                    category: "Fitness",
                    content: "Improve your range of motion and prevent injuries with these essential yoga poses suitable for beginners and athletes alike.",
                    authorName: "Yogi Clara",
                    likesCount: 112,
                    createdAt: new Date(Date.now() - 432000000).toISOString()
                },
                {
                    id: 907,
                    title: "Plant-Based Protein Guide",
                    imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800",
                    category: "Nutrition",
                    content: "Thinking of going plant-based? Here is how to get enough protein without meat, featuring lentils, chickpeas, tofu, and more.",
                    authorName: "Green Chef",
                    likesCount: 76,
                    createdAt: new Date(Date.now() - 518400000).toISOString()
                },
                {
                    id: 908,
                    title: "The Benefits of Morning Cardio",
                    imageUrl: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&q=80&w=800",
                    category: "Fitness",
                    content: "Kickstart your metabolism and boost your mood by incorporating a light cardio session into your morning routine.",
                    authorName: "Run Club",
                    likesCount: 134,
                    createdAt: new Date(Date.now() - 604800000).toISOString()
                }
            ];
            // Prepend mock posts to existing posts
            posts = [...mockPosts, ...posts];
        }
        // ---------------------------------

        renderPosts(posts);

    } catch (error) {
        console.error('Error fetching posts:', error);
        postsList.innerHTML = '<p style="text-align:center; color:red;">Failed to load posts.</p>';
    }
}

async function fetchTrainerHistory() {
    const postsList = document.getElementById('postsList');
    const userEmail = localStorage.getItem('userEmail');
    const trainerId = localStorage.getItem('trainerId');

    if (!trainerId) {
        postsList.innerHTML = '<p style="text-align:center; color:#666; padding: 40px;">You are not enrolled with any trainer yet.</p>';
        return;
    }

    try {
        const response = await fetch(`/api/trainers/${trainerId}`);
        if (response.ok) {
            const trainer = await response.json();
            renderTrainerHistory([trainer]); // Wrapped in array to match list style
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
            <div class="post-avatar" style="width: 80px; height: 80px; font-size: 32px; border-width: 2px;">${initials}</div>
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
            localStorage.removeItem('trainerId'); // Clear from local storage
            alert(`You have successfully cancelled your enrollment with ${trainerName}.`);
            fetchPosts('TRAINER_HISTORY'); // Refresh view
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
        // Generate Initials
        const initials = post.authorName ? post.authorName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'U';

        // Format Date
        const date = new Date(post.createdAt).toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric'
        });

        // Image HTML (Always show image, use placeholder if missing)
        // If post has no image, use a random gradient or placeholder for aesthetic consistency in grid
        let imgUrl = post.imageUrl;
        if (!imgUrl) {
            // Default placeholders based on category if available, else generic
            if (post.category === 'Nutrition') imgUrl = 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=800';
            else if (post.category === 'Fitness') imgUrl = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800';
            else if (post.category === 'Mental Wellness') imgUrl = 'https://images.unsplash.com/photo-1544367563-121910aa662f?auto=format&fit=crop&q=80&w=800';
            else imgUrl = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800'; // General
        }

        const imageHtml = `<img src="${imgUrl}" class="post-cover-img" alt="${escapeHtml(post.title)}" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800';">`;

        card.innerHTML = `
            ${imageHtml}
            <div class="post-content-wrap">
                <div class="post-meta">
                    <div class="post-avatar">${initials}</div>
                    <div class="post-author">${escapeHtml(post.authorName) || 'Unknown User'}</div>
                    <div class="post-category">${escapeHtml(post.category) || 'General'}</div>
                </div>
                <h3 class="post-title">${escapeHtml(post.title)}</h3>
                <div class="post-excerpt">${escapeHtml(post.content)}</div>
                <div class="post-meta" style="font-size: 11px; margin-bottom:0;">${date}</div>
            </div>
            
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
                <!-- Delete Button -->
                <div class="action-item delete-btn" style="color: #ff4d4d; display: none;" data-author="${post.authorName}" onclick="deletePost(${post.id})">
                    <span>🗑</span> Delete
                </div>
                 <!-- Edit Button -->
                <div class="action-item edit-btn" style="color: #4da6ff; display: none;" data-author="${post.authorName}" onclick='openEditModal(${JSON.stringify(post).replace(/'/g, "&#39;")})'>
                    <span>✎</span> Edit
                </div>
            </div>
            
            <div class="comments-section" id="comments-${post.id}" style="margin: 0 20px 20px 20px; border-top: none; padding-top: 0;">
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
        // Handle mock data where post.id > 900 (assuming valid DB IDs are smaller or UUIDs)
        // For now, only show edit/delete for non-mock user posts
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
