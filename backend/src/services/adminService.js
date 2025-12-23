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
 * Convert array fields from string format to actual arrays
 * PostgreSQL may return arrays as strings, this converts them properly
 */
function convertArrayFields(rows, typeMap) {
  if (!Array.isArray(rows)) return rows;
  return rows.map(row => {
    const converted = { ...row };
    Object.entries(converted).forEach(([key, value]) => {
      const colType = typeMap.get(key);
      if (colType && colType.includes('[]') && typeof value === 'string' && value) {
        // PostgreSQL returns arrays as strings like "1,2,3"
        // Convert to actual array
        try {
          converted[key] = value.split(',').map(v => {
            const trimmed = v.trim();
            // Try to parse as number if it looks like one
            return isNaN(trimmed) ? trimmed : Number(trimmed);
          });
        } catch (e) {
          // Keep original value if conversion fails
          converted[key] = value;
        }
      }
    });
    return converted;
  });
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
// export async function getTableRows(tableName, limit = 500) {
//   const safe = sanitizeTableName(tableName);
//   if (!safe) throw new Error('Invalid table name');

//   // Get column type information to convert arrays properly
//   const cols = await getTableColumns(safe);
//   const typeMap = new Map(cols.map(c => [c.column_name, c.data_type]));

//   const q = `SELECT * FROM ${safe} LIMIT $1`;
//   const r = await pool.query(q, [limit]);

//   // Convert array fields from strings to actual arrays
//   const convertedRows = convertArrayFields(r.rows, typeMap);
//   return convertedRows;
// }

export async function getTableRows(tableName, limit = 500) {
  const safe = sanitizeTableName(tableName);
  if (!safe) throw new Error('Invalid table name');

  // Get column metadata
  const cols = await getTableColumns(safe);
  const typeMap = new Map(cols.map(c => [c.column_name, c.data_type]));

  let query = '';
  let params = [limit];

  // 🔹 SPECIAL LOGIC FOR CATEGORIES
  if (safe === 'categories') {
  query = `
    SELECT 
      c.id,
      c.name,
      COALESCE(
        (
          SELECT JSON_AGG(l.name)
          FROM locations l
          WHERE l.id = ANY(c.location_ids)
        ),
        '[]'::json
      ) AS location_ids
    FROM categories c
    LIMIT $1;
  `;
} else if (safe === 'software') {
  query = `
    SELECT 
      s.id,
      s.name,
      COALESCE(
        (
          SELECT JSON_AGG(l.name)
          FROM locations l
          WHERE l.id = ANY(s.location_ids)
        ),
        '[]'::json
      ) AS location_ids
    FROM software s
    LIMIT $1;
  `;
}
 else {
    query = `SELECT * FROM ${safe} LIMIT $1`;
  }

  const result = await pool.query(query, params);

  // Convert PG arrays correctly
  const convertedRows = convertArrayFields(result.rows, typeMap);

  return convertedRows;
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
  const typeMap = new Map(cols.map(c => [c.column_name, c.data_type]));

  const keys = Object.keys(data).filter(k => allowed.has(k));
  if (keys.length === 0) throw new Error('No valid columns provided');

  const colsSql = keys.map(k => `"${k}"`).join(', ');
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  const values = keys.map(k => {
    let value = data[k];
    const colType = typeMap.get(k);

    // Handle array types: ensure they are actual arrays
    if (colType && colType.includes('[]')) {
      if (value === null || value === undefined) return null;
      if (Array.isArray(value)) return value;

      // Handle string representation of arrays (e.g., "1,2,3" or "1, 2, 3")
      if (typeof value === 'string' && value.trim()) {
        try {
          return value.split(',').map(v => {
            const trimmed = v.trim();
            return isNaN(trimmed) ? trimmed : Number(trimmed);
          });
        } catch (e) {
          return [value];
        }
      }

      // Convert single value to array
      return [value];
    }
    return value;
  });

  const sql = `INSERT INTO ${safe} (${colsSql}) VALUES (${placeholders}) RETURNING *`;
  const result = await pool.query(sql, values);
  // Convert array fields in returned row
  const convertedRows = convertArrayFields(result.rows, typeMap);
  return convertedRows[0];
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
  const typeMap = new Map(cols.map(c => [c.column_name, c.data_type]));

  // do not allow updating pk via payload
  const keys = Object.keys(data).filter(k => allowed.has(k) && k !== pk);
  if (keys.length === 0) throw new Error('No valid updatable columns provided');

  const setClauses = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
  const values = keys.map(k => {
    let value = data[k];
    const colType = typeMap.get(k);

    // Handle array types: ensure they are actual arrays
    if (colType && colType.includes('[]')) {
      if (value === null || value === undefined) return null;
      if (Array.isArray(value)) return value;

      // Handle string representation of arrays (e.g., "1,2,3" or "1, 2, 3")
      if (typeof value === 'string' && value.trim()) {
        try {
          return value.split(',').map(v => {
            const trimmed = v.trim();
            return isNaN(trimmed) ? trimmed : Number(trimmed);
          });
        } catch (e) {
          return [value];
        }
      }

      // Convert single value to array
      return [value];
    }
    return value;
  });

  // add pk value as final param
  values.push(pkValue);

  const sql = `UPDATE ${safe} SET ${setClauses} WHERE "${pk}" = $${values.length} RETURNING *`;
  const result = await pool.query(sql, values);
  // Convert array fields in returned row
  const convertedRows = convertArrayFields(result.rows, typeMap);
  return convertedRows[0];
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