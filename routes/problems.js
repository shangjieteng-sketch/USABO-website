const express = require('express');
const router = express.Router();

// Sample problem sets data structure
const problemSets = [
    {
        id: 1,
        title: "Molecular Biology Fundamentals",
        category: "chapter",
        chapter: "Molecular Biology",
        difficulty: "intermediate",
        totalQuestions: 15,
        timeLimit: 30, // minutes
        description: "Test your understanding of DNA, RNA, and protein synthesis",
        questions: [
            {
                id: 1,
                question: "Which of the following best describes the central dogma of molecular biology?",
                type: "multiple_choice",
                options: [
                    "DNA → RNA → Protein",
                    "RNA → DNA → Protein",
                    "Protein → RNA → DNA",
                    "DNA → Protein → RNA"
                ],
                correct: 0,
                explanation: "The central dogma describes the flow of genetic information from DNA to RNA to protein through transcription and translation.",
                difficulty: "easy",
                topics: ["central_dogma", "gene_expression"]
            },
            {
                id: 2,
                question: "During DNA replication, which enzyme is primarily responsible for adding nucleotides to the growing DNA strand?",
                type: "multiple_choice",
                options: [
                    "DNA helicase",
                    "DNA ligase",
                    "DNA polymerase",
                    "DNA primase"
                ],
                correct: 2,
                explanation: "DNA polymerase is the main enzyme that adds complementary nucleotides to the growing DNA strand during replication.",
                difficulty: "medium",
                topics: ["DNA_replication", "enzymes"]
            }
        ]
    },
    {
        id: 2,
        title: "USABO 2023 Practice Set",
        category: "past_usabo",
        year: 2023,
        difficulty: "advanced",
        totalQuestions: 50,
        timeLimit: 90,
        description: "Practice questions similar to the 2023 USABO examination",
        questions: [
            {
                id: 1,
                question: "In a population of 1000 individuals, 160 show a recessive phenotype. Assuming Hardy-Weinberg equilibrium, what is the frequency of the dominant allele?",
                type: "multiple_choice",
                options: [
                    "0.4",
                    "0.6",
                    "0.16",
                    "0.84"
                ],
                correct: 1,
                explanation: "If 160/1000 = 0.16 show recessive phenotype, then q² = 0.16, so q = 0.4 and p = 1 - q = 0.6",
                difficulty: "hard",
                topics: ["population_genetics", "Hardy_Weinberg"]
            }
        ]
    },
    {
        id: 3,
        title: "Cell Biology Essentials",
        category: "chapter",
        chapter: "Cell Biology",
        difficulty: "beginner",
        totalQuestions: 10,
        timeLimit: 20,
        description: "Basic concepts in cell structure and function",
        questions: [
            {
                id: 1,
                question: "Which organelle is responsible for protein synthesis?",
                type: "multiple_choice",
                options: [
                    "Mitochondria",
                    "Ribosomes",
                    "Golgi apparatus",
                    "Endoplasmic reticulum"
                ],
                correct: 1,
                explanation: "Ribosomes are the cellular machines responsible for protein synthesis (translation).",
                difficulty: "easy",
                topics: ["cell_organelles", "protein_synthesis"]
            }
        ]
    }
];

// User progress tracking (in production, use database)
const userProgress = {};

// Get all problem sets
router.get('/', (req, res) => {
    try {
        const { category, difficulty, chapter } = req.query;
        
        let filteredSets = problemSets;
        
        if (category) {
            filteredSets = filteredSets.filter(set => set.category === category);
        }
        
        if (difficulty) {
            filteredSets = filteredSets.filter(set => set.difficulty === difficulty);
        }
        
        if (chapter) {
            filteredSets = filteredSets.filter(set => set.chapter === chapter);
        }
        
        const setsOverview = filteredSets.map(set => ({
            id: set.id,
            title: set.title,
            category: set.category,
            difficulty: set.difficulty,
            totalQuestions: set.totalQuestions,
            timeLimit: set.timeLimit,
            description: set.description,
            chapter: set.chapter,
            year: set.year
        }));
        
        res.json({
            problemSets: setsOverview,
            total: setsOverview.length,
            categories: ['chapter', 'past_usabo', 'ai_generated'],
            difficulties: ['beginner', 'intermediate', 'advanced'],
            chapters: ['Molecular Biology', 'Cell Biology', 'Plant Biology', 'Microbiology', 'Biochemistry', 'Animal Physiology']
        });
    } catch (error) {
        console.error('Error fetching problem sets:', error);
        res.status(500).json({ message: 'Failed to fetch problem sets' });
    }
});

// Get specific problem set
router.get('/:id', (req, res) => {
    try {
        const setId = parseInt(req.params.id);
        const problemSet = problemSets.find(set => set.id === setId);
        
        if (!problemSet) {
            return res.status(404).json({ message: 'Problem set not found' });
        }
        
        res.json(problemSet);
    } catch (error) {
        console.error('Error fetching problem set:', error);
        res.status(500).json({ message: 'Failed to fetch problem set' });
    }
});

// Start problem set session
router.post('/:id/start', (req, res) => {
    try {
        const setId = parseInt(req.params.id);
        const problemSet = problemSets.find(set => set.id === setId);
        
        if (!problemSet) {
            return res.status(404).json({ message: 'Problem set not found' });
        }
        
        const sessionId = Date.now().toString();
        const startTime = new Date();
        
        // Initialize session (in production, store in database)
        userProgress[sessionId] = {
            setId: setId,
            startTime: startTime,
            answers: {},
            currentQuestion: 1,
            timeRemaining: problemSet.timeLimit * 60 // convert to seconds
        };
        
        res.json({
            sessionId: sessionId,
            problemSet: {
                id: problemSet.id,
                title: problemSet.title,
                totalQuestions: problemSet.totalQuestions,
                timeLimit: problemSet.timeLimit
            },
            currentQuestion: 1,
            timeRemaining: problemSet.timeLimit * 60,
            message: 'Problem set session started'
        });
    } catch (error) {
        console.error('Error starting problem set:', error);
        res.status(500).json({ message: 'Failed to start problem set' });
    }
});

