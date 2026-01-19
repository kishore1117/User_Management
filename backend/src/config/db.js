import pkg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pkg;

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename)


// const pool = new Pool({
//   user: process.env.IP_USER,
//   host: process.env.IP_HOST,
//   database: process.env.IP_DATABASE,
//   password: String(process.env.IP_PASSWORDS),
//   port: parseInt(process.env.IP_PORT, 10),  // ensure port is a number
// });
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'inventory_management',
  password: 'Postgres@123',
  port: 5432,
});
export async function initDB() {
  try {
    // Read schema.sql content
    const schemaPath = path.join(__dirname, "schema.sql");
    const schemaSQL = fs.readFileSync(schemaPath, "utf8");

    // Run the entire schema file
    await pool.query(schemaSQL);
    console.log("✅ All tables are ready (or already exist)");
  } catch (err) {
    console.error("❌ Error initializing database:", err.message);
  }
}

export default { pool, initDB };
