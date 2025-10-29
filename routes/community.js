const express = require('express');
const router = express.Router();

// In-memory storage (replace with database in production)
let chatMessages = [];
let memoryCards = [];
let studyGroups = [];

// Chat endpoints
router.get('/chat/messages', (req, res) => {
    try {
        const { room = 'general', limit = 50 } = req.query;
        
        const roomMessages = chatMessages
            .filter(msg => msg.room === room)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, parseInt(limit))
            .reverse();
        
        res.json({
            messages: roomMessages,
            room: room,
            total: roomMessages.length
        });
    } catch (error) {
        console.error('Error fetching chat messages:', error);
        res.status(500).json({ message: 'Failed to fetch messages' });
    }
});

router.post('/chat/message', (req, res) => {
    try {
        const { room, message, userId, userName } = req.body;
        
        if (!message || !userId || !userName) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        
        // Content moderation (basic implementation)
        if (isInappropriateContent(message)) {
            return res.status(400).json({ message: 'Message contains inappropriate content' });
        }
        
        const newMessage = {
            id: Date.now().toString(),
            room: room || 'general',
            message: message,
            userId: userId,
            userName: userName,
            timestamp: new Date().toISOString(),
            edited: false,
            replies: []
        };
        
        chatMessages.push(newMessage);
        
        // Keep only last 1000 messages to prevent memory issues
        if (chatMessages.length > 1000) {
            chatMessages = chatMessages.slice(-1000);
        }
        
        res.status(201).json({
            message: newMessage,
            success: true
        });
    } catch (error) {
        console.error('Error posting message:', error);
        res.status(500).json({ message: 'Failed to post message' });
    }
});

// Memory Cards endpoints
router.get('/memory-cards', (req, res) => {
    try {
        const { category, difficulty, userId } = req.query;
        
        let filteredCards = memoryCards;
        
        if (category) {
            filteredCards = filteredCards.filter(card => card.category === category);
        }
        
        if (difficulty) {
            filteredCards = filteredCards.filter(card => card.difficulty === difficulty);
        }
        
        // Randomize card order for study sessions
        const shuffledCards = [...filteredCards].sort(() => Math.random() - 0.5);
        
        res.json({
            cards: shuffledCards,
            total: shuffledCards.length,
            categories: ['molecular_biology', 'cell_biology', 'plant_biology', 'animal_physiology', 'ecology', 'genetics'],
            difficulties: ['easy', 'medium', 'hard']
        });
    } catch (error) {
        console.error('Error fetching memory cards:', error);
        res.status(500).json({ message: 'Failed to fetch memory cards' });
    }
});

router.post('/memory-cards', (req, res) => {
    try {
        const { front, back, category, difficulty, userId } = req.body;
        
        if (!front || !back || !category || !userId) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        
        const newCard = {
            id: Date.now().toString(),
            front: front,
            back: back,
            category: category,
            difficulty: difficulty || 'medium',
            createdBy: userId,
            createdAt: new Date().toISOString(),
            studyCount: 0,
            correctCount: 0,
            tags: [],
            public: true
        };
        
        memoryCards.push(newCard);
        
        res.status(201).json({
            card: newCard,
            success: true
        });
    } catch (error) {
        console.error('Error creating memory card:', error);
        res.status(500).json({ message: 'Failed to create memory card' });
    }
});

// Memory card study session
router.post('/memory-cards/study-session', (req, res) => {
    try {
        const { cardIds, userId } = req.body;
        
        if (!cardIds || !Array.isArray(cardIds) || !userId) {
            return res.status(400).json({ message: 'Invalid request data' });
        }
        
        const sessionId = Date.now().toString();
        const sessionCards = cardIds.map(id => {
            const card = memoryCards.find(c => c.id === id);
            return card ? {
                ...card,
                shown: false,
                correct: null,
                timeSpent: 0
            } : null;
        }).filter(Boolean);
        
        // Store session data (in production, use proper session storage)
        const session = {
            id: sessionId,
            userId: userId,
            cards: sessionCards,
            currentIndex: 0,
            startTime: new Date().toISOString(),
            completed: false
        };
        
        res.json({
            sessionId: sessionId,
            totalCards: sessionCards.length,
            currentCard: sessionCards[0],
            message: 'Study session started'
        });
    } catch (error) {
        console.error('Error starting study session:', error);
        res.status(500).json({ message: 'Failed to start study session' });
    }
});

// Submit memory card answer
router.post('/memory-cards/answer', (req, res) => {
    try {
        const { sessionId, cardId, correct, timeSpent } = req.body;
        
        // In production, retrieve session from database
        // For now, just update the card statistics
        const card = memoryCards.find(c => c.id === cardId);
        if (card) {
            card.studyCount += 1;
            if (correct) {
                card.correctCount += 1;
            }
        }
        
        res.json({
            success: true,
            cardId: cardId,
            correct: correct,
            message: 'Answer recorded'
        });
    } catch (error) {
        console.error('Error recording answer:', error);
        res.status(500).json({ message: 'Failed to record answer' });
    }
});

