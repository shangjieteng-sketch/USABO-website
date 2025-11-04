const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const router = express.Router();

// In-memory user storage (replace with database in production)
const users = [];

// Configure Passport strategies only if environment variables are set
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback"
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            // Check if user already exists
            let user = users.find(user => user.googleId === profile.id);
            
            if (user) {
                return done(null, user);
            }
            
            // Create new user
            user = {
                id: users.length + 1,
                googleId: profile.id,
                name: profile.displayName,
                email: profile.emails[0].value,
                avatar: profile.photos[0].value,
                provider: 'google',
                createdAt: new Date()
            };
            
            users.push(user);
            return done(null, user);
        } catch (error) {
            return done(error, null);
        }
    }));
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(new GitHubStrategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: "/api/auth/github/callback"
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            // Check if user already exists
            let user = users.find(user => user.githubId === profile.id);
            
            if (user) {
                return done(null, user);
            }
            
            // Create new user
            user = {
                id: users.length + 1,
                githubId: profile.id,
                name: profile.displayName || profile.username,
                email: profile.emails ? profile.emails[0].value : `${profile.username}@github.local`,
                avatar: profile.photos[0].value,
                provider: 'github',
                createdAt: new Date()
            };
            
            users.push(user);
            return done(null, user);
        } catch (error) {
            return done(error, null);
        }
    }));
}

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    const user = users.find(user => user.id === id);
    done(null, user);
});

// Register endpoint
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Basic email validation
        if (!email || !email.includes('@')) {
            return res.status(400).json({ message: 'Please provide a valid email address' });
        }
        
        // Check if user already exists
        const existingUser = users.find(user => user.email === email);
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user
        const user = {
            id: users.length + 1,
            name,
            email,
            password: hashedPassword,
            createdAt: new Date()
        };
        
        users.push(user);
        
        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '7d' }
        );
        
        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user
        const user = users.find(user => user.email === email);
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '7d' }
        );
        
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Get current user
router.get('/me', authenticateToken, (req, res) => {
    const user = users.find(user => user.id === req.userId);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
        id: user.id,
        name: user.name,
        email: user.email
    });
});

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        req.userId = decoded.userId;
        req.userEmail = decoded.email;
        next();
    });
}

// Google OAuth routes (only if configured)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

    router.get('/google/callback', 
        passport.authenticate('google', { session: false }),
        (req, res) => {
            // Generate JWT token
            const token = jwt.sign(
                { userId: req.user.id, email: req.user.email },
                process.env.JWT_SECRET || 'fallback_secret',
                { expiresIn: '7d' }
            );
            
            // Redirect to frontend with token
            res.redirect(`/?token=${token}&user=${encodeURIComponent(JSON.stringify({
                id: req.user.id,
                name: req.user.name,
                email: req.user.email,
                avatar: req.user.avatar
            }))}`);
        }
    );
} else {
    // Fallback route when Google OAuth is not configured
    router.get('/google', (req, res) => {
        res.status(501).json({ message: 'Google OAuth not configured' });
    });
}

// GitHub OAuth routes (only if configured)
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

    router.get('/github/callback',
        passport.authenticate('github', { session: false }),
        (req, res) => {
            // Generate JWT token
            const token = jwt.sign(
                { userId: req.user.id, email: req.user.email },
                process.env.JWT_SECRET || 'fallback_secret',
                { expiresIn: '7d' }
            );
            
            // Redirect to frontend with token
            res.redirect(`/?token=${token}&user=${encodeURIComponent(JSON.stringify({
                id: req.user.id,
                name: req.user.name,
                email: req.user.email,
                avatar: req.user.avatar
            }))}`);
        }
    );
} else {
    // Fallback route when GitHub OAuth is not configured
    router.get('/github', (req, res) => {
        res.status(501).json({ message: 'GitHub OAuth not configured' });
    });
}

// Check which OAuth providers are configured
router.get('/config', (req, res) => {
    res.json({
        google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        github: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET)
    });
});

// Debug endpoint to see registered users (remove in production)
router.get('/users', (req, res) => {
    const sanitizedUsers = users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
    }));
    res.json(sanitizedUsers);
});

module.exports = router;