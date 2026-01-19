import userService from "../services/userService.js";
import * as tableService  from '../services/adminService.js';
import { validateHierarchy } from "../utils/validateHierarchy.js"; 
import * as locationController from './locationContoller.js';
import jwt from "jsonwebtoken";
import db from '../config/db.js';
const { pool, initDB } = db;


export const addUser = async (req, res) => {
  try {
    const { ip_address1 } = req.body;
    if (ip_address1 ) {
      const ipCheck = await pool.query(
        `
        SELECT id
        FROM users
        WHERE ip_address1 = $1
        LIMIT 1
        `,
        [ip_address1 || null]
      );

      if (ipCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: "❌ IP address already exists in the system"
        });
      }
    }

    // ✅ Validate hierarchy integrity
    await validateHierarchy(
      req.body.location_id,
      req.body.department_id,
      req.body.division_id,
      req.body.category_id
    );


    const result = await userService.addUser(req.body);
    res.json({ success: true, message: "✅ User created successfully", user: result });
  } catch (error) {
    console.error("❌ Error creating user:", error);
    res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
}

export const getUserById = async (req, res) => {
  try {
   const { id } = req.params;
   
    const user = await userService.getUserById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "❌ User not found"
      });
    }

    // Extract user’s authorized locations (from JWT)
    const userLocations = req.user?.location_ids || [];

    // Check if user has access to this user's location
    if (!userLocations.includes(user.location_id)) {
      return res.status(403).json({
        success: false,
        message: "❌ You do not have permission to access this user's details."
      });
    }

    return res.json({
      success: true,
      message: "✅ User fetched successfully",
      user:user
    });

  } catch (err) {
    console.error("❌ Error getting user:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Internal server error"
    });
  }
};


export const getAllUsers = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers(req);

    res.json({
      success: true,
      total_users: users.rowCount,
      users: users
    });

  } catch (error) {
    console.error("❌ Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized: Missing token" });

    // Decode JWT token
    const decoded = jwt.verify(token, 'apex_secret_2252524');
    const userAccess = decoded.location_ids || []; 
    const { location_id, department_id, division_id, category_id } = req.body;

    // // Check location access
    // if (!userAccess.includes(location_id)) {
    //   return res.status(403).json({ message: "❌ You don’t have access to this location." });
    // }

    // Validate hierarchy
    await validateHierarchy(location_id, department_id, division_id, category_id);

    // -----------------------------
    // 🔥 SANITIZE PATCH INPUT HERE
    // -----------------------------
    const filteredBody = Object.fromEntries(
      Object.entries(req.body).filter(([_, value]) => value !== null && value !== undefined)
    );

    // Update user
    const updatedUser = await userService.updateUser(id, filteredBody);

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "✅ User updated successfully", user: updatedUser });

  } catch (error) {
    console.error("❌ Error updating user:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    res.status(500).json({ error: error.message });
  }
};


  export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized: Missing token" });

    // Decode JWT
    const decoded = jwt.verify(token, 'apex_secret_2252524');
    const userAccess = decoded.location_ids || [];

    // Fetch user's location before deleting
    const user = await userService.getUserById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!userAccess.includes(user.location_id)) {
      return res.status(403).json({ message: "❌ You don’t have access to this location." });
    }

    // Delete user
    await userService.deleteUser(id);

    res.json({ message: "✅ User deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting user:", error);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    res.status(500).json({ error: error.message });
  }
};

export const getLookupData = async (req, res) => {
  try {
    const data = await userService.getLookupData(req.user);
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error getting lookup data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching lookup data',
      error: error.message 
    });
  }
};


export const getDashboardData = async (req, res) => {
  try {
    const data = await userService.getDashboardData(req.user);
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to load dashboard data'
    });
  }
};


  // GET /api/users/tableSchema?tableName=...
