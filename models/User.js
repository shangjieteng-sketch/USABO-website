const { getDatabase } = require('../database/init');

// Use in-memory database for serverless environments
const isVercel = process.env.VERCEL === '1';
const dbPath = isVercel ? ':memory:' : require('path').join(__dirname, '..', 'database', 'users.db');

function getDatabase() {
    const sqlite3 = require('sqlite3').verbose();
    return new sqlite3.Database(dbPath);
}

class User {
    static async findByEmail(email) {
        return new Promise((resolve, reject) => {
            const db = getDatabase();
            db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
                db.close();
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    static async findById(id) {
        return new Promise((resolve, reject) => {
            const db = getDatabase();
            db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
                db.close();
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    static async findByGoogleId(googleId) {
        return new Promise((resolve, reject) => {
            const db = getDatabase();
            db.get('SELECT * FROM users WHERE google_id = ?', [googleId], (err, row) => {
                db.close();
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    static async findByGithubId(githubId) {
        return new Promise((resolve, reject) => {
            const db = getDatabase();
            db.get('SELECT * FROM users WHERE github_id = ?', [githubId], (err, row) => {
                db.close();
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    static async create(userData) {
        return new Promise((resolve, reject) => {
            const db = getDatabase();
            const {
                name,
                email,
                password,
                googleId,
                githubId,
                avatar,
                provider = 'local'
            } = userData;

            const sql = `INSERT INTO users (name, email, password, google_id, github_id, avatar, provider)
                        VALUES (?, ?, ?, ?, ?, ?, ?)`;
            
            db.run(sql, [name, email, password, googleId, githubId, avatar, provider], function(err) {
                if (err) {
                    db.close();
                    reject(err);
                } else {
                    db.get('SELECT * FROM users WHERE id = ?', [this.lastID], (err, row) => {
                        db.close();
                        if (err) reject(err);
                        else resolve(row);
                    });
                }
            });
        });
    }

    static async update(id, userData) {
        return new Promise((resolve, reject) => {
            const db = getDatabase();
            const fields = [];
            const values = [];

            Object.keys(userData).forEach(key => {
                if (userData[key] !== undefined) {
                    fields.push(`${key} = ?`);
                    values.push(userData[key]);
                }
            });

            if (fields.length === 0) {
                db.close();
                return resolve(null);
            }

            values.push(new Date().toISOString());
            fields.push('updated_at = ?');
            values.push(id);

            const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
            
            db.run(sql, values, function(err) {
                if (err) {
                    db.close();
                    reject(err);
                } else {
                    db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
                        db.close();
                        if (err) reject(err);
                        else resolve(row);
                    });
                }
            });
        });
    }

    static async delete(id) {
        return new Promise((resolve, reject) => {
            const db = getDatabase();
            db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
                db.close();
                if (err) reject(err);
                else resolve(this.changes > 0);
            });
        });
    }

    static async getAll() {
        return new Promise((resolve, reject) => {
            const db = getDatabase();
            db.all('SELECT id, name, email, provider, created_at FROM users', (err, rows) => {
                db.close();
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
}

module.exports = User;