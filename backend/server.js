const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const xlsx = require("xlsx");
const helmet = require("helmet");
const compression = require("compression");
const { initDB, pool } = require("./db");

const app = express();

// ------------------------
// 🛡️ Security & Middleware
// ------------------------
app.use(helmet({
  contentSecurityPolicy: false  // Disabled to allow Angular to work properly
}));
app.use(cors());
app.use(bodyParser.json());
app.use(compression());


// Initialize database connection
initDB();

const angularDistPath = path.join(__dirname, 'dist', 'user-management', 'browser');
const indexPath = path.join(angularDistPath, 'index.html');

//Validate Angular build exists
if (!fs.existsSync(angularDistPath)) {
  console.warn('⚠️ Angular dist folder not found at:', angularDistPath);
}

// Serve static files from Angular build
app.use(express.static(angularDistPath, {
  maxAge: '1y',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// ========================
// 🧩 CRUD & Upload APIs
// ========================

// ✅ Add new user
app.post("/api/users", async (req, res) => {
  const { name, hostname, ipAddress, department } = req.body;

  if (!name || !hostname || !ipAddress || !department) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Step 1: Check if IP exists in DB
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE ip_address = $1",
      [ipAddress]
    );

    // Step 2: If IP not found → Invalid IP
    if (existingUser.rows.length === 0) {
      return res.status(400).json({ message: "Invalid IP" });
    }

    const user = existingUser.rows[0];

    // Step 3: If IP found but name != 'NA' → IP already taken
    if (user.name !== "NA") {
      return res.status(400).json({ message: "IP already taken" });
    }

    // Step 4: If IP found and name = 'NA' → Update record
    const updateQuery = `
      UPDATE users
      SET name = $1, hostname = $2, department = $3
      WHERE ip_address = $4
    `;

    await pool.query(updateQuery, [name, hostname, department, ipAddress]);

    return res.status(200).json({ message: "User added successfully" });
  } catch (err) {
    console.error("Error processing request:", err);
    return res.status(500).json({ message: "Database error while adding user" });
  }
});

// 🔍 Search users
app.post("/api/users/search", async (req, res) => {
  const { name, hostname, ipAddress } = req.body;

  try {
    let query = "SELECT * FROM users WHERE 1=1";
    const params = [];
    let paramIndex = 1;

    if (name) {
      query += ` AND LOWER(TRIM(name)) = LOWER(TRIM($${paramIndex++}))`;
      params.push(name.trim());
    }

    if (hostname) {
      query += ` AND LOWER(TRIM(hostname)) = LOWER(TRIM($${paramIndex++}))`;
      params.push(hostname.trim());
    }

    if (ipAddress) {
      query += ` AND LOWER(TRIM(ip_address)) = LOWER(TRIM($${paramIndex++}))`;
      params.push(ipAddress.trim());
    }

    const result = await pool.query(query, params);

    if (ipAddress) {
      return res.json(result.rows.length ? [result.rows[0]] : []);
    }

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error searching users:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ✏️ Update user
app.put("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  const { name, hostname, ip_address, department } = req.body;

  try {
    const result = await pool.query(
      `UPDATE users
       SET name = $1, hostname = $2, ip_address = $3, department = $4
       WHERE id = $5 RETURNING *`,
      [name, hostname, ip_address, department, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error updating user:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// 🗑️ Delete user
app.delete("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM users WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "🗑️ User deleted successfully", deletedUser: result.rows[0] });
  } catch (err) {
    console.error("❌ Error deleting user:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// 🧾 Bulk upload setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

app.post("/api/users/bulk", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    const results = { total: data.length, success: 0, failed: 0, errors: [] };

    for (const row of data) {
      try {
        const userData = {
          name: row.name || "NA",
          hostname: row.hostname || "NA",
          ip_address: row.ip_address || row.ipAddress || "NA",
          department: row.department || "NA",
        };

        await pool.query(
          `INSERT INTO users (name, hostname, ip_address, department)
           VALUES ($1, $2, $3, $4)`,
          [
            userData.name,
            userData.hostname,
            userData.ip_address,
            userData.department,
          ]
        );

        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push({ row: results.success + results.failed, error: err.message });
      }
    }

    fs.unlink(req.file.path, () => {});
    res.json({
      message: "Bulk upload completed",
      results: results,
    });
  } catch (err) {
    console.error("❌ Error processing bulk upload:", err);
    res.status(500).json({ message: "Failed to process file", error: err.message });
  }
});

// 📋 Get all users
app.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM users ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching users:", err);
    res.status(500).json({ error: "Database error" });
  }
});

app.delete("/api/users/department/:dept", (req, res) => {
  const { dept } = req.params;
  const query = "DELETE FROM users WHERE department = $1";

  pool.query(query, [dept], (err, result) => {
    if (err) {
      console.error("Error deleting users by department:", err);
      return res.status(500).json({ message: "Database error while deleting users" });
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ message: `No users found in ${dept} department.` });
    }

    res.status(200).json({ message: `All users in ${dept} department deleted successfully.` });
  });
});

app.get('*', (req, res) => {
  res.sendFile(indexPath);
})

/// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📂 Serving Angular from: ${angularDistPath}`);
});

//Error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Graceful shutdown
  process.exit(1);
});

