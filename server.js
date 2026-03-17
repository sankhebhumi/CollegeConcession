const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error("Database error: " + err.message);
});

// AUTHENTICATION APIs
app.post('/api/login', (req, res) => {
    const { username, password, role } = req.body;
    
    if (role === 'admin') {
        db.get("SELECT id, username FROM admins WHERE username = ? AND password = ?", [username, password], (err, row) => {
            if (err) return res.status(500).json({ success: false, message: 'Server error' });
            if (row) return res.json({ success: true, user: { id: row.id, role: 'admin', username: row.username } });
            return res.json({ success: false, message: 'Invalid admin credentials' });
        });
    } else {
        db.get("SELECT id, name, roll_no, branch FROM students WHERE roll_no = ? AND password = ?", [username, password], (err, row) => {
            if (err) return res.status(500).json({ success: false, message: 'Server error' });
            if (row) return res.json({ success: true, user: { id: row.id, role: 'student', name: row.name, roll_no: row.roll_no, branch: row.branch } });
            return res.json({ success: false, message: 'Invalid student credentials' });
        });
    }
});

// STUDENT APIs
app.post('/api/apply', (req, res) => {
    const { student_id, from_station, to_station } = req.body;
    db.run("INSERT INTO applications (student_id, from_station, to_station, status) VALUES (?, ?, ?, 'Pending')", 
        [student_id, from_station, to_station], 
        function(err) {
            if (err) {
                console.error("SQL Error in /apply:", err);
                return res.status(500).json({ success: false, message: 'Failed to submit application' });
            }
            res.json({ success: true, application_id: this.lastID, message: 'Application submitted successfully' });
        }
    );
});

app.get('/api/applications/:student_id', (req, res) => {
    const student_id = req.params.student_id;
    db.all("SELECT * FROM applications WHERE student_id = ? ORDER BY date_applied DESC", [student_id], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: 'Database error' });
        res.json({ success: true, applications: rows });
    });
});

// ADMIN APIs
app.get('/api/admin/applications', (req, res) => {
    const query = `
        SELECT a.id, a.from_station, a.to_station, a.status, a.date_applied,
               s.name, s.roll_no, s.branch, s.id as student_id
        FROM applications a
        JOIN students s ON a.student_id = s.id
        ORDER BY a.date_applied DESC
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: 'Database error' });
        
        let total = rows.length;
        let pending = rows.filter(r => r.status === 'Pending').length;
        let approved = rows.filter(r => r.status === 'Approved').length;
        let rejected = rows.filter(r => r.status === 'Rejected').length;
        
        res.json({ 
            success: true, 
            applications: rows,
            analytics: { total, pending, approved, rejected }
        });
    });
});

app.post('/api/admin/applications/:id/status', (req, res) => {
    const { status } = req.body;
    const { id } = req.params;
    
    if (!['Approved', 'Rejected'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    db.run("UPDATE applications SET status = ? WHERE id = ?", [status, id], function(err) {
        if (err) return res.status(500).json({ success: false, message: 'Failed to update status' });
        res.json({ success: true, message: `Application ${status.toLowerCase()}` });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});