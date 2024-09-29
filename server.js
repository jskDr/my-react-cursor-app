const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const os = require('os');
const fs = require('fs');

const app = express();
app.use(express.json());

// Create .todo_cursor directory in home folder if it doesn't exist
const homeDir = os.homedir();
const todoDirPath = path.join(homeDir, '.todo_cursor');
if (!fs.existsSync(todoDirPath)) {
  fs.mkdirSync(todoDirPath);
}

const dbPath = path.join(todoDirPath, 'todos.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err);
    process.exit(1); // Exit the process if we can't open the database
  }
  console.log('Connected to the SQLite database.');
});

// Create todos table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  text TEXT,
  completed INTEGER
)`);

db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='todos'", (err, row) => {
  if (err) {
    console.error('Error checking for todos table:', err);
    return;
  }
  if (!row) {
    console.log('Todos table does not exist. Creating it now...');
    db.run(`CREATE TABLE todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT,
      completed INTEGER
    )`, (err) => {
      if (err) {
        console.error('Error creating todos table:', err);
      } else {
        console.log('Todos table created successfully.');
      }
    });
  } else {
    console.log('Todos table exists.');
  }
});

app.post('/api/store-todos', (req, res) => {
  const { todos } = req.body;
  
  // Clear existing todos
  db.run('DELETE FROM todos', (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to clear existing todos' });
    }
    
    // Insert new todos
    const stmt = db.prepare('INSERT INTO todos (text, completed) VALUES (?, ?)');
    todos.forEach((todo) => {
      stmt.run(todo.text, todo.completed ? 1 : 0);
    });
    stmt.finalize();
    
    res.json({ message: 'Todos stored successfully' });
  });
});

app.get('/api/retrieve-todos', (req, res) => {
  db.all('SELECT * FROM todos', (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to retrieve todos', details: err.message });
    }
    
    if (!rows) {
      console.log('No rows returned from database');
      return res.status(404).json({ error: 'No todos found' });
    }
    
    const todos = rows.map(row => ({
      id: row.id,
      text: row.text,
      completed: row.completed === 1
    }));
    
    console.log('Retrieved todos:', todos);
    res.json(todos);
  });
});

// Add this error handling middleware at the end of your routes
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!', details: err.message });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
