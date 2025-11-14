import db from '../config/db.js';
const { pool, initDB } = db; 


/* 🟢 Create Department */
export const createDepartment = async (req, res) => {
  const { name, note } = req.body;
  if (!name) return res.status(400).json({ message: "Department name is required" });

  try {
    const result = await pool.query(
      `INSERT INTO departments (name, note)
       VALUES ($1, $2)
       RETURNING *`,
      [name, note]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error creating department:", err);
    res.status(500).json({ error: "Failed to create department" });
  }
};

/* 🔵 Get All Departments */
export const getAllDepartments = async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM departments ORDER BY id`);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching departments:", err);
    res.status(500).json({ error: "Failed to fetch departments" });
  }
};

/* 🟡 Get Department by ID */
export const getDepartmentById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`SELECT * FROM departments WHERE id = $1`, [id]);
    if (result.rowCount === 0)
      return res.status(404).json({ message: "Department not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error fetching department:", err);
    res.status(500).json({ error: "Failed to fetch department" });
  }
};

/* 🟠 Update Department (PATCH) */
export const updateDepartment = async (req, res) => {
  const { id } = req.params;
  const { name, note } = req.body;
  try {
    const result = await pool.query(
      `UPDATE departments
       SET name = COALESCE($1, name),
           note = COALESCE($2, note),
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [name, note, id]
    );

    if (result.rowCount === 0)
      return res.status(404).json({ message: "Department not found" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error updating department:", err);
    res.status(500).json({ error: "Failed to update department" });
  }
};

/* 🔴 Delete Department */
export const deleteDepartment = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`DELETE FROM departments WHERE id = $1`, [id]);
    if (result.rowCount === 0)
      return res.status(404).json({ message: "Department not found" });

    res.json({ message: "Department deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting department:", err);
    res.status(500).json({ error: "Failed to delete department" });
  }
};
