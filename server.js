const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Create MySQL connection pool (better than single connection)
const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'shuttle.proxy.rlwy.net',
    port: process.env.MYSQL_PORT || 16882,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE || 'railway',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
// Test connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        return;
    }
    console.log('✅ Connected to MySQL database!');
    connection.release();
    
    // Create tables
    const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    
    const createJournalTable = `
        CREATE TABLE IF NOT EXISTS journal_entries (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            entry_date DATE NOT NULL,
            mood VARCHAR(10),
            content TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE KEY unique_user_date (user_id, entry_date)
        )
    `;
    
    const createEventsTable = `
        CREATE TABLE IF NOT EXISTS calendar_events (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            event_date DATE NOT NULL,
            title VARCHAR(255) NOT NULL,
            start_time VARCHAR(10),
            end_time VARCHAR(10),
            is_all_day BOOLEAN DEFAULT FALSE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `;
    
    const createChecklistTable = `
        CREATE TABLE IF NOT EXISTS checklist_tasks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            task_date DATE NOT NULL,
            task_text VARCHAR(255) NOT NULL,
            is_completed BOOLEAN DEFAULT FALSE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `;
    
    pool.query(createUsersTable, (err) => {
        if (err) console.error('Users table error:', err);
        else console.log('✅ Users table ready');
    });
    
    pool.query(createJournalTable, (err) => {
        if (err) console.error('Journal table error:', err);
        else console.log('✅ Journal table ready');
    });
    
    pool.query(createEventsTable, (err) => {
        if (err) console.error('Events table error:', err);
        else console.log('✅ Events table ready');
    });
    
    pool.query(createChecklistTable, (err) => {
        if (err) console.error('Checklist table error:', err);
        else console.log('✅ Checklist table ready');
    });
});

// Helper function to use pool with promises
function query(sql, params) {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
}

// ==================== USER ROUTES ====================

// Signup
app.post('/api/signup', async (req, res) => {
    const { name, email, password } = req.body;
    
    try {
        const users = await query('SELECT * FROM users WHERE email = ?', [email]);
        
        if (users.length > 0) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', 
            [name, email, hashedPassword]);
        
        res.json({ 
            success: true, 
            user: { id: result.insertId, name, email } 
        });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const users = await query('SELECT * FROM users WHERE email = ?', [email]);
        
        if (users.length === 0) {
            return res.status(400).json({ error: 'User not found' });
        }
        
        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid password' });
        }
        
        res.json({ 
            success: true, 
            user: { id: user.id, name: user.name, email: user.email } 
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ==================== JOURNAL ROUTES ====================

app.get('/api/journal/:userId/:date', async (req, res) => {
    const { userId, date } = req.params;
    
    try {
        const results = await query('SELECT mood, content FROM journal_entries WHERE user_id = ? AND entry_date = ?', 
            [userId, date]);
        res.json(results[0] || null);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/journal', async (req, res) => {
    const { userId, date, mood, content } = req.body;
    
    try {
        await query(
            `INSERT INTO journal_entries (user_id, entry_date, mood, content) 
             VALUES (?, ?, ?, ?) 
             ON DUPLICATE KEY UPDATE mood = ?, content = ?`,
            [userId, date, mood, content, mood, content]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/journal/all/:userId', async (req, res) => {
    const { userId } = req.params;
    
    try {
        const results = await query('SELECT entry_date, mood, content FROM journal_entries WHERE user_id = ? ORDER BY entry_date DESC', 
            [userId]);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/journal/:userId/:date', async (req, res) => {
    const { userId, date } = req.params;
    
    try {
        await query('DELETE FROM journal_entries WHERE user_id = ? AND entry_date = ?', 
            [userId, date]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== EVENTS ROUTES ====================

app.get('/api/events/:userId/:year/:month', async (req, res) => {
    const { userId, year, month } = req.params;
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = `${year}-${month.padStart(2, '0')}-31`;
    
    try {
        const results = await query(
            'SELECT * FROM calendar_events WHERE user_id = ? AND event_date BETWEEN ? AND ? ORDER BY event_date',
            [userId, startDate, endDate]);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/events', async (req, res) => {
    const { userId, id, date, title, startTime, endTime, allDay } = req.body;
    
    try {
        if (id) {
            await query(
                'UPDATE calendar_events SET title = ?, start_time = ?, end_time = ?, is_all_day = ? WHERE id = ? AND user_id = ?',
                [title, startTime, endTime, allDay || false, id, userId]);
        } else {
            const result = await query(
                'INSERT INTO calendar_events (user_id, event_date, title, start_time, end_time, is_all_day) VALUES (?, ?, ?, ?, ?, ?)',
                [userId, date, title, startTime, endTime, allDay || false]);
            res.json({ success: true, id: result.insertId });
            return;
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/events/:userId/:eventId', async (req, res) => {
    const { userId, eventId } = req.params;
    
    try {
        await query('DELETE FROM calendar_events WHERE id = ? AND user_id = ?', 
            [eventId, userId]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== CHECKLIST ROUTES ====================

app.get('/api/checklist/:userId/:date', async (req, res) => {
    const { userId, date } = req.params;
    
    try {
        const results = await query('SELECT id, task_text, is_completed FROM checklist_tasks WHERE user_id = ? AND task_date = ? ORDER BY id', 
            [userId, date]);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/checklist', async (req, res) => {
    const { userId, date, tasks } = req.body;
    
    try {
        await query('DELETE FROM checklist_tasks WHERE user_id = ? AND task_date = ?', 
            [userId, date]);
        
        if (tasks.length === 0) {
            return res.json({ success: true });
        }
        
        const values = tasks.map(task => [userId, date, task.text, task.completed ? 1 : 0]);
        await query('INSERT INTO checklist_tasks (user_id, task_date, task_text, is_completed) VALUES ?', 
            [values]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});