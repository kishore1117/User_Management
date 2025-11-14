import db from '../config/db.js';
const { pool, initDB } = db; 

export async function validateHierarchy(location_id, department_id, division_id, category_id) {
  try {
    // ✅ Handle missing location_id (must be required)
    if (!location_id) {
      return { valid: false, message: "❌ Location is required for hierarchy validation." };
    }

    // ✅ Check department belongs to location
    if (department_id) {
      const dept = await pool.query(
        `SELECT id FROM departments WHERE id = $1 AND location_id = $2`,
        [department_id, location_id]
      );
      if (dept.rowCount === 0) {
        return {
          valid: false,
          message: `❌ Department (ID: ${department_id}) does not belong to Location (ID: ${location_id}).`
        };
      }
    }

    // ✅ Check division belongs to department
    if (division_id) {
      const div = await pool.query(
        `SELECT id FROM divisions WHERE id = $1 AND department_id = $2`,
        [division_id, department_id]
      );
      if (div.rowCount === 0) {
        return {
          valid: false,
          message: `❌ Division (ID: ${division_id}) does not belong to Department (ID: ${department_id}).`
        };
      }
    }

    // ✅ Check category belongs to location
    if (category_id) {
      const cat = await pool.query(
        `SELECT id FROM categories WHERE id = $1 AND location_id = $2`,
        [category_id, location_id]
      );
      if (cat.rowCount === 0) {
        return {
          valid: false,
          message: `❌ Category (ID: ${category_id}) does not belong to Location (ID: ${location_id}).`
        };
      }
    }

    // ✅ All good
    return { valid: true };

  } catch (error) {
    console.error("❌ Hierarchy validation failed:", error);
    return {
      valid: false,
      message: "⚠️ Internal error while validating hierarchy. Please try again."
    };
  }
}
