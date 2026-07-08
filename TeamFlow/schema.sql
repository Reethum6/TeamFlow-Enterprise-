-- 👤 Users table to manage access profiles
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('Developer', 'Manager')) NOT NULL
);

-- 🃏 Tasks table to represent Kanban board nodes
CREATE TABLE tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT CHECK(status IN ('Todo', 'In Progress', 'Review', 'Done')) DEFAULT 'Todo',
    assigned_to TEXT,
    project_id TEXT DEFAULT 'project_alpha',
    FOREIGN KEY (assigned_to) REFERENCES users(username)
);

-- 🧪 Quality Gate Reviews table linked directly to tasks
CREATE TABLE reviews (
    task_id TEXT PRIMARY KEY,
    status TEXT CHECK(status IN ('Pending', 'Approved', 'Rejected')) DEFAULT 'Pending',
    comments TEXT,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- 💬 Threaded Comments table for developer discussions
CREATE TABLE comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT NOT NULL,
    username TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (username) REFERENCES users(username)
);

-- 🖥️ Telemetry Logs table for live system auditing
CREATE TABLE system_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);