// Study Groups endpoints
router.get('/study-groups', (req, res) => {
    try {
        const { subject, level } = req.query;
        
        let filteredGroups = studyGroups.filter(group => group.active);
        
        if (subject) {
            filteredGroups = filteredGroups.filter(group => 
                group.subjects.includes(subject)
            );
        }
        
        if (level) {
            filteredGroups = filteredGroups.filter(group => group.level === level);
        }
        
        const groupsWithMemberCount = filteredGroups.map(group => ({
            ...group,
            memberCount: group.members.length,
            members: undefined // Don't expose member details in list view
        }));
        
        res.json({
            groups: groupsWithMemberCount,
            total: groupsWithMemberCount.length,
            subjects: ['molecular_biology', 'cell_biology', 'plant_biology', 'animal_physiology', 'ecology', 'genetics'],
            levels: ['beginner', 'intermediate', 'advanced']
        });
    } catch (error) {
        console.error('Error fetching study groups:', error);
        res.status(500).json({ message: 'Failed to fetch study groups' });
    }
});

router.post('/study-groups', (req, res) => {
    try {
        const { name, description, subjects, level, maxMembers, userId, userName } = req.body;
        
        if (!name || !description || !subjects || !userId) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        
        const newGroup = {
            id: Date.now().toString(),
            name: name,
            description: description,
            subjects: subjects,
            level: level || 'intermediate',
            maxMembers: maxMembers || 10,
            createdBy: userId,
            createdAt: new Date().toISOString(),
            members: [{
                userId: userId,
                userName: userName,
                role: 'admin',
                joinedAt: new Date().toISOString()
            }],
            active: true,
            meetingSchedule: null
        };
        
        studyGroups.push(newGroup);
        
        res.status(201).json({
            group: newGroup,
            success: true
        });
    } catch (error) {
        console.error('Error creating study group:', error);
        res.status(500).json({ message: 'Failed to create study group' });
    }
});

// Join study group
router.post('/study-groups/:id/join', (req, res) => {
    try {
        const groupId = req.params.id;
        const { userId, userName } = req.body;
        
        const group = studyGroups.find(g => g.id === groupId);
        if (!group) {
            return res.status(404).json({ message: 'Study group not found' });
        }
        
        if (group.members.length >= group.maxMembers) {
            return res.status(400).json({ message: 'Study group is full' });
        }
        
        if (group.members.some(m => m.userId === userId)) {
            return res.status(400).json({ message: 'Already a member of this group' });
        }
        
        group.members.push({
            userId: userId,
            userName: userName,
            role: 'member',
            joinedAt: new Date().toISOString()
        });
        
        res.json({
            success: true,
            group: group,
            message: 'Successfully joined study group'
        });
    } catch (error) {
        console.error('Error joining study group:', error);
        res.status(500).json({ message: 'Failed to join study group' });
    }
});

// Get community statistics
router.get('/stats', (req, res) => {
    try {
        const stats = {
            totalMessages: chatMessages.length,
            totalMemoryCards: memoryCards.length,
            totalStudyGroups: studyGroups.filter(g => g.active).length,
            activeUsers: new Set([
                ...chatMessages.map(m => m.userId),
                ...memoryCards.map(c => c.createdBy)
            ]).size,
            topCategories: getTopCategories(),
            recentActivity: getRecentActivity()
        };
        
        res.json(stats);
    } catch (error) {
        console.error('Error fetching community stats:', error);
        res.status(500).json({ message: 'Failed to fetch statistics' });
    }
});

// Helper functions
function isInappropriateContent(message) {
    const inappropriateWords = ['spam', 'inappropriate']; // Add more as needed
    const lowerMessage = message.toLowerCase();
    return inappropriateWords.some(word => lowerMessage.includes(word));
}

function getTopCategories() {
    const categoryCounts = {};
    memoryCards.forEach(card => {
        categoryCounts[card.category] = (categoryCounts[card.category] || 0) + 1;
    });
    
    return Object.entries(categoryCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([category, count]) => ({ category, count }));
}

function getRecentActivity() {
    const recentMessages = chatMessages
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5)
        .map(msg => ({
            type: 'message',
            content: msg.message.substring(0, 50) + '...',
            user: msg.userName,
            timestamp: msg.timestamp
        }));
    
    const recentCards = memoryCards
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3)
        .map(card => ({
            type: 'memory_card',
            content: card.front.substring(0, 50) + '...',
            category: card.category,
            timestamp: card.createdAt
        }));
    
    return [...recentMessages, ...recentCards]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10);
}

module.exports = router;