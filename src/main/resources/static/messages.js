// messages.js

let currentClientId = null;
let currentClientName = "";
let chatInterval = null;
const myUserId = localStorage.getItem('userId');
const trainerEmail = localStorage.getItem('userEmail');

document.addEventListener('DOMContentLoaded', () => {
    if (!myUserId || !trainerEmail) {
        window.location.href = "login.html";
        return;
    }
    fetchContacts();

    // Allow Enter key to send messages
    const input = document.getElementById('chatInput');
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }
});

async function fetchContacts() {
    const list = document.getElementById('contactsList');
    try {
        const response = await fetch(`/api/trainers/clients?trainerEmail=${trainerEmail}`);
        if (response.ok) {
            const clients = await response.json();
            if (clients.length === 0) {
                list.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">No clients available.</div>';
                return;
            }

            list.innerHTML = clients.map(client => `
                <div class="contact-item" id="client-${client.id}" onclick="selectConversation(${client.id}, '${client.name}')">
                    <div class="contact-avatar">${getInitials(client.name)}</div>
                    <div class="contact-info">
                        <span class="contact-name">${client.name}</span>
                        <span class="contact-last-msg">${client.goal || 'No message yet'}</span>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error("Error fetching contacts:", error);
        list.innerHTML = '<div style="text-align: center; padding: 40px; color: #ff4040;">Failed to load contacts.</div>';
    }
}

function selectConversation(clientId, clientName) {
    currentClientId = clientId;
    currentClientName = clientName;

    // UI Updates
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('activeChat').style.display = 'flex';
    document.getElementById('activeContactName').textContent = clientName;
    document.getElementById('activeContactAvatar').textContent = getInitials(clientName);

    // Highlight active contact
    document.querySelectorAll('.contact-item').forEach(el => el.classList.remove('active'));
    document.getElementById(`client-${clientId}`).classList.add('active');

    fetchMessages();

    // Set up polling
    if (chatInterval) clearInterval(chatInterval);
    chatInterval = setInterval(fetchMessages, 3000);
}

async function fetchMessages() {
    if (!currentClientId) return;

    try {
        const response = await fetch(`/api/messages/conversation?u1=${myUserId}&u2=${currentClientId}`);
        if (response.ok) {
            const msgs = await response.json();
            renderMessages(msgs);
        }
    } catch (e) {
        console.error("Error fetching messages:", e);
    }
}

function renderMessages(msgs) {
    const box = document.getElementById('chatMessages');
    const isAtBottom = box.scrollHeight - box.scrollTop <= box.clientHeight + 50;

    box.innerHTML = msgs.map(m => `
        <div class="message-bubble ${m.senderId == myUserId ? 'sent' : 'received'}">
            ${m.content}
            <span class="message-time">${formatTime(m.timestamp)}</span>
        </div>
    `).join('');

    if (isAtBottom) {
        box.scrollTop = box.scrollHeight;
    }
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const content = input.value.trim();
    if (!content || !currentClientId) return;

    const msgData = {
        senderId: myUserId,
        receiverId: currentClientId,
        content: content
    };

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
    } catch (e) {
        console.error("Error sending message:", e);
    }
}

function getInitials(name) {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

function formatTime(timestamp) {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
