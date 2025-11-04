// Initialize Socket.IO
console.log('app.js loaded');
let socket;
try {
    socket = io();
    console.log('Socket.IO initialized');
} catch (error) {
    console.error('Socket.IO failed to initialize:', error);
}

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
const registerModal = document.getElementById('registerModal');
const loginBtn = document.getElementById('loginBtn');
const closeModal = document.querySelector('.close');
const closeRegister = document.getElementById('closeRegister');
const registerLink = document.getElementById('registerLink');
const loginLink = document.getElementById('loginLink');


if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        if (loginModal) loginModal.style.display = 'block';
    });
}

if (registerLink) {
    registerLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (loginModal) loginModal.style.display = 'none';
        if (registerModal) registerModal.style.display = 'block';
    });
}

if (loginLink) {
    loginLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (registerModal) registerModal.style.display = 'none';
        if (loginModal) loginModal.style.display = 'block';
    });
}

if (closeModal) {
    closeModal.addEventListener('click', () => {
        if (loginModal) loginModal.style.display = 'none';
    });
}

if (closeRegister) {
    closeRegister.addEventListener('click', () => {
        if (registerModal) registerModal.style.display = 'none';
    });
}

window.addEventListener('click', (e) => {
    if (loginModal && e.target === loginModal) {
        loginModal.style.display = 'none';
    }
    if (registerModal && e.target === registerModal) {
        registerModal.style.display = 'none';
    }
});

// Login form submission  
const loginForm = document.getElementById('loginForm');
console.log('Login form found:', !!loginForm);

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Login form submitted');
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    console.log('Login attempt:', { email, password: '***' });
    
    try {
        console.log('Making fetch request to /api/auth/login');
        const response = await fetch(`${window.location.origin}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);
        
        if (response.ok) {
            console.log('Login successful, storing tokens');
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            loginModal.style.display = 'none';
            updateUIForLoggedInUser(data.user);
            alert('Login successful!');
        } else {
            console.error('Login failed:', data.message);
            alert(data.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
    });
}

// Register form submission
const registerForm = document.getElementById('registerForm');
console.log('Register form found:', !!registerForm);

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Register form submitted');
    
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    
    // Validate passwords match
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }
    
    // Basic email validation
    if (!email.includes('@') || !email.includes('.')) {
        alert('Please enter a valid email address');
        return;
    }
    
    try {
        const response = await fetch(`${window.location.origin}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            registerModal.style.display = 'none';
            updateUIForLoggedInUser(data.user);
            alert('Registration successful! Welcome to USABO Study Platform.');
        } else {
            alert(data.message || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed. Please try again.');
    }
    });
}

// Update UI for logged in user
function updateUIForLoggedInUser(user) {
    if (user.avatar) {
        // Show avatar for OAuth users
        loginBtn.innerHTML = `
            <img src="${user.avatar}" alt="Profile" style="width: 24px; height: 24px; border-radius: 50%; margin-right: 8px;">
            ${user.name}
        `;
    } else {
        loginBtn.textContent = `Welcome, ${user.name}`;
    }
    loginBtn.style.background = '#27ae60';
    loginBtn.style.display = 'flex';
    loginBtn.style.alignItems = 'center';
    
    // Enable chat functionality
    enableChatFeatures();
}

// Chat functionality
let currentUser = null;

function enableChatFeatures() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        currentUser = user;
        if (socket) {
            socket.emit('join-room', 'general');
        }
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
        
        if (socket) {
            socket.emit('chat-message', messageData);
        }
        input.value = '';
    }
}

