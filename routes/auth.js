const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');
const router = express.Router();

// Environment validation
function validateEnvironment() {
    if (!process.env.JWT_SECRET) {
        console.error('WARNING: JWT_SECRET not set in environment variables');
        process.exit(1);
    }
}

// Configure Passport strategies only if environment variables are set
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3002/api/auth/google/callback"
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            // Check if user already exists
            let user = await User.findByGoogleId(profile.id);
            
            if (user) {
                return done(null, user);
            }
            
            // Create new user
            user = await User.create({
                name: profile.displayName,
                email: profile.emails[0].value,
                googleId: profile.id,
                avatar: profile.photos[0].value,
                provider: 'google'
            });
            
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
        callbackURL: process.env.GITHUB_CALLBACK_URL || "http://localhost:3002/api/auth/github/callback"
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            // Check if user already exists
            let user = await User.findByGithubId(profile.id);
            
            if (user) {
                return done(null, user);
            }
            
            // Create new user
            user = await User.create({
                name: profile.displayName || profile.username,
                email: profile.emails ? profile.emails[0].value : `${profile.username}@github.local`,
                githubId: profile.id,
                avatar: profile.photos[0].value,
                provider: 'github'
            });
            
            return done(null, user);
        } catch (error) {
            return done(error, null);
        }
    }));
}

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// Validate environment on load
validateEnvironment();

// Register endpoint
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required' });
        }
        
        if (!email.includes('@')) {
            return res.status(400).json({ message: 'Please provide a valid email address' });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }
        
        // Check if user already exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            provider: 'local'
        });
        
        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
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
        
        // Validation
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        
        // Find user
        const user = await User.findByEmail(email);
        if (!user || !user.password) {
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
            process.env.JWT_SECRET,
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
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            provider: user.provider
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
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
                process.env.JWT_SECRET,
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
                process.env.JWT_SECRET,
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
router.get('/users', async (req, res) => {
    try {
        const users = await User.getAll();
        res.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;