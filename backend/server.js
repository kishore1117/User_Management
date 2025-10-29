const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { initDB, pool } = require('./db');

const app = express();
app.use(cors());
app.use(bodyParser.json());

initDB();
// ✅ Add new user
app.post("/api/users", (req, res) => {
  const { name, hostname, ipAddress, department } = req.body;
  if (!name || !hostname || !ipAddress || !department) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const query = "INSERT INTO users (name, hostname, ip_address, department) VALUES ($1, $2, $3, $4)";
  pool.query(query, [name, hostname, ipAddress, department], (err) => {
    if (err) {
      console.error("Error inserting user:", err);
      return res.status(500).json({ message: "Database error while adding user" });
    }
    res.status(201).json({ message: "User added successfully" });
  });
});

// 🔍 Find user
// app.post('/api/users/search', async (req, res) => {
//   const { name, hostname, ipAddress } = req.body;
//   try {
//     const result = await pool.query(
//       `SELECT * FROM users WHERE 
//         ($1::text IS NULL OR name ILIKE '%' || $1 || '%') AND
//         ($2::text IS NULL OR hostname ILIKE '%' || $2 || '%') AND
//         ($3::text IS NULL OR ip_address ILIKE '%' || $3 || '%')`,
//       [name || null, hostname || null, ipAddress || null]
//     );
//     res.json(result.rows);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json([]);
//   }
// });

app.post('/api/users/search', async (req, res) => {
  const { name, hostname, ipAddress } = req.body;

  try {
    let query = 'SELECT * FROM users WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    // 🔹 Case-insensitive exact match for name
    if (name) {
      query += ` AND LOWER(TRIM(name)) = LOWER(TRIM($${paramIndex++}))`;
      params.push(name.trim());
    }

    // 🔹 Case-insensitive exact match for hostname
    if (hostname) {
      query += ` AND LOWER(TRIM(hostname)) = LOWER(TRIM($${paramIndex++}))`;
      params.push(hostname.trim());
    }

    // 🔹 Case-insensitive exact match for IP Address
    if (ipAddress) {
      query += ` AND LOWER(TRIM(ip_address)) = LOWER(TRIM($${paramIndex++}))`;
      params.push(ipAddress.trim());
    }

    // 🧩 Debugging: log final query (optional)
    console.log('Running query:', query, params);

    const result = await pool.query(query, params);

    // ✅ Return only one record if IP address is searched
    if (ipAddress) {
      return res.json(result.rows.length ? [result.rows[0]] : []);
    }

    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error searching users:', err);
    res.status(500).json({ error: 'Database error' });
  }
});
;



app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, hostname, ip_address, department } = req.body;

  try {
    const result = await pool.query(
      `UPDATE users
       SET name = $1, hostname = $2, ip_address = $3, department = $4
       WHERE id = $5
       RETURNING *`,
      [name, hostname, ip_address, department, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error updating user:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: '🗑️ User deleted successfully', deletedUser: result.rows[0] });
  } catch (err) {
    console.error('❌ Error deleting user:', err);
    res.status(500).json({ error: 'Database error' });
  }
});


const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});

const upload = multer({ storage: storage });

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Bulk upload endpoint
app.post('/api/users/bulk', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    // Read Excel file
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    // Process and insert data
    const results = {
      total: data.length,
      success: 0,
      failed: 0,
      errors: []
    };

    for (const row of data) {
      console.log('Processing row:', row);
      try {
        // Prepare user data with NA for missing values
        const userData = {
          name: row.name || 'NA',
          hostname: row.hostname || 'NA',
          ip_address: row.ip_address || row.ipAddress || 'NA', // handle both column names
          department: row.department || 'NA'
        };

        // Insert into database
        await pool.query(
          `INSERT INTO users (name, hostname, ip_address, department)
           VALUES ($1, $2, $3, $4)`,
          [userData.name, userData.hostname, userData.ip_address, userData.department]
        );

        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push({
          row: results.success + results.failed,
          error: err.message
        });
      }
    }

    // Clean up uploaded file
    fs.unlink(req.file.path, () => {});

    // Return results
    res.json({
      message: 'Bulk upload completed',
      results: {
        totalProcessed: results.total,
        successful: results.success,
        failed: results.failed,
        errors: results.errors
      }
    });

  } catch (err) {
    console.error('❌ Error processing bulk upload:', err);
    res.status(500).json({ 
      message: 'Failed to process file',
      error: err.message 
    });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM users 
      ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching users:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
