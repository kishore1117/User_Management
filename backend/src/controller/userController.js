import userService from "../services/userService.js";
import { validateHierarchy } from "../utils/validateHierarchy.js"; 
import jwt from "jsonwebtoken";

export const addUser = async (req, res) => {
  try {
    const { location_id } = req.body;
    const userLocations = req.user?.location_ids || [];

    // ✅ Check if user has access to the target location
    if (!userLocations.includes(location_id)) {
      return res.status(403).json({
        success: false,
        message: "❌ You don’t have permission to create a user in this location."
      });
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

    // Check location access
    if (!userAccess.includes(location_id)) {
      return res.status(403).json({ message: "❌ You don’t have access to this location." });
    }

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
    const data = await userService.getLookupData();
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.log(req.params);
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
    const data = await userService.getDashboardData(req);
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching dashboard data',
      error: error.message 
    });
  }
};