// Get question for session
router.get('/:id/question/:questionNumber', (req, res) => {
    try {
        const setId = parseInt(req.params.id);
        const questionNumber = parseInt(req.params.questionNumber);
        const { sessionId } = req.query;
        
        const problemSet = problemSets.find(set => set.id === setId);
        if (!problemSet) {
            return res.status(404).json({ message: 'Problem set not found' });
        }
        
        const session = userProgress[sessionId];
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }
        
        const question = problemSet.questions[questionNumber - 1];
        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }
        
        // Don't send the correct answer or explanation
        const questionForUser = {
            id: question.id,
            question: question.question,
            type: question.type,
            options: question.options,
            difficulty: question.difficulty,
            topics: question.topics
        };
        
        res.json({
            question: questionForUser,
            questionNumber: questionNumber,
            totalQuestions: problemSet.totalQuestions,
            timeRemaining: session.timeRemaining
        });
    } catch (error) {
        console.error('Error fetching question:', error);
        res.status(500).json({ message: 'Failed to fetch question' });
    }
});

// Submit answer for question
router.post('/:id/answer', (req, res) => {
    try {
        const setId = parseInt(req.params.id);
        const { sessionId, questionNumber, answer } = req.body;
        
        const session = userProgress[sessionId];
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }
        
        // Store the answer
        session.answers[questionNumber] = {
            answer: answer,
            timestamp: new Date()
        };
        
        const problemSet = problemSets.find(set => set.id === setId);
        const isLastQuestion = questionNumber >= problemSet.totalQuestions;
        
        res.json({
            success: true,
            questionNumber: questionNumber,
            isLastQuestion: isLastQuestion,
            nextQuestion: isLastQuestion ? null : questionNumber + 1,
            message: 'Answer submitted successfully'
        });
    } catch (error) {
        console.error('Error submitting answer:', error);
        res.status(500).json({ message: 'Failed to submit answer' });
    }
});

// Submit complete problem set
router.post('/:id/submit', (req, res) => {
    try {
        const setId = parseInt(req.params.id);
        const { sessionId } = req.body;
        
        const problemSet = problemSets.find(set => set.id === setId);
        if (!problemSet) {
            return res.status(404).json({ message: 'Problem set not found' });
        }
        
        const session = userProgress[sessionId];
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }
        
        // Calculate results
        const results = [];
        let correctAnswers = 0;
        
        problemSet.questions.forEach((question, index) => {
            const questionNumber = index + 1;
            const userAnswer = session.answers[questionNumber]?.answer;
            const isCorrect = userAnswer === question.correct;
            
            if (isCorrect) correctAnswers++;
            
            results.push({
                questionNumber: questionNumber,
                question: question.question,
                userAnswer: userAnswer,
                correctAnswer: question.correct,
                isCorrect: isCorrect,
                explanation: question.explanation,
                difficulty: question.difficulty,
                topics: question.topics
            });
        });
        
        const score = correctAnswers;
        const totalQuestions = problemSet.questions.length;
        const percentage = Math.round((score / totalQuestions) * 100);
        const endTime = new Date();
        const timeTaken = Math.round((endTime - session.startTime) / 1000); // in seconds
        
        // Store final results
        session.results = {
            score: score,
            total: totalQuestions,
            percentage: percentage,
            timeTaken: timeTaken,
            completed: true,
            completedAt: endTime
        };
        
        res.json({
            sessionId: sessionId,
            score: score,
            total: totalQuestions,
            percentage: percentage,
            timeTaken: timeTaken,
            passed: percentage >= 70,
            results: results,
            summary: {
                easy: results.filter(r => r.difficulty === 'easy' && r.isCorrect).length,
                medium: results.filter(r => r.difficulty === 'medium' && r.isCorrect).length,
                hard: results.filter(r => r.difficulty === 'hard' && r.isCorrect).length
            }
        });
    } catch (error) {
        console.error('Error submitting problem set:', error);
        res.status(500).json({ message: 'Failed to submit problem set' });
    }
});

// Get user statistics
router.get('/stats/:userId', (req, res) => {
    try {
        const userId = req.params.userId;
        
        // In production, fetch from database
        const userStats = {
            totalAttempts: 0,
            averageScore: 0,
            bestScore: 0,
            timeSpent: 0,
            topicStrengths: {},
            recentActivity: []
        };
        
        res.json(userStats);
    } catch (error) {
        console.error('Error fetching user stats:', error);
        res.status(500).json({ message: 'Failed to fetch user statistics' });
    }
});

// Generate AI problems (placeholder)
router.post('/generate', (req, res) => {
    try {
        const { topic, difficulty, count = 5 } = req.body;
        
        // This would integrate with the AI service
        res.json({
            message: 'AI problem generation not yet implemented',
            topic: topic,
            difficulty: difficulty,
            requestedCount: count,
            note: 'This feature will use the OpenAI API to generate custom problems'
        });
    } catch (error) {
        console.error('Error generating AI problems:', error);
        res.status(500).json({ message: 'Failed to generate problems' });
    }
});

module.exports = router;