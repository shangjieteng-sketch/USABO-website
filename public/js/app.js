// Initialize Socket.IO
const socket = io();

// Navigation functionality
function navigateToSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    document.getElementById(sectionId).classList.add('active');
    
    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Scroll to top
    window.scrollTo(0, 0);
}

// Handle navigation clicks
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionId = link.getAttribute('href').substring(1);
        navigateToSection(sectionId);
    });
});

// Modal functionality
const loginModal = document.getElementById('loginModal');
const loginBtn = document.getElementById('loginBtn');
const closeModal = document.querySelector('.close');

loginBtn.addEventListener('click', () => {
    loginModal.style.display = 'block';
});

closeModal.addEventListener('click', () => {
    loginModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === loginModal) {
        loginModal.style.display = 'none';
    }
});

// Login form submission
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            loginModal.style.display = 'none';
            updateUIForLoggedInUser(data.user);
        } else {
            alert(data.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
});

// Update UI for logged in user
function updateUIForLoggedInUser(user) {
    loginBtn.textContent = `Welcome, ${user.name}`;
    loginBtn.style.background = '#27ae60';
    
    // Enable chat functionality
    enableChatFeatures();
}

// Chat functionality
let currentUser = null;

function enableChatFeatures() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        currentUser = user;
        socket.emit('join-room', 'general');
    }
}

// Chat message sending
document.getElementById('sendMessage').addEventListener('click', sendChatMessage);
document.getElementById('chatInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendChatMessage();
    }
});

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (message && currentUser) {
        const messageData = {
            room: 'general',
            message: message,
            user: currentUser.name,
            timestamp: new Date().toLocaleTimeString()
        };
        
        socket.emit('chat-message', messageData);
        input.value = '';
    }
}

// Receive chat messages
socket.on('chat-message', (data) => {
    const chatMessages = document.getElementById('chatMessages');
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message';
    messageElement.innerHTML = `
        <strong>${data.user}</strong> <span class="timestamp">${data.timestamp}</span><br>
        ${data.message}
    `;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
});

// AI Chat functionality
document.getElementById('sendAiMessage').addEventListener('click', sendAiMessage);
document.getElementById('aiInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendAiMessage();
    }
});

async function sendAiMessage() {
    const input = document.getElementById('aiInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message to chat
    addAiMessage(message, 'user');
    input.value = '';
    
    // Add loading message
    const loadingId = addAiMessage('Thinking...', 'ai');
    
    try {
        const response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ message })
        });
        
        const data = await response.json();
        
        // Replace loading message with actual response
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) {
            loadingElement.innerHTML = `<strong>AI:</strong> ${data.response}`;
        }
        
    } catch (error) {
        console.error('AI chat error:', error);
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) {
            loadingElement.innerHTML = '<strong>AI:</strong> Sorry, I encountered an error. Please try again.';
        }
    }
}

function addAiMessage(message, sender) {
    const chatMessages = document.getElementById('aiChatMessages');
    const messageElement = document.createElement('div');
    const messageId = 'msg-' + Date.now();
    messageElement.id = messageId;
    messageElement.className = `ai-message ${sender}`;
    
    if (sender === 'user') {
        messageElement.innerHTML = `<strong>You:</strong> ${message}`;
    } else {
        messageElement.innerHTML = `<strong>AI:</strong> ${message}`;
    }
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return messageId;
}

// Experiment category tabs
document.querySelectorAll('.category-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        // Remove active class from all tabs
        document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
        // Add active class to clicked tab
        tab.classList.add('active');
        
        // Here you would filter experiments based on category
        // For now, we'll just show all experiments
    });
});

// Memory Cards functionality
function startMemoryCards() {
    alert('Memory Cards feature will be implemented with Quizlet-style functionality. See documentation for details.');
}

// Check if user is already logged in
window.addEventListener('load', () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        const userData = JSON.parse(user);
        updateUIForLoggedInUser(userData);
    }
});

// Virtual experiment simulations (placeholder)
function startSimulation(experimentType) {
    alert(`Starting ${experimentType} simulation. This would open an interactive virtual lab.`);
}

// Add click handlers for experiment buttons
document.addEventListener('click', (e) => {
    if (e.target.textContent === 'Start Simulation') {
        const experimentName = e.target.parentElement.querySelector('h3').textContent;
        startSimulation(experimentName);
    }
});

// Problem set functionality (placeholder)
function browseProblemSet(type) {
    alert(`Opening ${type} problem set. This would navigate to a dedicated problem interface.`);
}

// Add click handlers for problem set buttons
document.addEventListener('click', (e) => {
    if (e.target.textContent === 'Browse' || e.target.textContent === 'Practice' || e.target.textContent === 'Generate') {
        const problemType = e.target.parentElement.querySelector('h3').textContent;
        browseProblemSet(problemType);
    }
});