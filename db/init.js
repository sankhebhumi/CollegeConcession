const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Error opening database " + err.message);
    } else {
        console.log("Connected to the SQLite database.");
    }
});

db.serialize(() => {
    // 1. Create Admins Table
    db.run(`CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    )`);

    // 2. Create Students Table
    db.run(`CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        roll_no TEXT UNIQUE,
        branch TEXT,
        password TEXT
    )`);

    // 3. Create Applications Table
    db.run(`CREATE TABLE IF NOT EXISTS applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        from_station TEXT,
        to_station TEXT,
        status TEXT DEFAULT 'Pending',
        date_applied DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id)
    )`);

    // 4. Seed Admin
    db.get("SELECT * FROM admins WHERE username = 'admin'", (err, row) => {
        if (!row) {
            db.run("INSERT INTO admins (username, password) VALUES ('admin', 'admin123')", (err) => {
                if (!err) console.log("Seeded default admin (admin / admin123)");
            });
        }
    });

    // 5. Seed Student
    db.get("SELECT * FROM students WHERE roll_no = '101'", (err, row) => {
        if (!row) {
            db.run("INSERT INTO students (name, roll_no, branch, password) VALUES ('John Doe', '101', 'Computer Science', 'student123')", (err) => {
                if (!err) {
                    console.log("Seeded sample student (101 / student123)");

                    // Seed a sample application for this student
                    db.get("SELECT id FROM students WHERE roll_no = '101'", (err, srow) => {
                        if (srow) {
                            db.run("INSERT INTO applications (student_id, from_station, to_station, status) VALUES (?, 'Mumbai Central', 'Borivali', 'Pending')", [srow.id], (err) => {
                                if (!err) console.log("Seeded sample application for John Doe");
                            });
                        }
                    });
                }
            });
        }
    });
});

// Give it a second to finish inserting before closing
setTimeout(() => {
    db.close();
    console.log("Database initialized successfully.");
}, 1000);