// Receive chat messages
if (socket) {
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
}

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
        const response = await fetch(`${window.location.origin}/api/ai/chat`, {
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

// Check OAuth configuration and hide buttons if not configured
async function checkOAuthConfig() {
    try {
        const response = await fetch(`${window.location.origin}/api/auth/config`);
        const config = await response.json();
        
        // Hide OAuth buttons if not configured
        const oauthButtons = document.querySelectorAll('.oauth-buttons');
        const dividers = document.querySelectorAll('.divider');
        
        if (!config.google && !config.github) {
            // Hide all OAuth sections if no providers are configured
            oauthButtons.forEach(section => section.style.display = 'none');
            dividers.forEach(divider => divider.style.display = 'none');
        } else {
            // Hide individual buttons for unconfigured providers
            if (!config.google) {
                document.querySelectorAll('.google-btn').forEach(btn => btn.style.display = 'none');
            }
            if (!config.github) {
                document.querySelectorAll('.github-btn').forEach(btn => btn.style.display = 'none');
            }
        }
    } catch (error) {
        console.error('Error checking OAuth config:', error);
        // Hide OAuth buttons on error
        document.querySelectorAll('.oauth-buttons').forEach(section => section.style.display = 'none');
        document.querySelectorAll('.divider').forEach(divider => divider.style.display = 'none');
    }
}

// DOM Ready check
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded');
    console.log('Login form available:', !!document.getElementById('loginForm'));
    console.log('Register form available:', !!document.getElementById('registerForm'));
    console.log('Login button available:', !!document.getElementById('loginBtn'));
});

// Check if user is already logged in
window.addEventListener('load', async () => {
    console.log('Window loaded');
    // Check OAuth configuration first
    await checkOAuthConfig();
    // Check for OAuth redirect with token in URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userParam = urlParams.get('user');
    
    if (token && userParam) {
        // Store OAuth login data
        localStorage.setItem('token', token);
        localStorage.setItem('user', userParam);
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Update UI
        const userData = JSON.parse(decodeURIComponent(userParam));
        updateUIForLoggedInUser(userData);
    } else {
        // Check for existing login
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (storedToken && storedUser) {
            const userData = JSON.parse(storedUser);
            updateUIForLoggedInUser(userData);
        }
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

// Textbook functionality
async function studyChapter(chapterTitle) {
    try {
        const response = await fetch(`${window.location.origin}/api/textbook/chapters`);
        const data = await response.json();
        
        const chapter = data.chapters.find(ch => ch.title === chapterTitle);
        if (chapter) {
            const detailResponse = await fetch(`${window.location.origin}/api/textbook/chapters/${chapter.id}`);
            const chapterData = await detailResponse.json();
            
            showChapterModal(chapterData);
        }
    } catch (error) {
        console.error('Error loading chapter:', error);
        alert('Failed to load chapter. Please try again.');
    }
}

function showChapterModal(chapter) {
    const modalHtml = `
        <div id="chapterModal" class="modal" style="display: block;">
            <div class="modal-content" style="max-width: 800px; max-height: 80vh; overflow-y: auto;">
                <span class="close" onclick="closeChapterModal()">&times;</span>
                <h2>${chapter.icon} ${chapter.title}</h2>
                <p>${chapter.description}</p>
                <div class="chapter-sections">
                    ${chapter.sections.map(section => `
                        <div class="section-item" style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
                            <h3>${section.title}</h3>
                            <p>${section.content}</p>
                            <div class="diagrams">
                                ${section.diagrams.map(diagram => `
                                    <div class="diagram-placeholder" style="margin: 10px 0; padding: 20px; background: #f5f5f5; border-radius: 4px; text-align: center;">
                                        <strong>${diagram.title}</strong><br>
                                        <em>Type: ${diagram.type}</em><br>
                                        <small>Diagram placeholder - will be replaced with actual molecular diagrams</small>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function closeChapterModal() {
    const modal = document.getElementById('chapterModal');
    if (modal) {
        modal.remove();
    }
}

// Add click handlers for textbook Study Chapter buttons
document.addEventListener('click', (e) => {
    if (e.target.textContent === 'Study Chapter') {
        const chapterTitle = e.target.parentElement.querySelector('h3').textContent;
        studyChapter(chapterTitle);
    }
});