import pkg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const { Pool } = pkg;

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'userInfo',
  password: 'admin',
  port: 5433,
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