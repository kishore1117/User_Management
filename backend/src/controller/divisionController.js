import db from '../config/db.js';
const { pool, initDB } = db; 

/* 🟢 Create Division */
export const createDivision = async (req, res) => {
  const { name, note } = req.body;
  if (!name) return res.status(400).json({ message: "Division name is required" });

  try {
    const result = await pool.query(
      `INSERT INTO divisions (name, note)
       VALUES ($1, $2)
       RETURNING *`,
      [name, note]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error creating division:", err);
    res.status(500).json({ error: "Failed to create division" });
  }
};

/* 🔵 Get All Divisions */
export const getAllDivisions = async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM divisions ORDER BY id`);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching divisions:", err);
    res.status(500).json({ error: "Failed to fetch divisions" });
  }
};

/* 🟡 Get Division by ID */
export const getDivisionById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`SELECT * FROM divisions WHERE id = $1`, [id]);
    if (result.rowCount === 0)
      return res.status(404).json({ message: "Division not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error fetching division:", err);
    res.status(500).json({ error: "Failed to fetch division" });
  }
};

/* 🟠 Update Division (PATCH) */
export const updateDivision = async (req, res) => {
  const { id } = req.params;
  const { name, note } = req.body;
  try {
    const result = await pool.query(
      `UPDATE divisions
       SET name = COALESCE($1, name),
           note = COALESCE($2, note),
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [name, note, id]
    );

    if (result.rowCount === 0)
      return res.status(404).json({ message: "Division not found" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error updating division:", err);
    res.status(500).json({ error: "Failed to update division" });
  }
};

/* 🔴 Delete Division */
export const deleteDivision = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`DELETE FROM divisions WHERE id = $1`, [id]);
    if (result.rowCount === 0)
      return res.status(404).json({ message: "Division not found" });

    res.json({ message: "Division deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting division:", err);
    res.status(500).json({ error: "Failed to delete division" });
  }
};
