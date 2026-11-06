const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const db = require("./database");

const app = express();

app.use(express.json());
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));

app.use(session({
    secret: "change-this-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: "lax"
    }
}));

app.use(express.static("public"));

function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ message: "Please login" });
    }
    next();
}

// Register
app.post("/api/register", async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password ||
        !["teacher", "student"].includes(role)) {
        return res.status(400).json({ message: "Invalid details" });
    }

    try {
        const hash = await bcrypt.hash(password, 10);

        db.query(
            "INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)",
            [name, email, hash, role],
            (err) => {
                if (err) {
                    return res.status(400).json({
                        message: "Registration failed or email already exists"
                    });
                }

                res.json({ message: "Registration successful" });
            }
        );
    } catch {
        res.status(500).json({ message: "Server error" });
    }
});

// Login
app.post("/api/login", (req, res) => {
    const { email, password } = req.body;

    db.query(
        "SELECT * FROM users WHERE email = ?",
        [email],
        async (err, results) => {
            if (err || results.length === 0) {
                return res.status(401).json({
                    message: "Invalid email or password"
                });
            }

            const user = results[0];
            const valid = await bcrypt.compare(password, user.password);

            if (!valid) {
                return res.status(401).json({
                    message: "Invalid email or password"
                });
            }

            req.session.user = {
                id: user.id,
                name: user.name,
                role: user.role
            };

            res.json({
                message: "Login successful",
                user: req.session.user
            });
        }
    );
});

// Current user
app.get("/api/me", requireLogin, (req, res) => {
    res.json(req.session.user);
});

// Mark attendance
app.post("/api/attendance", requireLogin, (req, res) => {
    const { user_id, status } = req.body;
    const current = req.session.user;

    if (!["Present", "Absent"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
    }

    if (current.role === "student" && Number(user_id) !== current.id) {
        return res.status(403).json({ message: "Access denied" });
    }

    if (!["teacher", "admin", "student"].includes(current.role)) {
        return res.status(403).json({ message: "Access denied" });
    }

    const date = new Date().toISOString().slice(0, 10);

    db.query(
        `INSERT INTO attendance (user_id,date,status,marked_by)
         VALUES (?,?,?,?)
         ON DUPLICATE KEY UPDATE status=VALUES(status), marked_by=VALUES(marked_by)`,
        [user_id, date, status, current.id],
        (err) => {
            if (err) {
                return res.status(500).json({ message: "Attendance failed" });
            }

            res.json({ message: "Attendance saved successfully" });
        }
    );
});

// View attendance
app.get("/api/attendance", requireLogin, (req, res) => {
    const current = req.session.user;

    let sql = `
        SELECT a.*, u.name, u.role
        FROM attendance a
        JOIN users u ON a.user_id = u.id
    `;

    const params = [];

    if (current.role === "student") {
        sql += " WHERE a.user_id = ?";
        params.push(current.id);
    }

    sql += " ORDER BY a.date DESC";

    db.query(sql, params, (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Could not load records" });
        }

        res.json(results);
    });
});

// Logout
app.post("/api/logout", (req, res) => {
    req.session.destroy(() => {
        res.json({ message: "Logged out" });
    });
});

app.listen(3000, () => {
    console.log("Website running at http://localhost:3000");
});