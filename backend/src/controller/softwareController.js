import db from '../config/db.js';
const { pool, initDB } = db; 

/* 🟢 Create Software */
export const createSoftware = async (req, res) => {
  const { name, note } = req.body;
  if (!name) return res.status(400).json({ message: "Software name is required" });

  try {
    const result = await pool.query(
      `INSERT INTO software (name, note)
       VALUES ($1, $2)
       RETURNING *`,
      [name, note]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error creating software:", err);
    res.status(500).json({ error: "Failed to create software" });
  }
};

/* 🔵 Get All Software */
export const getAllSoftware = async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM software ORDER BY id`);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching software list:", err);
    res.status(500).json({ error: "Failed to fetch software list" });
  }
};

/* 🟡 Get Software by ID */
export const getSoftwareById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`SELECT * FROM software WHERE id = $1`, [id]);
    if (result.rowCount === 0)
      return res.status(404).json({ message: "Software not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error fetching software:", err);
    res.status(500).json({ error: "Failed to fetch software" });
  }
};

/* 🟠 Update Software (PATCH) */
export const updateSoftware = async (req, res) => {
  const { id } = req.params;
  const { name, note } = req.body;
  try {
    const result = await pool.query(
      `UPDATE software
       SET name = COALESCE($1, name),
           note = COALESCE($2, note),
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [name, note, id]
    );

    if (result.rowCount === 0)
      return res.status(404).json({ message: "Software not found" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error updating software:", err);
    res.status(500).json({ error: "Failed to update software" });
  }
};

/* 🔴 Delete Software */
export const deleteSoftware = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`DELETE FROM software WHERE id = $1`, [id]);
    if (result.rowCount === 0)
      return res.status(404).json({ message: "Software not found" });

    res.json({ message: "Software deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting software:", err);
    res.status(500).json({ error: "Failed to delete software" });
  }
};
