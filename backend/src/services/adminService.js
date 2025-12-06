// --- SERVICE: table admin helpers ---
// Add these to backend/src/services/userService.js (adjust placement to match export style)

import db from '../config/db.js'; // if not already imported in this file
const { pool } = db;

/**
 * Ensure simple safe table name (only letters, numbers, underscore)
 * Returns sanitized name or null if invalid.
 */
function sanitizeTableName(tableName) {
  if (!tableName || typeof tableName !== 'string') return null;
  const safe = tableName.trim();
  // allow only a-zA-Z0-9_ (no schema qualifiers)
  if (!/^[a-zA-Z0-9_]+$/.test(safe)) return null;
  return safe;
}

/**
 * Validate table exists in current search_path
 */
export async function tableExists(tableName) {
  const safe = sanitizeTableName(tableName);
  if (!safe) return false;
  const q = `SELECT 1 FROM information_schema.tables WHERE table_name = $1 AND table_type='BASE TABLE' LIMIT 1`;
  const r = await pool.query(q, [safe]);
  return r.rowCount > 0;
}

/**
 * Get columns for a table. Returns array like [{ column_name, data_type, is_nullable, column_default }]
 */
export async function getTableColumns(tableName) {
  const safe = sanitizeTableName(tableName);
  if (!safe) throw new Error('Invalid table name');
  const q = `
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = $1
    ORDER BY ordinal_position
  `;
  const r = await pool.query(q, [safe]);
  return r.rows;
}

/**
 * Get primary key column for table if any (returns column_name or null)
 */
export async function getPrimaryKeyColumn(tableName) {
  const safe = sanitizeTableName(tableName);
  if (!safe) throw new Error('Invalid table name');
  const q = `
    SELECT kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY'
      AND tc.table_name = $1
    ORDER BY kcu.ordinal_position
    LIMIT 1
  `;
  const r = await pool.query(q, [safe]);
  return r.rows[0]?.column_name || null;
}

/**
 * Fetch rows for a table with an optional limit
 */
export async function getTableRows(tableName, limit = 500) {
  const safe = sanitizeTableName(tableName);
  if (!safe) throw new Error('Invalid table name');
  const q = `SELECT * FROM ${safe} LIMIT $1`;
  const r = await pool.query(q, [limit]);
  return r.rows;
}

/**
 * Create a record in a table.
 * - Only columns present in information_schema are allowed (prevents injection).
 * - Returns the inserted row (RETURNING *).
 */
export async function createTableRecord(tableName, data) {
  const safe = sanitizeTableName(tableName);
  if (!safe) throw new Error('Invalid table name');
  if (!data || typeof data !== 'object') throw new Error('Invalid data');

  // fetch allowed columns
  const cols = await getTableColumns(safe);
  const allowed = new Set(cols.map(c => c.column_name));

  const keys = Object.keys(data).filter(k => allowed.has(k));
  if (keys.length === 0) throw new Error('No valid columns provided');

  const colsSql = keys.map(k => `"${k}"`).join(', ');
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  const values = keys.map(k => data[k]);

  const sql = `INSERT INTO ${safe} (${colsSql}) VALUES (${placeholders}) RETURNING *`;
  const result = await pool.query(sql, values);
  return result.rows[0];
}

/**
 * Update a record in a table by primary key.
 * - Only columns present in information_schema are allowed (prevents injection).
 * - pkValue must be provided.
 * - Returns the updated row (RETURNING *).
 */
export async function updateTableRecord(tableName, pkValue, data) {
  const safe = sanitizeTableName(tableName);
  if (!safe) throw new Error('Invalid table name');
  if (!data || typeof data !== 'object') throw new Error('Invalid data');

  const pk = await getPrimaryKeyColumn(safe) || 'id';
  if (pk == null) throw new Error('Primary key not found');

  // fetch allowed columns
  const cols = await getTableColumns(safe);
  const allowed = new Set(cols.map(c => c.column_name));
  // do not allow updating pk via payload
  const keys = Object.keys(data).filter(k => allowed.has(k) && k !== pk);
  if (keys.length === 0) throw new Error('No valid updatable columns provided');

  const setClauses = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
  const values = keys.map(k => data[k]);
  // add pk value as final param
  values.push(pkValue);

  const sql = `UPDATE ${safe} SET ${setClauses} WHERE "${pk}" = $${values.length} RETURNING *`;
  const result = await pool.query(sql, values);
  return result.rows[0];
}

/**
 * Delete a record by primary key
 */
export async function deleteTableRecord(tableName, pkValue) {
  const safe = sanitizeTableName(tableName);
  if (!safe) throw new Error('Invalid table name');
  const pk = await getPrimaryKeyColumn(safe) || 'id';
  const sql = `DELETE FROM ${safe} WHERE "${pk}" = $1 RETURNING *`;
  const result = await pool.query(sql, [pkValue]);
  return result.rows[0];
}