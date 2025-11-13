const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Use in-memory database for serverless environments
const isServerless = process.env.VERCEL === '1' || process.env.AWS_EXECUTION_ENV;
const dbPath = isServerless ? ':memory:' : path.join(__dirname, 'users.db');

function initDatabase() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err);
                reject(err);
                return;
            }
            console.log(`Connected to ${isServerless ? 'in-memory' : 'SQLite'} database`);
        });

        db.serialize(() => {
            // Users table
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT,
                google_id TEXT UNIQUE,
                github_id TEXT UNIQUE,
                avatar TEXT,
                provider TEXT DEFAULT 'local',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // MCQ Questions table
            db.run(`CREATE TABLE IF NOT EXISTS mcq_questions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                question_text TEXT NOT NULL,
                option_a TEXT NOT NULL,
                option_b TEXT NOT NULL,
                option_c TEXT NOT NULL,
                option_d TEXT NOT NULL,
                correct_answer INTEGER NOT NULL CHECK(correct_answer IN (0,1,2,3)),
                explanation TEXT,
                difficulty TEXT DEFAULT 'medium' CHECK(difficulty IN ('easy','medium','hard')),
                category TEXT DEFAULT 'general',
                chapter TEXT,
                topics TEXT, -- JSON array of topics
                created_by INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users (id)
            )`);

            // MCQ Problem Sets table
            db.run(`CREATE TABLE IF NOT EXISTS mcq_problem_sets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                category TEXT DEFAULT 'custom',
                difficulty TEXT DEFAULT 'medium',
                chapter TEXT,
                time_limit INTEGER DEFAULT 30, -- minutes
                created_by INTEGER,
                is_published BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users (id)
            )`);

            // Junction table for problem sets and questions
            db.run(`CREATE TABLE IF NOT EXISTS mcq_problemset_questions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                problemset_id INTEGER NOT NULL,
                question_id INTEGER NOT NULL,
                question_order INTEGER NOT NULL,
                FOREIGN KEY (problemset_id) REFERENCES mcq_problem_sets (id) ON DELETE CASCADE,
                FOREIGN KEY (question_id) REFERENCES mcq_questions (id) ON DELETE CASCADE,
                UNIQUE(problemset_id, question_id),
                UNIQUE(problemset_id, question_order)
            )`);

            // MCQ Attempts table
            db.run(`CREATE TABLE IF NOT EXISTS mcq_attempts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                problemset_id INTEGER NOT NULL,
                session_id TEXT UNIQUE NOT NULL,
                start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                end_time DATETIME,
                total_questions INTEGER NOT NULL,
                correct_answers INTEGER DEFAULT 0,
                score REAL DEFAULT 0,
                time_taken INTEGER, -- seconds
                is_completed BOOLEAN DEFAULT 0,
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (problemset_id) REFERENCES mcq_problem_sets (id)
            )`);

            // MCQ Answers table
            db.run(`CREATE TABLE IF NOT EXISTS mcq_answers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                attempt_id INTEGER NOT NULL,
                question_id INTEGER NOT NULL,
                selected_option INTEGER CHECK(selected_option IN (0,1,2,3)),
                is_correct BOOLEAN DEFAULT 0,
                answer_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (attempt_id) REFERENCES mcq_attempts (id) ON DELETE CASCADE,
                FOREIGN KEY (question_id) REFERENCES mcq_questions (id),
                UNIQUE(attempt_id, question_id)
            )`, (err) => {
                if (err) {
                    console.error('Error creating tables:', err);
                    reject(err);
                } else {
                    console.log('All database tables ready');
                    resolve(db);
                }
            });
        });
    });
}

function getDatabase() {
    return new sqlite3.Database(dbPath);
}

module.exports = {
    initDatabase,
    getDatabase
};