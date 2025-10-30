const { Pool } = require('pg');// Load environment variables from .env file

const pool = new Pool({
  user: 'myuser',
  host: 'localhost',
  database: 'user_management',
  password: 'password1',
  port: 5432,
});

// SQL to create users table if it doesn't exist
const createTableQuery = `
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    hostname VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    department VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

// Function to initialize DB
async function initDB() {
  try {
    await pool.query(createTableQuery);
    console.log('✅ Users table is ready (or already exists)');
  } catch (err) {
    console.error('❌ Error creating users table:', err);
  }
}

module.exports = { pool, initDB };
