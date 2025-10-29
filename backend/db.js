const { Pool } = require('pg');
require('dotenv').config(); // Load environment variables from .env file

const pool = new Pool({
  user: process.env.IP_USER,
  host: process.env.IP_HOST,
  database: process.env.IP_DATABASE,
  password: process.env.IP_PASSWORD,
  port: process.env.IP_PORT,
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
