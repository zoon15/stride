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

// MySQL Connection
const db = mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'stride_db'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to MySQL database');
    
    // Create tables if they don't exist
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
            start_time TIME,
            end_time TIME,
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
    
    db.query(createUsersTable);
    db.query(createJournalTable);
    db.query(createEventsTable);
    db.query(createChecklistTable);
    console.log('Tables ready');
});

// ==================== USER ROUTES ====================

// Signup
app.post('/api/signup', async (req, res) => {
    const { name, email, password } = req.body;
    
    // Check if user exists
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length > 0) return res.status(400).json({ error: 'Email already exists' });
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user
        db.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', 
            [name, email, hashedPassword], 
            (err, result) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ 
                    success: true, 
                    user: { id: result.insertId, name, email } 
                });
            });
    });
});

// Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(400).json({ error: 'User not found' });
        
        const user = results[0];
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) return res.status(400).json({ error: 'Invalid password' });
        
        res.json({ 
            success: true, 
            user: { id: user.id, name: user.name, email: user.email } 
        });
    });
});

// ==================== JOURNAL ROUTES ====================

// Get journal entry for a date
app.get('/api/journal/:userId/:date', (req, res) => {
    const { userId, date } = req.params;
    
    db.query('SELECT mood, content FROM journal_entries WHERE user_id = ? AND entry_date = ?', 
        [userId, date], 
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results[0] || null);
        });
});

// Save journal entry
app.post('/api/journal', (req, res) => {
    const { userId, date, mood, content } = req.body;
    
    db.query(
        `INSERT INTO journal_entries (user_id, entry_date, mood, content) 
         VALUES (?, ?, ?, ?) 
         ON DUPLICATE KEY UPDATE mood = ?, content = ?`,
        [userId, date, mood, content, mood, content],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
});

// Get all journal entries for a user
app.get('/api/journal/all/:userId', (req, res) => {
    const { userId } = req.params;
    
    db.query('SELECT entry_date, mood, content FROM journal_entries WHERE user_id = ? ORDER BY entry_date DESC', 
        [userId], 
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
});

// Delete journal entry
app.delete('/api/journal/:userId/:date', (req, res) => {
    const { userId, date } = req.params;
    
    db.query('DELETE FROM journal_entries WHERE user_id = ? AND entry_date = ?', 
        [userId, date], 
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
});

// ==================== EVENTS ROUTES ====================

// Get events for a month
app.get('/api/events/:userId/:year/:month', (req, res) => {
    const { userId, year, month } = req.params;
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = `${year}-${month.padStart(2, '0')}-31`;
    
    db.query(
        'SELECT * FROM calendar_events WHERE user_id = ? AND event_date BETWEEN ? AND ? ORDER BY event_date',
        [userId, startDate, endDate],
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
});

// Save event
app.post('/api/events', (req, res) => {
    const { userId, id, date, title, startTime, endTime, allDay } = req.body;
    
    if (id) {
        // Update existing event
        db.query(
            'UPDATE calendar_events SET title = ?, start_time = ?, end_time = ?, is_all_day = ? WHERE id = ? AND user_id = ?',
            [title, startTime, endTime, allDay, id, userId],
            (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true });
            });
    } else {
        // Create new event
        db.query(
            'INSERT INTO calendar_events (user_id, event_date, title, start_time, end_time, is_all_day) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, date, title, startTime, endTime, allDay],
            (err, result) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true, id: result.insertId });
            });
    }
});

// Delete event
app.delete('/api/events/:userId/:eventId', (req, res) => {
    const { userId, eventId } = req.params;
    
    db.query('DELETE FROM calendar_events WHERE id = ? AND user_id = ?', 
        [eventId, userId], 
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
});

// ==================== CHECKLIST ROUTES ====================

// Get checklist for a date
app.get('/api/checklist/:userId/:date', (req, res) => {
    const { userId, date } = req.params;
    
    db.query('SELECT * FROM checklist_tasks WHERE user_id = ? AND task_date = ? ORDER BY id', 
        [userId, date], 
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
});

// Save checklist tasks
app.post('/api/checklist', (req, res) => {
    const { userId, date, tasks } = req.body;
    
    // First delete existing tasks for this date
    db.query('DELETE FROM checklist_tasks WHERE user_id = ? AND task_date = ?', 
        [userId, date], 
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            
            if (tasks.length === 0) {
                return res.json({ success: true });
            }
            
            // Insert new tasks
            const values = tasks.map(task => [userId, date, task.text, task.completed]);
            db.query('INSERT INTO checklist_tasks (user_id, task_date, task_text, is_completed) VALUES ?', 
                [values], 
                (err) => {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ success: true });
                });
        });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});