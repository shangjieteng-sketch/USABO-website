const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Load unit data
const unitDataPath = path.join(__dirname, '../data/bio11_ch1_unit.json');
const unitData = JSON.parse(fs.readFileSync(unitDataPath, 'utf8'));

// In-memory session storage (in production, use Redis/database)
const sessions = new Map();

// Session management
function getOrCreateSession(sessionId) {
    if (!sessions.has(sessionId)) {
        sessions.set(sessionId, {
            id: sessionId,
            conceptMastery: {}, // concept_id -> { attempts: number, correct: number, mastered: boolean }
            currentQuestion: null,
            questionHistory: [],
            startTime: new Date(),
            lastActivity: new Date()
        });
    }
    return sessions.get(sessionId);
}

// Concept selection logic - prioritizes unmastered concepts
function selectNextConcept(session) {
    const concepts = unitData.concepts;
    const unmastered = concepts.filter(concept => {
        const mastery = session.conceptMastery[concept.id];
        return !mastery || !mastery.mastered;
    });
    
    if (unmastered.length === 0) {
        // All concepts mastered, select randomly for review
        return concepts[Math.floor(Math.random() * concepts.length)];
    }
    
    // Priority: concepts with failed attempts, then new concepts
    const withFailures = unmastered.filter(concept => {
        const mastery = session.conceptMastery[concept.id];
        return mastery && mastery.attempts > mastery.correct;
    });
    
    if (withFailures.length > 0) {
        return withFailures[Math.floor(Math.random() * withFailures.length)];
    }
    
    // Select from new concepts
    const newConcepts = unmastered.filter(concept => {
        return !session.conceptMastery[concept.id];
    });
    
    return newConcepts[Math.floor(Math.random() * newConcepts.length)];
}

// Question generation from template
function generateQuestion(template) {
    const choices = [template.choices.correct_pattern, ...template.choices.distractor_patterns];
    
    // Shuffle choices
    const shuffledChoices = [];
    const correctIndex = Math.floor(Math.random() * 4);
    
    for (let i = 0; i < 4; i++) {
        if (i === correctIndex) {
            shuffledChoices.push({
                id: String.fromCharCode(65 + i), // A, B, C, D
                text: template.choices.correct_pattern,
                correct: true
            });
        } else {
            const distractorIndex = shuffledChoices.filter(c => !c.correct).length;
            if (distractorIndex < template.choices.distractor_patterns.length) {
                shuffledChoices.push({
                    id: String.fromCharCode(65 + i),
                    text: template.choices.distractor_patterns[distractorIndex],
                    correct: false
                });
            }
        }
    }
    
    return {
        id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        templateId: template.id,
        conceptId: template.concept_id,
        stem: template.stem,
        choices: shuffledChoices,
        correctAnswer: shuffledChoices.find(c => c.correct).id
    };
}

// Generate explanation for wrong answer
function generateExplanation(concept, question, userAnswer) {
    const correctChoice = question.choices.find(c => c.id === question.correctAnswer);
    const userChoice = question.choices.find(c => c.id === userAnswer);
    
    const explanation = {
        conceptName: concept.name,
        conceptDefinition: concept.definition,
        correctAnswer: question.correctAnswer,
        correctText: correctChoice ? correctChoice.text : 'Unknown',
        userAnswerText: userChoice ? userChoice.text : 'Unknown',
        misconceptions: concept.misconceptions,
        review: `The correct answer focuses on ${concept.definition.toLowerCase()}`
    };
    
    return explanation;
}

// API Endpoints

// Start or continue practice session
router.post('/start', (req, res) => {
    const sessionId = req.body.sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session = getOrCreateSession(sessionId);
    
    res.json({
        sessionId: session.id,
        unit: unitData.unit,
        status: 'ready'
    });
});

