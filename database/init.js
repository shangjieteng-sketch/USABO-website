const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'users.db');

function initDatabase() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err);
                reject(err);
                return;
            }
            console.log('Connected to SQLite database');
        });

        db.serialize(() => {
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
            )`, (err) => {
                if (err) {
                    console.error('Error creating users table:', err);
                    reject(err);
                } else {
                    console.log('Users table ready');
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