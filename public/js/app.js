// Initialize Socket.IO (only if available)
let socket;
try {
    if (typeof io !== 'undefined') {
        socket = io();
    } else {
        console.log('Socket.IO not available in serverless environment');
    }
} catch (error) {
    console.error('Socket.IO failed to initialize:', error);
}

// Helper function for safe element access
function safeGetElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.log(`Element with id '${id}' not found`);
    }
    return element;
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

// Modal functionality (with null checks)
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

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch(`${window.location.origin}/api/auth/login`, {
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
}

// Register form submission
const registerForm = document.getElementById('registerForm');

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
    
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
            // Success message removed for cleaner UX
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
    // Update dashboard user profile
    updateDashboardProfile(user);
    
    // Enable chat functionality
    enableChatFeatures();
    
    // Update login button to show user name and make it clickable to dashboard
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        if (user.avatar) {
            // Show avatar for OAuth users
            loginBtn.innerHTML = `
                <img src="${user.avatar}" alt="Profile" style="width: 24px; height: 24px; border-radius: 50%; margin-right: 8px;">
                ${user.name}
            `;
        } else {
            loginBtn.innerHTML = `
                <i class="fas fa-user" style="margin-right: 8px;"></i>
                ${user.name}
            `;
        }
        
        loginBtn.style.background = '#27ae60';
        loginBtn.style.display = 'flex';
        loginBtn.style.alignItems = 'center';
        loginBtn.style.cursor = 'pointer';
        
        // Make username clickable to access dashboard
        loginBtn.onclick = () => navigateToSection('dashboard');
        loginBtn.title = 'Click to access dashboard';
    }
}