// Get next question set (5 questions)
router.get('/questions/:sessionId', (req, res) => {
    const session = getOrCreateSession(req.params.sessionId);
    session.lastActivity = new Date();
    
    const questions = [];
    const questionCount = 5;
    
    // Generate 5 questions from different concepts or templates
    for (let i = 0; i < questionCount; i++) {
        // Select concept
        const concept = selectNextConcept(session);
        
        // Find templates for this concept
        const templates = unitData.question_templates.filter(t => t.concept_id === concept.id);
        if (templates.length === 0) continue;
        
        // Select random template
        const template = templates[Math.floor(Math.random() * templates.length)];
        
        // Generate question
        const question = generateQuestion(template);
        questions.push({
            id: question.id,
            templateId: question.templateId,
            conceptId: question.conceptId,
            stem: question.stem,
            choices: question.choices.map(c => ({
                id: c.id,
                text: c.text
            })),
            correctAnswer: question.correctAnswer
        });
    }
    
    session.currentQuestions = questions;
    
    res.json({
        questions: questions.map(q => ({
            id: q.id,
            stem: q.stem,
            choices: q.choices
        })),
        progress: {
            totalConcepts: unitData.concepts.length,
            masteredConcepts: Object.values(session.conceptMastery).filter(m => m.mastered).length,
            totalAttempts: Object.values(session.conceptMastery).reduce((sum, m) => sum + (m.attempts || 0), 0)
        }
    });
});

// Submit answers for question set
router.post('/answers/:sessionId', (req, res) => {
    const session = getOrCreateSession(req.params.sessionId);
    const { answers } = req.body; // answers is an object: { questionId: answer, ... }
    
    if (!session.currentQuestions || session.currentQuestions.length === 0) {
        return res.status(400).json({ error: 'No active questions' });
    }
    
    const results = [];
    
    // Process each answer
    session.currentQuestions.forEach(question => {
        const userAnswer = answers[question.id];
        if (!userAnswer) return; // Skip if no answer provided
        
        const concept = unitData.concepts.find(c => c.id === question.conceptId);
        const isCorrect = userAnswer === question.correctAnswer;
        
        // Update mastery tracking
        if (!session.conceptMastery[concept.id]) {
            session.conceptMastery[concept.id] = { attempts: 0, correct: 0, mastered: false };
        }
        
        const mastery = session.conceptMastery[concept.id];
        mastery.attempts++;
        
        if (isCorrect) {
            mastery.correct++;
            // Mark as mastered if 2+ correct attempts and success rate >= 75%
            if (mastery.correct >= 2 && (mastery.correct / mastery.attempts) >= 0.75) {
                mastery.mastered = true;
            }
        }
        
        // Store in history
        session.questionHistory.push({
            questionId: question.id,
            conceptId: concept.id,
            answer: userAnswer,
            correct: isCorrect,
            timestamp: new Date()
        });
        
        const result = {
            questionId: question.id,
            correct: isCorrect,
            correctAnswer: question.correctAnswer,
            userAnswer: userAnswer,
            stem: question.stem,
            conceptProgress: {
                conceptId: concept.id,
                conceptName: concept.name,
                attempts: mastery.attempts,
                correct: mastery.correct,
                mastered: mastery.mastered
            }
        };
        
        // Add explanation if wrong
        if (!isCorrect) {
            result.explanation = generateExplanation(concept, question, userAnswer);
        }
        
        results.push(result);
    });
    
    session.currentQuestions = null;
    session.lastActivity = new Date();
    
    res.json({
        results: results,
        overallProgress: {
            totalConcepts: unitData.concepts.length,
            masteredConcepts: Object.values(session.conceptMastery).filter(m => m.mastered).length,
            totalAttempts: Object.values(session.conceptMastery).reduce((sum, m) => sum + (m.attempts || 0), 0),
            totalCorrect: Object.values(session.conceptMastery).reduce((sum, m) => sum + (m.correct || 0), 0)
        }
    });
});

// Get session progress
router.get('/progress/:sessionId', (req, res) => {
    const session = sessions.get(req.params.sessionId);
    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }
    
    const conceptProgress = unitData.concepts.map(concept => {
        const mastery = session.conceptMastery[concept.id] || { attempts: 0, correct: 0, mastered: false };
        return {
            conceptId: concept.id,
            conceptName: concept.name,
            section: concept.section,
            attempts: mastery.attempts,
            correct: mastery.correct,
            successRate: mastery.attempts > 0 ? (mastery.correct / mastery.attempts) : 0,
            mastered: mastery.mastered
        };
    });
    
    res.json({
        sessionId: session.id,
        startTime: session.startTime,
        lastActivity: session.lastActivity,
        totalQuestions: session.questionHistory.length,
        conceptProgress: conceptProgress,
        overallProgress: {
            totalConcepts: unitData.concepts.length,
            masteredConcepts: conceptProgress.filter(c => c.mastered).length,
            totalAttempts: conceptProgress.reduce((sum, c) => sum + c.attempts, 0),
            totalCorrect: conceptProgress.reduce((sum, c) => sum + c.correct, 0)
        }
    });
});

module.exports = router;