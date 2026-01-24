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

// export async function getTableRows(tableName, limit = 500) {
//   const safe = sanitizeTableName(tableName);
//   if (!safe) throw new Error('Invalid table name');

//   // Get column metadata
//   const cols = await getTableColumns(safe);
//   const typeMap = new Map(cols.map(c => [c.column_name, c.data_type]));

//   let query = '';
//   let params = [limit];

//   // 🔹 SPECIAL LOGIC FOR CATEGORIES
//   if (safe === 'categories') {
//     query = `
//     SELECT 
//       c.id,
//       c.name,
//       COALESCE(
//         (
//           SELECT JSON_AGG(l.name)
//           FROM locations l
//           WHERE l.id = ANY(c.location_ids)
//         ),
//         '[]'::json
//       ) AS location_ids
//     FROM categories c
//     LIMIT $1;
//   `;
//   } else if (safe === 'departments') {
//     query = `
//     SELECT 
//       d.id,
//       d.name,
//       COALESCE(
//         (
//           SELECT JSON_AGG(l.name)
//           FROM locations l
//           WHERE l.id = ANY(d.location_ids)
//         ),
//         '[]'::json
//       ) AS location_ids
//     FROM departments d
//     LIMIT $1;
//   `;
//   } else if (safe === 'divisions') {
//     query = `
// SELECT 
//   d.id,
//   d.name,
//   COALESCE(
//     (
//       SELECT JSON_AGG(dep.name)
//       FROM departments dep
//       WHERE dep.id = ANY (d.department_ids)
//     ),
//     '[]'::json
//   ) AS department_ids
// FROM divisions d
// LIMIT $1;

//   `;
//   }
//   else if(safe === 'licences'){
//     query = `
//     SELECT 
//       l.id,
//       l.name,
//       l.licence_key,
//       l.expiry_date,
//       l.vendor,
//       COALESCE(
//         (
//           SELECT JSON_AGG(s.name)
//           FROM locations s
//           WHERE s.id = ANY(l.location_ids)
//         ),
//         '[]'::json
//       ) AS location_ids
//     FROM licences l
//     LIMIT $1;
//   `;
//   }
//   else if (safe === 'software') {
//     query = `
//     SELECT 
//       s.id,
//       s.name,
//       COALESCE(
//         (
//           SELECT JSON_AGG(l.name)
//           FROM locations l
//           WHERE l.id = ANY(s.location_ids)
//         ),
//         '[]'::json
//       ) AS location_ids
//     FROM software s
//     LIMIT $1;
//   `;
//   }
//   else {
//     query = `SELECT * FROM ${safe} LIMIT $1`;
//   }

//   const result = await pool.query(query, params);

//   // Convert PG arrays correctly
//   const convertedRows = convertArrayFields(result.rows, typeMap);

//   return convertedRows;
// }

