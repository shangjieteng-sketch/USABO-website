const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/init');

// Helper function to run database queries as promises
function dbRun(db, query, params = []) {
    return new Promise((resolve, reject) => {
        db.run(query, params, function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

function dbGet(db, query, params = []) {
    return new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

function dbAll(db, query, params = []) {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

// POST - Create a new MCQ question
router.post('/questions', async (req, res) => {
    try {
        const {
            question_text,
            option_a,
            option_b,
            option_c,
            option_d,
            correct_answer,
            explanation,
            difficulty = 'medium',
            category = 'general',
            chapter,
            topics = []
        } = req.body;

        // Validation
        if (!question_text || !option_a || !option_b || !option_c || !option_d) {
            return res.status(400).json({ 
                success: false, 
                message: 'Question text and all four options are required' 
            });
        }

        if (![0, 1, 2, 3].includes(correct_answer)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Correct answer must be 0, 1, 2, or 3' 
            });
        }

        const db = getDatabase();
        const created_by = req.user?.id || null; // Use authenticated user if available

        const result = await dbRun(db, `
            INSERT INTO mcq_questions 
            (question_text, option_a, option_b, option_c, option_d, correct_answer, 
             explanation, difficulty, category, chapter, topics, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            question_text, option_a, option_b, option_c, option_d, 
            correct_answer, explanation, difficulty, category, chapter, 
            JSON.stringify(topics), created_by
        ]);

        db.close();

        res.status(201).json({
            success: true,
            message: 'Question created successfully',
            question_id: result.lastID
        });

    } catch (error) {
        console.error('Error creating question:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create question' 
        });
    }
});

// GET - Retrieve all questions with optional filtering
router.get('/questions', async (req, res) => {
    try {
        const { difficulty, category, chapter, limit = 50, offset = 0 } = req.query;
        
        let query = `
            SELECT q.*, u.name as created_by_name 
            FROM mcq_questions q
            LEFT JOIN users u ON q.created_by = u.id
            WHERE 1=1
        `;
        let params = [];

        if (difficulty) {
            query += ' AND q.difficulty = ?';
            params.push(difficulty);
        }
        if (category) {
            query += ' AND q.category = ?';
            params.push(category);
        }
        if (chapter) {
            query += ' AND q.chapter = ?';
            params.push(chapter);
        }

        query += ' ORDER BY q.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const db = getDatabase();
        const questions = await dbAll(db, query, params);
        
        // Parse topics JSON for each question
        questions.forEach(q => {
            q.topics = q.topics ? JSON.parse(q.topics) : [];
        });

        // Get total count for pagination
        let countQuery = 'SELECT COUNT(*) as total FROM mcq_questions WHERE 1=1';
        let countParams = [];
        
        if (difficulty) {
            countQuery += ' AND difficulty = ?';
            countParams.push(difficulty);
        }
        if (category) {
            countQuery += ' AND category = ?';
            countParams.push(category);
        }
        if (chapter) {
            countQuery += ' AND chapter = ?';
            countParams.push(chapter);
        }

        const countResult = await dbGet(db, countQuery, countParams);
        db.close();

        res.json({
            success: true,
            questions,
            total: countResult.total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch questions' 
        });
    }
});

// GET - Retrieve a specific question by ID
router.get('/questions/:id', async (req, res) => {
    try {
        const questionId = parseInt(req.params.id);
        
        if (isNaN(questionId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid question ID' 
            });
        }

        const db = getDatabase();
        const question = await dbGet(db, `
            SELECT q.*, u.name as created_by_name 
            FROM mcq_questions q
            LEFT JOIN users u ON q.created_by = u.id
            WHERE q.id = ?
        `, [questionId]);

        db.close();

        if (!question) {
            return res.status(404).json({ 
                success: false, 
                message: 'Question not found' 
            });
        }

        question.topics = question.topics ? JSON.parse(question.topics) : [];

        res.json({
            success: true,
            question
        });

    } catch (error) {
        console.error('Error fetching question:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch question' 
        });
    }
});

// PUT - Update a question
router.put('/questions/:id', async (req, res) => {
    try {
        const questionId = parseInt(req.params.id);
        const {
            question_text,
            option_a,
            option_b,
            option_c,
            option_d,
            correct_answer,
            explanation,
            difficulty,
            category,
            chapter,
            topics
        } = req.body;

        if (isNaN(questionId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid question ID' 
            });
        }

        const db = getDatabase();
        
        // Check if question exists
        const existing = await dbGet(db, 'SELECT id FROM mcq_questions WHERE id = ?', [questionId]);
        if (!existing) {
            db.close();
            return res.status(404).json({ 
                success: false, 
                message: 'Question not found' 
            });
        }

        await dbRun(db, `
            UPDATE mcq_questions 
            SET question_text = ?, option_a = ?, option_b = ?, option_c = ?, 
                option_d = ?, correct_answer = ?, explanation = ?, difficulty = ?, 
                category = ?, chapter = ?, topics = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [
            question_text, option_a, option_b, option_c, option_d, 
            correct_answer, explanation, difficulty, category, chapter, 
            JSON.stringify(topics || []), questionId
        ]);

        db.close();

        res.json({
            success: true,
            message: 'Question updated successfully'
        });

    } catch (error) {
        console.error('Error updating question:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update question' 
        });
    }
});

// DELETE - Delete a question
router.delete('/questions/:id', async (req, res) => {
    try {
        const questionId = parseInt(req.params.id);
        
        if (isNaN(questionId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid question ID' 
            });
        }

        const db = getDatabase();
        
        // Check if question exists
        const existing = await dbGet(db, 'SELECT id FROM mcq_questions WHERE id = ?', [questionId]);
        if (!existing) {
            db.close();
            return res.status(404).json({ 
                success: false, 
                message: 'Question not found' 
            });
        }

        await dbRun(db, 'DELETE FROM mcq_questions WHERE id = ?', [questionId]);
        db.close();

        res.json({
            success: true,
            message: 'Question deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting question:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete question' 
        });
    }
});

// POST - Create a new problem set
router.post('/problem-sets', async (req, res) => {
    try {
        const {
            title,
            description,
            category = 'custom',
            difficulty = 'medium',
            chapter,
            time_limit = 30,
            question_ids = []
        } = req.body;

        if (!title) {
            return res.status(400).json({ 
                success: false, 
                message: 'Problem set title is required' 
            });
        }

        const db = getDatabase();
        const created_by = req.user?.id || null;

        // Create problem set
        const result = await dbRun(db, `
            INSERT INTO mcq_problem_sets 
            (title, description, category, difficulty, chapter, time_limit, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [title, description, category, difficulty, chapter, time_limit, created_by]);

        const problemSetId = result.lastID;

        // Add questions to problem set if provided
        if (question_ids.length > 0) {
            for (let i = 0; i < question_ids.length; i++) {
                await dbRun(db, `
                    INSERT INTO mcq_problemset_questions 
                    (problemset_id, question_id, question_order)
                    VALUES (?, ?, ?)
                `, [problemSetId, question_ids[i], i + 1]);
            }
        }

        db.close();

        res.status(201).json({
            success: true,
            message: 'Problem set created successfully',
            problem_set_id: problemSetId
        });

    } catch (error) {
        console.error('Error creating problem set:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create problem set' 
        });
    }
});

// GET - Retrieve all problem sets
router.get('/problem-sets', async (req, res) => {
    try {
        const { category, difficulty, chapter } = req.query;
        
        let query = `
            SELECT ps.*, u.name as created_by_name,
                   COUNT(psq.question_id) as total_questions
            FROM mcq_problem_sets ps
            LEFT JOIN users u ON ps.created_by = u.id
            LEFT JOIN mcq_problemset_questions psq ON ps.id = psq.problemset_id
            WHERE ps.is_published = 1
        `;
        let params = [];

        if (category) {
            query += ' AND ps.category = ?';
            params.push(category);
        }
        if (difficulty) {
            query += ' AND ps.difficulty = ?';
            params.push(difficulty);
        }
        if (chapter) {
            query += ' AND ps.chapter = ?';
            params.push(chapter);
        }

        query += ' GROUP BY ps.id ORDER BY ps.created_at DESC';

        const db = getDatabase();
        const problemSets = await dbAll(db, query, params);
        db.close();

        res.json({
            success: true,
            problem_sets: problemSets
        });

    } catch (error) {
        console.error('Error fetching problem sets:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch problem sets' 
        });
    }
});

// GET - Retrieve a specific problem set with its questions
router.get('/problem-sets/:id', async (req, res) => {
    try {
        const problemSetId = parseInt(req.params.id);
        
        if (isNaN(problemSetId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid problem set ID' 
            });
        }

        const db = getDatabase();
        
        // Get problem set details
        const problemSet = await dbGet(db, `
            SELECT ps.*, u.name as created_by_name
            FROM mcq_problem_sets ps
            LEFT JOIN users u ON ps.created_by = u.id
            WHERE ps.id = ? AND ps.is_published = 1
        `, [problemSetId]);

        if (!problemSet) {
            db.close();
            return res.status(404).json({ 
                success: false, 
                message: 'Problem set not found' 
            });
        }

        // Get questions in this problem set
        const questions = await dbAll(db, `
            SELECT q.*, psq.question_order
            FROM mcq_questions q
            JOIN mcq_problemset_questions psq ON q.id = psq.question_id
            WHERE psq.problemset_id = ?
            ORDER BY psq.question_order
        `, [problemSetId]);

        // Parse topics for each question
        questions.forEach(q => {
            q.topics = q.topics ? JSON.parse(q.topics) : [];
        });

        db.close();

        res.json({
            success: true,
            problem_set: {
                ...problemSet,
                questions
            }
        });

    } catch (error) {
        console.error('Error fetching problem set:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch problem set' 
        });
    }
});

// POST - Start a new MCQ attempt session
router.post('/problem-sets/:id/start', async (req, res) => {
    try {
        const problemSetId = parseInt(req.params.id);
        
        if (isNaN(problemSetId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid problem set ID' 
            });
        }

        const db = getDatabase();
        
        // Get problem set details
        const problemSet = await dbGet(db, `
            SELECT * FROM mcq_problem_sets 
            WHERE id = ? AND is_published = 1
        `, [problemSetId]);

        if (!problemSet) {
            db.close();
            return res.status(404).json({ 
                success: false, 
                message: 'Problem set not found' 
            });
        }

        // Count questions in this problem set
        const questionCount = await dbGet(db, `
            SELECT COUNT(*) as total 
            FROM mcq_problemset_questions 
            WHERE problemset_id = ?
        `, [problemSetId]);

        const sessionId = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
        const userId = req.user?.id || null;

        // Create attempt record
        await dbRun(db, `
            INSERT INTO mcq_attempts 
            (user_id, problemset_id, session_id, total_questions, start_time)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [userId, problemSetId, sessionId, questionCount.total]);

        db.close();

        res.json({
            success: true,
            session_id: sessionId,
            problem_set: {
                id: problemSet.id,
                title: problemSet.title,
                description: problemSet.description,
                total_questions: questionCount.total,
                time_limit: problemSet.time_limit
            },
            time_limit_seconds: problemSet.time_limit * 60,
            message: 'MCQ session started successfully'
        });

    } catch (error) {
        console.error('Error starting MCQ session:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to start MCQ session' 
        });
    }
});

// GET - Get question for current session
router.get('/sessions/:sessionId/question/:questionNumber', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const questionNumber = parseInt(req.params.questionNumber);
        
        if (isNaN(questionNumber) || questionNumber < 1) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid question number' 
            });
        }

        const db = getDatabase();
        
        // Get attempt details
        const attempt = await dbGet(db, `
            SELECT * FROM mcq_attempts 
            WHERE session_id = ? AND is_completed = 0
        `, [sessionId]);

        if (!attempt) {
            db.close();
            return res.status(404).json({ 
                success: false, 
                message: 'Session not found or already completed' 
            });
        }

        // Get the specific question
        const question = await dbGet(db, `
            SELECT q.id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d,
                   q.difficulty, q.topics, psq.question_order
            FROM mcq_questions q
            JOIN mcq_problemset_questions psq ON q.id = psq.question_id
            WHERE psq.problemset_id = ? AND psq.question_order = ?
        `, [attempt.problemset_id, questionNumber]);

        if (!question) {
            db.close();
            return res.status(404).json({ 
                success: false, 
                message: 'Question not found' 
            });
        }

        // Parse topics
        question.topics = question.topics ? JSON.parse(question.topics) : [];

        // Check if already answered
        const existingAnswer = await dbGet(db, `
            SELECT selected_option FROM mcq_answers 
            WHERE attempt_id = ? AND question_id = ?
        `, [attempt.id, question.id]);

        // Calculate time remaining
        const startTime = new Date(attempt.start_time);
        const timeLimitMs = attempt.total_questions * 2 * 60 * 1000; // 2 minutes per question
        const timeElapsed = Date.now() - startTime.getTime();
        const timeRemaining = Math.max(0, Math.floor((timeLimitMs - timeElapsed) / 1000));

        db.close();

        res.json({
            success: true,
            question: {
                id: question.id,
                question_text: question.question_text,
                option_a: question.option_a,
                option_b: question.option_b,
                option_c: question.option_c,
                option_d: question.option_d,
                difficulty: question.difficulty,
                topics: question.topics
            },
            question_number: questionNumber,
            total_questions: attempt.total_questions,
            time_remaining_seconds: timeRemaining,
            previous_answer: existingAnswer?.selected_option
        });

    } catch (error) {
        console.error('Error fetching question:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch question' 
        });
    }
});

