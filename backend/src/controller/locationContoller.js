import db from '../config/db.js';
const { pool, initDB } = db;


export const removeLocationFromAllAdmins = async (locationId) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `UPDATE user_access
       SET location_ids = array_remove(location_ids, $1)
       WHERE role = 'admin'`,
      [locationId]
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error removing location assignments:", err);
    throw err;
  } finally {
    client.release();
  }
};

export const updateLocationAssignmentsForAllAdmins = async (locationId) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `UPDATE user_access
       SET location_ids = array(
         SELECT DISTINCT unnest(
           array_append(
             COALESCE(location_ids, '{}'),
             $1
           )
         )
       )
       WHERE role = 'admin'`,
      [locationId]
    );

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error updating location assignments:", err);
    throw err;
  } finally {
    client.release();
  }
};


export const createLocation = async (req, res) => {
  const { name, address } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Name is required" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ Create location
    const locationResult = await client.query(
      `INSERT INTO locations (name, address)
       VALUES ($1, $2)
       RETURNING id, name, address`,
      [name, address]
    );

    const location = locationResult.rows[0];

    // 2️⃣ Update ALL admin users
    await client.query(
      `UPDATE user_access
       SET location_ids = array(
         SELECT DISTINCT unnest(
           array_append(
             COALESCE(location_ids, '{}'),
             $1
           )
         )
       )
       WHERE role = 'admin'`,
      [location.id]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Location created and assigned to all admins",
      location,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error creating location:", err);
    res.status(500).json({ error: "Failed to create location" });
  } finally {
    client.release();
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

export const getAllowedLocations = async (req, res) => {
  try {
    // Get user details from auth middleware
    let locationIds = await pool.query(`select location_ids from user_access where username = $1`, [req.user.username]);
    const userName = req.user?.username;

    locationIds = locationIds.rows[0]?.location_ids || [];

    // If user has no location access, return empty list
    if (!locationIds.length) {
      return res.json({
        locations: [],
        departments: []
      });
    }

    // Fetch only allowed locations + all departments (if needed)
    const [locations, departments, categories] = await Promise.all([
      pool.query(
        `
        SELECT id, name
        FROM locations
        WHERE id = ANY ($1)
        ORDER BY name
        `,
        [locationIds]
      ),
      pool.query(
        `
        SELECT id, name
        FROM departments
        ORDER BY name
        `
      ),
      pool.query(
        `SELECT id, name FROM categories ORDER BY name`
      )
    ]);

    res.json({
      locations: locations.rows,
      departments: departments.rows,
      categories: categories.rows
    });
  } catch (err) {
    console.error('❌ Error fetching allowed locations:', err);
    res.status(500).json({ message: 'Failed to fetch data' });
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