export const getTableDetails = async (req, res) => {
  const tableName = req.query.tableName;
  try {
    if (!tableName) return res.status(400).json({ success: false, message: 'Missing tableName' });

    // validate table exists
    const exists = await tableService.tableExists(tableName);
    if (!exists) return res.status(404).json({ success: false, message: 'Table not found' });

    const columns = await tableService.getTableColumns(tableName);
    // return simple array as your frontend expects OR include rows when requested
    return res.json({ success: true, columns, rows: [] });
  } catch (err) {
    console.error('Error fetching table schema:', err);
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};

// GET /api/users/tableData?tableName=...
export const getTableRows = async (req, res) => {
  const tableName = req.query.tableName;
  try {
    if (!tableName) return res.status(400).json({ success: false, message: 'Missing tableName' });
    const exists = await tableService.tableExists(tableName);
    if (!exists) return res.status(404).json({ success: false, message: 'Table not found' });

    const rows = await tableService.getTableRows(tableName, 1000); // limit configurable
    return res.json({ success: true, rows });
  } catch (err) {
    console.error('Error fetching table rows:', err);
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};

// POST /api/users/table
// body: { tableName, data }
export const createTableRecord = async (req, res) => {
  try {
    const { tableName, data } = req.body;
    if (!tableName || !data) return res.status(400).json({ success: false, message: 'Missing tableName or data' });

    const exists = await tableService.tableExists(tableName);
    if (!exists) return res.status(404).json({ success: false, message: 'Table not found' });

    const created = await tableService.createTableRecord(tableName, data);
    if(tableName === 'locations'){
      await locationController.updateLocationAssignmentsForAllAdmins(created.id);
    }
    return res.json({ success: true, row: created });

  } catch (err) {
    console.error('Error creating table record:', err);
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};

// PUT /api/users/table/:id
// body: { tableName, data }
export const updateTableRecord = async (req, res) => {
  try {
    const id = req.params.id;
    const { tableName, data } = req.body;
    if (!tableName || !data) return res.status(400).json({ success: false, message: 'Missing tableName or data' });

    const exists = await tableService.tableExists(tableName);
    if (!exists) return res.status(404).json({ success: false, message: 'Table not found' });

    const updated = await tableService.updateTableRecord(tableName, id, data);
    if (!updated) return res.status(404).json({ success: false, message: 'Record not found or nothing updated' });
    return res.json({ success: true, row: updated });
  } catch (err) {
    console.error('Error updating table record:', err);
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};

export const deleteTableRecord = async (req, res) => {
  try {
    const id = req.params.id;
    const tableName = req.body.tableName || req.query.tableName;

    if (!tableName) {
      return res.status(400).json({
        success: false,
        message: 'Missing tableName'
      });
    }

    const exists = await tableService.tableExists(tableName);
    if (!exists) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    const deleted = await tableService.deleteTableRecord(tableName, id);
    if(tableName === 'locations' && deleted){
      await locationController.removeLocationFromAllAdmins(deleted.id);
    }
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Record not found'
      });
    }

    return res.json({
      success: true,
      row: deleted
    });

  } catch (err) {
    console.error('❌ Error deleting table record:', err);

    // 🔥 Handle Foreign Key violation
    if (err.code === '23503') {
      const friendlyNames = {
        processors: 'Processor',
        departments: 'Department',
        locations: 'Location',
        warranties: 'Warranty',
        purchase_from: 'Vendor'
      };

      const entity =
        friendlyNames[err.table] ||
        friendlyNames[req.body.tableName] ||
        'This item';

      return res.status(409).json({
        success: false,
        message: `${entity} is currently in use and cannot be deleted. Please remove its usage first.`
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Unable to delete the record. Please try again later.'
    });
  }
};

export const deleteUsersByLocation = async (req, res) => {
  const { location_id } = req.query; 
  // Validation
  if (!location_id) {
    return res.status(400).json({
      success: false,
      message: "location_id query parameter is required"
    });
  }

  try {
    const result = await pool.query(
      `
      DELETE FROM users
      WHERE location_id = $1
      RETURNING id
      `,
      [location_id]
    );

    return res.status(200).json({
      success: true,
      deletedCount: result.rowCount,
      deletedUserIds: result.rows.map(r => r.id),
      message: `Users with location_id ${location_id} deleted successfully`
    });
  } catch (error) {
    console.error("❌ Error deleting users by location:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

