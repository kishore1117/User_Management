import db from '../config/db.js';
const { pool, initDB } = db; 

/* 🟢 Create a new location */
export const createLocation = async (req, res) => {
  const { name, address } = req.body;
  if (!name) return res.status(400).json({ message: "Name is required" });

  try {
    const result = await pool.query(
      `INSERT INTO locations (name, address)
       VALUES ($1, $2) RETURNING *`,
      [name, address]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error creating location:", err);
    res.status(500).json({ error: "Failed to create location" });
  }
};

/* 🔵 Get all locations */
export const getAllLocations = async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM locations ORDER BY id`);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching locations:", err);
    res.status(500).json({ error: "Failed to fetch locations" });
  }
};

/* 🟡 Get a single location by ID */
export const getLocationById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`SELECT * FROM locations WHERE id = $1`, [id]);
    if (result.rowCount === 0)
      return res.status(404).json({ message: "Location not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error fetching location:", err);
    res.status(500).json({ error: "Failed to fetch location" });
  }
};

/* 🟠 Update a location (PATCH) */
export const updateLocation = async (req, res) => {
  const { id } = req.params;
  const { name, address } = req.body;
  try {
    const result = await pool.query(
      `UPDATE locations
       SET name = COALESCE($1, name),
           address = COALESCE($2, address),
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [name, address, id]
    );

    if (result.rowCount === 0)
      return res.status(404).json({ message: "Location not found" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error updating location:", err);
    res.status(500).json({ error: "Failed to update location" });
  }
};

/* 🔴 Delete a location */
export const deleteLocation = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`DELETE FROM locations WHERE id = $1`, [id]);
    if (result.rowCount === 0)
      return res.status(404).json({ message: "Location not found" });

    res.json({ message: "Location deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting location:", err);
    res.status(500).json({ error: "Failed to delete location" });
  }
};
