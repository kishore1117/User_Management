import e from 'express';
import db from '../config/db.js';
const { pool, initDB } = db;
import { generateToken } from "../utils/jwtHelper.js";
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// 🟢 Create new user_access
export const createUserAccess = async (req, res) => {
  const { username, password, role, location_ids,email } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  if (!username || !password || !role || !Array.isArray(location_ids)) {
    return res.status(400).json({ error: "Missing required fields or invalid data" });
  }

  try {
    const query = `
      INSERT INTO user_access (username, password, role, email, location_ids)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const result = await pool.query(query, [username, hashedPassword, role, email, location_ids]);
    res.status(201).json({ message: "User created successfully", user: result.rows[0] });
  } catch (err) {
    console.error("❌ Error creating user:", err);
    res.status(500).json({ error: "Failed to create user" });
  }
};

export const updateUserAccess = async (req, res) => {
  const { id } = req.params;
  const { username, password, role, location_ids , email} = req.body;

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

      // if (check.rows.length !== finalLocationIds.length) {
      //   return res
      //     .status(400)
      //     .json({ message: "One or more location IDs are invalid" });
      // }
    }

    const query = `
      UPDATE user_access
      SET
        username     = COALESCE($1, username),
        password     = COALESCE($2, password),
        role         = COALESCE($3, role),
        location_ids = COALESCE($4, location_ids),
        email       = COALESCE($5, email),
        updated_at   = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *;
    `;

    const result = await pool.query(query, [
      username,
      password,
      role,
      finalLocationIds,
      email, // ✅ replaces value
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
  ARRAY_AGG(DISTINCT l.name) AS location_ids,
  ua.email
FROM user_access ua
LEFT JOIN locations l 
  ON l.id = ANY(ua.location_ids)
GROUP BY 
  ua.id,
  ua.username,
  ua.role,
  ua.email
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

    const hashedPassword = result.rows[0]?.password;

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];

    const passwordMatch = await bcrypt.compare(password, hashedPassword);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }
    // // 🔹 Compare plain text password
    // if (user.password !== password) {
    //   return res.status(401).json({ message: "Invalid password" });
    // }

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


export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const userRes = await pool.query(
      'SELECT id, email FROM user_access WHERE email = $1',
      [email]
    );

    // Always send same response
    if (userRes.rows.length === 0) {
      return res.status(400).json({ message: "User with email not found" });
    }

    const user = userRes.rows[0];

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');

    // Hash token
    const hashedToken = await bcrypt.hash(token, 10);

    // Store token + expiry
    await pool.query(
      `UPDATE user_access 
       SET reset_token = $1, reset_token_expiry = $2 
       WHERE id = $3`,
      [hashedToken, Date.now() + 15 * 60 * 1000, user.id]
    );

    // Email setup
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'itasset26@gmail.com',
        pass: 'ryap etec znmr dolm'
      }
    });

    const resetLink = `http://192.168.1.247:3000/reset-password?token=${token}&id=${user.id}`;

    await transporter.sendMail({
      to: user.email,
      subject: 'Apex Reset Password',
      html: `<a href="${resetLink}">Reset your password</a>`
    });

    res.json({ message: "If account exists, email sent" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
}
export const resetPassword = async (req, res) => {
  const { userId, token, newPassword } = req.body;

  try {
    const userRes = await pool.query(
      'SELECT * FROM user_access WHERE id = $1',
      [userId]
    );

    if (userRes.rows.length === 0) {
      return res.status(400).json({ error: "Invalid request" });
    }

    const user = userRes.rows[0];

    // Check expiry
    if (Date.now() > user.reset_token_expiry) {
      return res.status(400).json({ error: "Token expired" });
    }

    // Validate token
    const isValid = await bcrypt.compare(token, user.reset_token);

    if (!isValid) {
      return res.status(400).json({ error: "Invalid token" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password + clear token
    await pool.query(
      `UPDATE user_access 
       SET password = $1, reset_token = NULL, reset_token_expiry = NULL 
       WHERE id = $2`,
      [hashedPassword, userId]
    );

    res.json({ message: "Password reset successful" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
};