export async function getTableRows(tableName, limit = 500) {
  const safe = sanitizeTableName(tableName);
  if (!safe) throw new Error('Invalid table name');

  // 🔹 Get column metadata
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
  } else if (safe === 'departments') {
    query = `
      SELECT 
        d.id,
        d.name,
        COALESCE(
          (
            SELECT JSON_AGG(l.name)
            FROM locations l
            WHERE l.id = ANY(d.location_ids)
          ),
          '[]'::json
        ) AS location_ids
      FROM departments d
      LIMIT $1;
    `;
  } else if (safe === 'divisions') {
    query = `
      SELECT 
        d.id,
        d.name,
        COALESCE(
          (
            SELECT JSON_AGG(dep.name)
            FROM departments dep
            WHERE dep.id = ANY(d.department_ids)
          ),
          '[]'::json
        ) AS department_ids
      FROM divisions d
      LIMIT $1;
    `;
  } else if (safe === 'licences') {
    query = `
      SELECT 
        l.id,
        l.name,
        l.licence_key,
        l.version,
        COALESCE(
          (
            SELECT JSON_AGG(s.name)
            FROM locations s
            WHERE s.id = ANY(l.location_ids)
          ),
          '[]'::json
        ) AS location_ids
      FROM licences l
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
  } else {
    query = `SELECT * FROM ${safe} LIMIT $1`;
  }

  const result = await pool.query(query, params);

  // 🔹 Convert PG arrays correctly
  let convertedRows = convertArrayFields(result.rows, typeMap);

  // 🔹 Convert DB date → DD/MM/YYYY
  convertedRows = convertedRows.map(row => {
    const updatedRow = { ...row };

    for (const [column, colType] of typeMap.entries()) {
      if (
        updatedRow[column] &&
        (colType === 'date' || colType.includes('timestamp'))
      ) {
        const date = new Date(updatedRow[column]);
        if (!isNaN(date)) {
          const dd = String(date.getDate()).padStart(2, '0');
          const mm = String(date.getMonth() + 1).padStart(2, '0');
          const yyyy = date.getFullYear();
          updatedRow[column] = `${dd}/${mm}/${yyyy}`;
        }
      }
    }

    return updatedRow;
  });

  return convertedRows;
}



/**
 * Create a record in a table.
 * - Only columns present in information_schema are allowed (prevents injection).
 * - Returns the inserted row (RETURNING *).
 */
// export async function createTableRecord(tableName, data) {
//   const safe = sanitizeTableName(tableName);
//   if (!safe) throw new Error('Invalid table name');
//   if (!data || typeof data !== 'object') throw new Error('Invalid data');

//   // fetch allowed columns
//   const cols = await getTableColumns(safe);
//   const allowed = new Set(cols.map(c => c.column_name));
//   const typeMap = new Map(cols.map(c => [c.column_name, c.data_type]));

//   const keys = Object.keys(data).filter(k => allowed.has(k));
//   if (keys.length === 0) throw new Error('No valid columns provided');

//   const colsSql = keys.map(k => `"${k}"`).join(', ');
//   const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
//   const values = keys.map(k => {
//     let value = data[k];
//     const colType = typeMap.get(k);

//     // Handle array types: ensure they are actual arrays
//     if (colType && colType.includes('[]')) {
//       if (value === null || value === undefined) return null;
//       if (Array.isArray(value)) return value;

//       // Handle string representation of arrays (e.g., "1,2,3" or "1, 2, 3")
//       if (typeof value === 'string' && value.trim()) {
//         try {
//           return value.split(',').map(v => {
//             const trimmed = v.trim();
//             return isNaN(trimmed) ? trimmed : Number(trimmed);
//           });
//         } catch (e) {
//           return [value];
//         }
//       }

//       // Convert single value to array
//       return [value];
//     }
//     return value;
//   });

//   const sql = `INSERT INTO ${safe} (${colsSql}) VALUES (${placeholders}) RETURNING *`;
//   const result = await pool.query(sql, values);
//   // Convert array fields in returned row
//   const convertedRows = convertArrayFields(result.rows, typeMap);
//   return convertedRows[0];
// }

export async function createTableRecord(tableName, data) {
  const safe = sanitizeTableName(tableName);
  if (!safe) throw new Error('Invalid table name');
  if (!data || typeof data !== 'object') throw new Error('Invalid data');

  // Fetch allowed columns + data types
  const cols = await getTableColumns(safe);
  const allowed = new Set(cols.map(c => c.column_name));
  const typeMap = new Map(cols.map(c => [c.column_name, c.data_type]));

  // Filter only allowed columns
  const keys = Object.keys(data).filter(k => allowed.has(k));
  if (keys.length === 0) throw new Error('No valid columns provided');

  const colsSql = keys.map(k => `"${k}"`).join(', ');
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

  const values = keys.map(k => {
    let value = data[k];
    const colType = typeMap.get(k);

    // 🔹 Normalize undefined / empty string
    if (value === undefined || value === '') {
      return null;
    }

    // 🔹 DATE / TIMESTAMP
    if (colType === 'date' || colType?.includes('timestamp')) {
      return value ? value : null;
    }

    // 🔹 ARRAY TYPES (int[], text[], etc.)
    if (colType && colType.includes('[]')) {
      if (value === null) return null;

      // Already an array
      if (Array.isArray(value)) return value;

      // CSV string → array
      if (typeof value === 'string' && value.trim()) {
        return value.split(',').map(v => {
          const trimmed = v.trim();
          return isNaN(trimmed) ? trimmed : Number(trimmed);
        });
      }

      // Single value → array
      return [value];
    }

    // 🔹 Numeric columns (extra safety)
    if (
      ['integer', 'bigint', 'smallint', 'numeric', 'real', 'double precision']
        .includes(colType)
    ) {
      return value === null ? null : Number(value);
    }

    // 🔹 Default (text, varchar, etc.)
    return value;
  });

  const sql = `
    INSERT INTO ${safe} (${colsSql})
    VALUES (${placeholders})
    RETURNING *
  `;

  const result = await pool.query(sql, values);

  // Convert array fields in returned row (if needed)
  const convertedRows = convertArrayFields(result.rows, typeMap);

  return convertedRows[0];
}

function convertDdMmYyyyToDbFormat(value, colType) {
  if (typeof value !== 'string') return value;

  // Match DD/MM/YYYY
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return value;

  const [, day, month, year] = match;

  // DATE
  if (colType === 'date') {
    return `${year}-${month}-${day}`;
  }

  // TIMESTAMP
  if (colType.includes('timestamp')) {
    return `${year}-${month}-${day} 00:00:00`;
  }

  return value;
}

function convertDbDateToDdMmYyyy(value, colType) {
  if (!value) return value;

  // Handle DATE (YYYY-MM-DD)
  if (colType === 'date') {
    const date = new Date(value);
    if (isNaN(date)) return value;

    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();

    return `${dd}/${mm}/${yyyy}`;
  }

  // Handle TIMESTAMP
  if (colType.includes('timestamp')) {
    const date = new Date(value);
    if (isNaN(date)) return value;

    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();

    return `${dd}/${mm}/${yyyy}`;
  }

  return value;
}



/**
 * Update a record in a table by primary key.
 * - Only columns present in information_schema are allowed (prevents injection).
 * - pkValue must be provided.
 * - Returns the updated row (RETURNING *).
 */
// export async function updateTableRecord(tableName, pkValue, data) {
//   console.log(data)
//   const safe = sanitizeTableName(tableName);
//   if (!safe) throw new Error('Invalid table name');
//   if (!data || typeof data !== 'object') throw new Error('Invalid data');

//   const pk = await getPrimaryKeyColumn(safe) || 'id';
//   if (pk == null) throw new Error('Primary key not found');

//   // fetch allowed columns
//   const cols = await getTableColumns(safe);
//   const allowed = new Set(cols.map(c => c.column_name));
//   const typeMap = new Map(cols.map(c => [c.column_name, c.data_type]));

//   // do not allow updating pk via payload
//   const keys = Object.keys(data).filter(k => allowed.has(k) && k !== pk);
//   if (keys.length === 0) throw new Error('No valid updatable columns provided');

//   const setClauses = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
//   const values = keys.map(k => {
//     let value = data[k];
//     const colType = typeMap.get(k);

//     // Handle array types: ensure they are actual arrays
//     if (colType && colType.includes('[]')) {
//       if (value === null || value === undefined) return null;
//       if (Array.isArray(value)) return value;

//       // Handle string representation of arrays (e.g., "1,2,3" or "1, 2, 3")
//       if (typeof value === 'string' && value.trim()) {
//         try {
//           return value.split(',').map(v => {
//             const trimmed = v.trim();
//             return isNaN(trimmed) ? trimmed : Number(trimmed);
//           });
//         } catch (e) {
//           return [value];
//         }
//       }

//       // Convert single value to array
//       return [value];
//     }
//     return value;
//   });

//   // add pk value as final param
//   values.push(pkValue);

//   const sql = `UPDATE ${safe} SET ${setClauses} WHERE "${pk}" = $${values.length} RETURNING *`;
//   const result = await pool.query(sql, values);
//   // Convert array fields in returned row
//   const convertedRows = convertArrayFields(result.rows, typeMap);
//   return convertedRows[0];
// }
export async function updateTableRecord(tableName, pkValue, data) {
  console.log(data);
  const safe = sanitizeTableName(tableName);
  if (!safe) throw new Error('Invalid table name');
  if (!data || typeof data !== 'object') throw new Error('Invalid data');

  const pk = (await getPrimaryKeyColumn(safe)) || 'id';
  if (!pk) throw new Error('Primary key not found');

  const cols = await getTableColumns(safe);
  const allowed = new Set(cols.map(c => c.column_name));
  const typeMap = new Map(cols.map(c => [c.column_name, c.data_type]));

  const keys = Object.keys(data).filter(
    k => allowed.has(k) && k !== pk
  );

  if (keys.length === 0)
    throw new Error('No valid updatable columns provided');

  const setClauses = keys
    .map((k, i) => `"${k}" = $${i + 1}`)
    .join(', ');

  const values = keys.map(k => {
    let value = data[k];
    const colType = typeMap.get(k);

    /* 🔹 ARRAY HANDLING */
    if (colType && colType.includes('[]')) {
      if (value == null) return null;
      if (Array.isArray(value)) return value;

      if (typeof value === 'string' && value.trim()) {
        return value.split(',').map(v => {
          const trimmed = v.trim();
          return isNaN(trimmed) ? trimmed : Number(trimmed);
        });
      }
      return [value];
    }

    /* 🔹 DATE / TIMESTAMP HANDLING */
    if (colType && (colType === 'date' || colType.includes('timestamp'))) {
      return convertDdMmYyyyToDbFormat(value, colType);
    }

    return value;
  });

  values.push(pkValue);

  const sql = `
    UPDATE ${safe}
    SET ${setClauses}
    WHERE "${pk}" = $${values.length}
    RETURNING *
  `;

  const result = await pool.query(sql, values);
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