// Update dashboard user profile
function updateDashboardProfile(user) {
    const userProfile = document.getElementById('userProfile');
    if (userProfile) {
        const userName = userProfile.querySelector('.user-name');
        const userEmail = userProfile.querySelector('.user-email');
        const userAvatar = userProfile.querySelector('.user-avatar');
        
        if (userName) userName.textContent = user.name;
        if (userEmail) userEmail.textContent = user.email;
        
        if (user.avatar && userAvatar) {
            userAvatar.innerHTML = `<img src="${user.avatar}" alt="Profile" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        }
    }
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

// Chat message sending (only if elements exist)
const sendMessageBtn = document.getElementById('sendMessage');
const chatInput = document.getElementById('chatInput');

if (sendMessageBtn) {
    sendMessageBtn.addEventListener('click', sendChatMessage);
}

if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    });
}

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
// AI chat functionality (with null checks)
const sendAiMessageBtn = document.getElementById('sendAiMessage');
const aiInput = document.getElementById('aiInput');

if (sendAiMessageBtn) {
    sendAiMessageBtn.addEventListener('click', sendAiMessage);
}

if (aiInput) {
    aiInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendAiMessage();
        }
    });
}

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

// Check if user is already logged in
window.addEventListener('load', async () => {
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
                <span class="close" data-close-modal="chapter">&times;</span>
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

// Dashboard Navigation
function initializeDashboardNavigation() {
    // Dashboard sidebar navigation
    document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all sidebar links
            document.querySelectorAll('.sidebar-nav .nav-link').forEach(l => l.classList.remove('active'));
            // Add active class to clicked link
            link.classList.add('active');
            
            // Hide all dashboard sections
            document.querySelectorAll('.dashboard-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Show target dashboard section
            const targetSection = link.getAttribute('data-section');
            const section = document.getElementById(targetSection);
            if (section) {
                section.classList.add('active');
            }
        });
    });
    
    // Back to home button
    const backToHome = document.getElementById('backToHome');
    if (backToHome) {
        backToHome.addEventListener('click', () => {
            navigateToSection('home');
        });
    }
    
    // Sidebar toggle for mobile
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.dashboard-sidebar');
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }
    
    // Sidebar minimize functionality
    const sidebarMinimize = document.getElementById('sidebarMinimize');
    const dashboardLayout = document.querySelector('.dashboard-layout');
    if (sidebarMinimize && sidebar && dashboardLayout) {
        sidebarMinimize.addEventListener('click', () => {
            sidebar.classList.toggle('minimized');
            dashboardLayout.classList.toggle('sidebar-minimized');
            
            // Store the minimized state in localStorage
            const isMinimized = sidebar.classList.contains('minimized');
            localStorage.setItem('sidebarMinimized', isMinimized);
        });
        
        // Restore minimized state from localStorage
        const savedState = localStorage.getItem('sidebarMinimized');
        if (savedState === 'true') {
            sidebar.classList.add('minimized');
            dashboardLayout.classList.add('sidebar-minimized');
        }
    }
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 1024) {
            const sidebar = document.querySelector('.dashboard-sidebar');
            const sidebarToggle = document.getElementById('sidebarToggle');
            
            if (sidebar && sidebarToggle && 
                !sidebar.contains(e.target) && 
                !sidebarToggle.contains(e.target) &&
                sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
            }
        }
    });
}

// Global logout function
window.handleLogout = function() {
    // Clear stored user data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Reset UI
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.textContent = 'Login';
        loginBtn.style.background = '';
        loginBtn.onclick = () => {
            const loginModal = document.getElementById('loginModal');
            if (loginModal) loginModal.style.display = 'block';
        };
    }
    
    // Navigate back to home
    navigateToSection('home');
    
    // Reset current user
    currentUser = null;
    
    alert('Logged out successfully');
}

// Load Campbell Biology PowerPoint files
async function loadCampbellPPT() {
    try {
        console.log('Loading Campbell PPT files...');
        const response = await fetch(`${window.location.origin}/api/textbook/campbell-ppt`);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Campbell data received:', data);
        
        const list = document.getElementById('campbellPptList');
        if (list && data.files) {
            console.log('Rendering', data.files.length, 'Campbell chapters');
            list.innerHTML = data.files.map((file, index) => `
                <div class="ppt-chapter-item" data-url="${encodeURIComponent(file.downloadUrl || file.filename || '')}" data-title="${file.title.replace(/"/g, '&quot;')}" data-chapter="${file.chapter}">
                    <div class="chapter-number">${file.chapter}</div>
                    <div class="chapter-content">
                        <h4>${file.title}</h4>
                        <p>Campbell Biology - Chapter ${file.chapter}</p>
                    </div>
                    <div class="chapter-actions">
                        <button class="preview-btn">
                            <i class="fas fa-eye"></i> Preview
                        </button>
                        <a href="${file.downloadUrl}" download class="download-link">
                            <i class="fas fa-download"></i>
                        </a>
                    </div>
                </div>
            `).join('');
            
            // Add event delegation for Campbell PPT items
            list.addEventListener('click', (e) => {
                const pptItem = e.target.closest('.ppt-chapter-item');
                const downloadLink = e.target.closest('.download-link');
                
                if (downloadLink) {
                    // Let the download link work normally, don't prevent default
                    return;
                }
                
                if (pptItem) {
                    const url = decodeURIComponent(pptItem.dataset.url);
                    const title = pptItem.dataset.title;
                    const chapter = parseInt(pptItem.dataset.chapter);
                    previewPPT(encodeURIComponent(url), title, chapter);
                }
            });
        }
    } catch (error) {
        console.error('Error loading Campbell PPT files:', error);
        const list = document.getElementById('campbellPptList');
        if (list) {
            list.innerHTML = '<div class="error">Failed to load PowerPoint files</div>';
        }
    }
}

// Preview PowerPoint function
function previewPPT(encodedUrl, title, chapter) {
    const downloadUrl = decodeURIComponent(encodedUrl);
    console.log('Opening preview for:', downloadUrl, title, chapter);
    
    // Extract filename from URL for display
    const filename = downloadUrl.includes('/') ? 
        downloadUrl.split('/').pop() : 
        `Chapter_${chapter.toString().padStart(2, '0')}_${title.replace(/\s+/g, '_')}.ppt`;
    
    const modalHtml = `
        <div id="pptModal" class="modal" style="display: block;">
            <div class="modal-content ppt-modal-content">
                <span class="close" data-close-modal="ppt">&times;</span>
                <h2>📊 Chapter ${chapter}: ${title}</h2>
                <div class="ppt-preview-container">
                    <div class="ppt-preview-notice">
                        <i class="fas fa-file-powerpoint" style="color: #d35400;"></i>
                        <p>PowerPoint Presentation</p>
                        <p class="preview-text">Campbell Biology Chapter ${chapter} - ${title}</p>
                        <p class="preview-text">This PowerPoint presentation contains detailed slides covering the chapter content.</p>
                        <div class="preview-actions">
                            <a href="${downloadUrl}" download="${filename}" class="download-btn-large">
                                <i class="fas fa-download"></i> Download PPT File
                            </a>
                            <button class="close-btn" data-close-modal="ppt">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function closePPTModal() {
    const modal = document.getElementById('pptModal');
    if (modal) {
        modal.remove();
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initializeDashboardNavigation();
    loadCampbellPPT();
    
    // Handle OAuth callback if present
    handleAuthCallback();
    
    // Add login button event listeners
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    const githubLoginBtn = document.getElementById('githubLoginBtn');
    
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', loginWithGoogle);
    }
    
    if (githubLoginBtn) {
        githubLoginBtn.addEventListener('click', loginWithGitHub);
    }
    
    // Add logout button event listener with delegation
    document.addEventListener('click', (e) => {
        if (e.target && (e.target.id === 'logoutBtn' || e.target.closest('#logoutBtn'))) {
            e.preventDefault();
            e.stopPropagation();
            handleLogout();
        }
    });
    
    // Global event delegation for close buttons
    document.addEventListener('click', (e) => {
        // Handle modal close buttons
        if (e.target.hasAttribute('data-close-modal')) {
            const modalType = e.target.getAttribute('data-close-modal');
            if (modalType === 'ppt') {
                closePPTModal();
            } else if (modalType === 'chapter') {
                closeChapterModal();
            }
        }
        
        // Handle notification close button
        if (e.target.classList.contains('notification-close')) {
            const notification = e.target.closest('.login-notification');
            if (notification) {
                notification.parentElement.remove();
            }
        }
    });
});

// OAuth Login Functions
function loginWithGoogle() {
    console.log('Redirecting to Google OAuth...');
    window.location.href = '/api/auth/google';
}

function loginWithGitHub() {
    console.log('Redirecting to GitHub OAuth...');
    window.location.href = '/api/auth/github';
}

// Handle OAuth callback tokens
function handleAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userParam = urlParams.get('user');
    
    if (token && userParam) {
        try {
            // Store token
            localStorage.setItem('authToken', token);
            
            // Parse user data
            const user = JSON.parse(decodeURIComponent(userParam));
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            console.log('Login successful:', user);
            
            // Clean URL and show success
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Show success message or update UI
            showLoginSuccess(user);
            
        } catch (error) {
            console.error('Error processing auth callback:', error);
        }
    }
}

function showLoginSuccess(user) {
    // Create a simple success notification
    const notification = document.createElement('div');
    notification.innerHTML = `
        <div class="login-notification" style="position: fixed; top: 20px; right: 20px; background: #28a745; color: white; padding: 15px 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 1000;">
            <strong>Login Successful!</strong><br>
            Welcome, ${user.name}!
            <button class="notification-close" style="background: none; border: none; color: white; float: right; font-size: 18px; cursor: pointer;">&times;</button>
        </div>
    `;
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}