// POST - Submit answer for a question
router.post('/sessions/:sessionId/answer', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { question_id, selected_option, question_number } = req.body;
        
        if (![0, 1, 2, 3].includes(selected_option)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Selected option must be 0, 1, 2, or 3' 
            });
        }

        const db = getDatabase();
        
        // Get attempt details
        const attempt = await dbGet(db, `
            SELECT * FROM mcq_attempts 
            WHERE session_id = ? AND is_completed = 0
        `, [sessionId]);

        if (!attempt) {
            db.close();
            return res.status(404).json({ 
                success: false, 
                message: 'Session not found or already completed' 
            });
        }

        // Get question details to check correct answer
        const question = await dbGet(db, `
            SELECT correct_answer FROM mcq_questions 
            WHERE id = ?
        `, [question_id]);

        if (!question) {
            db.close();
            return res.status(404).json({ 
                success: false, 
                message: 'Question not found' 
            });
        }

        const isCorrect = selected_option === question.correct_answer;

        // Insert or update answer
        await dbRun(db, `
            INSERT OR REPLACE INTO mcq_answers 
            (attempt_id, question_id, selected_option, is_correct, answer_time)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [attempt.id, question_id, selected_option, isCorrect ? 1 : 0]);

        // Check if this is the last question
        const isLastQuestion = question_number >= attempt.total_questions;

        db.close();

        res.json({
            success: true,
            question_id,
            question_number,
            is_correct: isCorrect,
            is_last_question: isLastQuestion,
            next_question: isLastQuestion ? null : question_number + 1,
            message: 'Answer submitted successfully'
        });

    } catch (error) {
        console.error('Error submitting answer:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to submit answer' 
        });
    }
});

// POST - Complete MCQ attempt and get results
router.post('/sessions/:sessionId/complete', async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        const db = getDatabase();
        
        // Get attempt details
        const attempt = await dbGet(db, `
            SELECT * FROM mcq_attempts 
            WHERE session_id = ? AND is_completed = 0
        `, [sessionId]);

        if (!attempt) {
            db.close();
            return res.status(404).json({ 
                success: false, 
                message: 'Session not found or already completed' 
            });
        }

        // Calculate results
        const answers = await dbAll(db, `
            SELECT a.*, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d,
                   q.correct_answer, q.explanation, q.difficulty, q.topics, psq.question_order
            FROM mcq_answers a
            JOIN mcq_questions q ON a.question_id = q.id
            JOIN mcq_problemset_questions psq ON q.id = psq.question_id AND psq.problemset_id = ?
            WHERE a.attempt_id = ?
            ORDER BY psq.question_order
        `, [attempt.problemset_id, attempt.id]);

        let correctAnswers = 0;
        const results = answers.map(answer => {
            if (answer.is_correct) correctAnswers++;
            
            return {
                question_number: answer.question_order,
                question_text: answer.question_text,
                options: [answer.option_a, answer.option_b, answer.option_c, answer.option_d],
                selected_option: answer.selected_option,
                correct_answer: answer.correct_answer,
                is_correct: answer.is_correct === 1,
                explanation: answer.explanation,
                difficulty: answer.difficulty,
                topics: answer.topics ? JSON.parse(answer.topics) : []
            };
        });

        const totalQuestions = attempt.total_questions;
        const score = (correctAnswers / totalQuestions) * 100;
        const timeTaken = Math.floor((Date.now() - new Date(attempt.start_time).getTime()) / 1000);

        // Update attempt record
        await dbRun(db, `
            UPDATE mcq_attempts 
            SET end_time = CURRENT_TIMESTAMP, correct_answers = ?, score = ?, 
                time_taken = ?, is_completed = 1
            WHERE id = ?
        `, [correctAnswers, score, timeTaken, attempt.id]);

        db.close();

        res.json({
            success: true,
            session_id: sessionId,
            total_questions: totalQuestions,
            correct_answers: correctAnswers,
            score: Math.round(score),
            time_taken_seconds: timeTaken,
            passed: score >= 70,
            results,
            summary: {
                easy: results.filter(r => r.difficulty === 'easy' && r.is_correct).length,
                medium: results.filter(r => r.difficulty === 'medium' && r.is_correct).length,
                hard: results.filter(r => r.difficulty === 'hard' && r.is_correct).length
            }
        });

    } catch (error) {
        console.error('Error completing MCQ session:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to complete MCQ session' 
        });
    }
});

// GET - Get user's MCQ attempt history
router.get('/history', async (req, res) => {
    try {
        const userId = req.user?.id;
        
        if (!userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Authentication required' 
            });
        }

        const db = getDatabase();
        
        const attempts = await dbAll(db, `
            SELECT a.*, ps.title, ps.difficulty, ps.category
            FROM mcq_attempts a
            JOIN mcq_problem_sets ps ON a.problemset_id = ps.id
            WHERE a.user_id = ? AND a.is_completed = 1
            ORDER BY a.end_time DESC
            LIMIT 50
        `, [userId]);

        db.close();

        res.json({
            success: true,
            attempts
        });

    } catch (error) {
        console.error('Error fetching MCQ history:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch MCQ history' 
        });
    }
});

module.exports = router;