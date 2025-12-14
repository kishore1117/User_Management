import db from '../config/db.js';
const { pool, initDB } = db; 
import { generateToken } from "../utils/jwtHelper.js";

// 🟢 Create new user_access
export const createUserAccess = async (req, res) => {
  const { username, password, role, location_ids } = req.body;

  if (!username || !password || !role || !Array.isArray(location_ids)) {
    return res.status(400).json({ error: "Missing required fields or invalid data" });
  }

  try {
    const query = `
      INSERT INTO user_access (username, password, role, location_ids)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const result = await pool.query(query, [username, password, role, location_ids]);
    res.status(201).json({ message: "User created successfully", user: result.rows[0] });
  } catch (err) {
    console.error("❌ Error creating user:", err);
    res.status(500).json({ error: "Failed to create user" });
  }
};

// export const updateUserAccess = async (req, res) => {
//   const { id } = req.params;
//   const { username, password, role, location_ids } = req.body;

//   // try {
//   //   const query = `
//   //     UPDATE user_access
//   //     SET 
//   //       username = COALESCE($1, username),
//   //       password = COALESCE($2, password),
//   //       role = COALESCE($3, role),
//   //       location_ids = COALESCE($4, location_ids),
//   //       updated_at = CURRENT_TIMESTAMP
//   //     WHERE id = $5
//   //     RETURNING *;
//   //   `;
//   //   const result = await pool.query(query, [username, password, role, location_ids, id]);

//   //   if (result.rowCount === 0)
//   //     return res.status(404).json({ message: "User not found" });

//   //   res.json({ message: "User updated successfully", user: result.rows[0] });
//   // } catch (err) {
//   //   console.error("❌ Error updating user:", err);
//   //   res.status(500).json({ error: "Failed to update user" });
//   // }
//   try {
//   // Validate: location_ids should not be empty
//   if (Array.isArray(location_ids) && location_ids.length === 0) {
//     return res.status(400).json({ message: "User must have access to at least one location" });
//   }

//   let finalLocationIds = null;

//   if (Array.isArray(location_ids)) {
//     // 1️⃣ Validate incoming IDs
//     const check = await pool.query(
//       `SELECT id FROM locations WHERE id = ANY($1)`,
//       [location_ids]
//     );

//     if (check.rows.length !== location_ids.length) {
//       return res.status(400).json({ message: "One or more location IDs are invalid" });
//     }

//     // 2️⃣ Get previous location access
//     const prev = await pool.query(
//       `SELECT location_ids FROM user_access WHERE id = $1`,
//       [id]
//     );
//     if (prev.rowCount === 0)
//       return res.status(404).json({ message: "User not found" });

//     const oldIds = prev.rows[0].location_ids || [];

//     // 3️⃣ Merge without duplicates
//     finalLocationIds = [...new Set([...oldIds, ...location_ids])];
//   }

//   const query = `
//     UPDATE user_access
//     SET 
//       username = COALESCE($1, username),
//       password = COALESCE($2, password),
//       role = COALESCE($3, role),
//       location_ids = COALESCE($4, location_ids),
//       updated_at = CURRENT_TIMESTAMP
//     WHERE id = $5
//     RETURNING *;
//   `;

//   const result = await pool.query(query, [
//     username,
//     password,
//     role,
//     finalLocationIds, // only passed if user provided
//     id,
//   ]);

//   res.json({ message: "User updated successfully", user: result.rows[0] });

// } catch (err) {
//   console.error("❌ Error updating user:", err);
//   res.status(500).json({ error: "Failed to update user" });
// }

// };

export const updateUserAccess = async (req, res) => {
  const { id } = req.params;
  const { username, password, role, location_ids } = req.body;

  try {
    let finalLocationIds = null;

    if (location_ids !== undefined) {
      // 1️⃣ Normalize (string | array → array)
      finalLocationIds = Array.isArray(location_ids)
        ? location_ids.map(Number)
        : typeof location_ids === "string"
          ? location_ids.split(",").map(v => Number(v.trim()))
          : [];

      // 2️⃣ Validate not empty
      if (finalLocationIds.length === 0) {
        return res
          .status(400)
          .json({ message: "User must have access to at least one location" });
      }

      // 3️⃣ Validate IDs exist
      const check = await pool.query(
        `SELECT id FROM locations WHERE id = ANY($1)`,
        [finalLocationIds]
      );

      if (check.rows.length !== finalLocationIds.length) {
        return res
          .status(400)
          .json({ message: "One or more location IDs are invalid" });
      }
    }

    const query = `
      UPDATE user_access
      SET
        username     = COALESCE($1, username),
        password     = COALESCE($2, password),
        role         = COALESCE($3, role),
        location_ids = COALESCE($4, location_ids),
        updated_at   = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *;
    `;

    const result = await pool.query(query, [
      username,
      password,
      role,
      finalLocationIds, // ✅ replaces value
      id
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User updated successfully",
      user: result.rows[0]
    });

  } catch (err) {
    console.error("❌ Error updating user:", err);
    res.status(500).json({ error: "Failed to update user" });
  }
};



// 🔴 Delete user_access
export const deleteUserAccess = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM user_access WHERE id = $1 RETURNING *;", [id]);
    if (result.rowCount === 0)
      return res.status(404).json({ message: "User not found" });

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting user:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
};

// 🟢 Get all user_access records
export const getAllUserAccess = async (req, res) => {
  try {
    const query = `
      SELECT 
        ua.id,
        ua.username,
        ua.role,
        ua.location_ids,
        ua.password,
        ARRAY_AGG(l.name) AS location_names
      FROM user_access ua
      LEFT JOIN locations l ON l.id = ANY(ua.location_ids)
      GROUP BY ua.id
      ORDER BY ua.id;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// 🟢 Get single user_access by ID
export const getUserAccessById = async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      SELECT 
        ua.id,
        ua.username,
        ua.role,
        ua.location_ids,
         ua.password,
        ARRAY_AGG(l.name) AS location_names
      FROM user_access ua
      LEFT JOIN locations l ON l.id = ANY(ua.location_ids)
      WHERE ua.id = $1
      GROUP BY ua.id;
    `;
    const result = await pool.query(query, [id]);

    if (result.rowCount === 0)
      return res.status(404).json({ message: "User not found" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error fetching user:", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
};


export const loginUserAccess = async (req, res) => {
  const { username, password } = req.body;

  try {
    // 🔹 Check if username exists
    const result = await pool.query(
      "SELECT * FROM user_access WHERE username = $1",
      [username]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];

    // 🔹 Compare plain text password
    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // 🔹 Password matched → generate JWT token
    const token = generateToken({
      username: user.username,
      role: user.role,
      location_ids: user.location_ids,
    });

    res.json({
      message: "Login successful",
      token,
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
