import db from '../config/db.js';
const { pool, initDB } = db;

export const getAllUsers = async (req) => {
  const locationAccess = req.user?.location_ids || [];

  const result = await pool.query(
    `
    SELECT 
      u.id,
      u.hostname,
      u.name,

      d.name AS department_name,
      divi.name AS division_name,
      l.name AS location_name,
      c.name AS category_name,

      u.ip_address1,
      u.ip_address2,
      u.floor,

      m.name AS model,
      cs.name AS cpu_serial,
      p.name AS processor,
      sp.name AS cpu_speed,
      r.name AS ram,
      h.name AS hdd,
      mo.name AS monitor,
      ms.name AS monitor_serial,
      kb.name AS keyboard,
      ms2.name AS mouse,
      cd.name AS cd_dvd,
      os.name AS os,

      -- 🔹 NEW LOOKUP VALUES
      u.asset_tag AS asset_tag,
      w.warranty_name AS warranty,
      pf.vendor_name AS purchase_from,

      u.usb,
      u.created_at,
      u.updated_at,

      COALESCE(
        JSON_AGG(s.name) FILTER (WHERE s.name IS NOT NULL),
        '[]'
      ) AS software

    FROM users u

    LEFT JOIN locations l ON u.location_id = l.id
    LEFT JOIN departments d ON u.department_id = d.id
    LEFT JOIN divisions divi ON u.division_id = divi.id
    LEFT JOIN categories c ON u.category_id = c.id

    LEFT JOIN models m ON u.model_id = m.id
    LEFT JOIN cpu_serials cs ON u.cpu_serial_id = cs.id
    LEFT JOIN processors p ON u.processor_id = p.id
    LEFT JOIN cpu_speeds sp ON u.cpu_speed_id = sp.id
    LEFT JOIN rams r ON u.ram_id = r.id
    LEFT JOIN hdds h ON u.hdd_id = h.id
    LEFT JOIN monitors mo ON u.monitor_id = mo.id
    LEFT JOIN monitor_serials ms ON u.monitor_serial_id = ms.id
    LEFT JOIN keyboards kb ON u.keyboard_id = kb.id
    LEFT JOIN mice ms2 ON u.mouse_id = ms2.id
    LEFT JOIN cd_dvds cd ON u.cd_dvd_id = cd.id
    LEFT JOIN operating_systems os ON u.os_id = os.id

    -- 🔹 NEW LOOKUP JOINS
    LEFT JOIN warranties w ON u.warranty_id = w.id
    LEFT JOIN purchase_from pf ON u.purchase_from_id = pf.id

    LEFT JOIN user_software us ON u.id = us.user_id
    LEFT JOIN software s ON us.software_id = s.id

    WHERE u.location_id = ANY($1)

    GROUP BY 
      u.id,
      d.name, divi.name, l.name, c.name,
      m.name, cs.name, p.name, sp.name, r.name, h.name,
      mo.name, ms.name, kb.name, ms2.name, cd.name, os.name,
      u.asset_tag, w.warranty_name, pf.vendor_name

    ORDER BY u.id ASC;
    `,
    [locationAccess]
  );

  return result.rows;
};

// export const getDashboardData = async (user) => {
//   try {
//     const locationIds = user?.location_ids || [];

//     if (!locationIds.length) {
//       return {
//         summary: { total_users: 0, available_ips: 0, reserved_ips: 0 },
//         location: [],
//         department: [],
//         division: [],
//         category: [],
//         model: [],
//         ram: [],
//         os: [],
//         processor: [],
//         warranty: [],
//         software: []
//       };
//     }

//     /* ================= SUMMARY (LOCATION NAME BASED IP LOGIC) ================= */
//     const summary = (
//       await pool.query(
//         `
//  SELECT
//           COUNT(u.id)::int AS total_users,

//           COUNT(u.id) FILTER (
//             WHERE u.name = 'NA'
//           )::int AS available_ips,

//           COUNT(u.id) FILTER (
//             WHERE u.name IS NOT NULL
//               AND u.name <> 'NA'
//           )::int AS reserved_ips

//         FROM users u
//         WHERE u.location_id = ANY($1::int[])
//         `,
//         [locationIds]
//       )
//     ).rows[0];

//     /* ================= GENERIC LOOKUP (STRICT LOCATION BASED) ================= */
//     const lookupByLocation = async (table, userCol) => {
//       const query = `
//         SELECT
//           l.name AS name,
//           COUNT(u.id)::int AS count
//         FROM ${table} l
//         JOIN users u
//           ON u.${userCol} = l.id
//          AND u.location_id = ANY($1::int[])
//         GROUP BY l.name
//         ORDER BY count DESC, name ASC
//       `;
//       return (await pool.query(query, [locationIds])).rows;
//     };

//     /* ================= LOCATION ================= */
//     const location = (
//       await pool.query(
//         `
//         SELECT
//           l.name AS name,
//           COUNT(u.id)::int AS count
//         FROM locations l
//         JOIN users u
//           ON u.location_id = l.id
//          AND u.location_id = ANY($1::int[])
//         GROUP BY l.name
//         ORDER BY count DESC, name ASC
//         `,
//         [locationIds]
//       )
//     ).rows;

//     /* ================= WARRANTY ================= */
//     const warranty = (
//       await pool.query(
//         `
//         SELECT
//           w.warranty_name AS name,
//           COUNT(u.id)::int AS count
//         FROM warranties w
//         JOIN users u
//           ON u.warranty_id = w.id
//          AND u.location_id = ANY($1::int[])
//         GROUP BY w.warranty_name
//         ORDER BY count DESC, name ASC
//         `,
//         [locationIds]
//       )
//     ).rows;

//     /* ================= SOFTWARE ================= */
//     const software = (
//       await pool.query(
//         `
//         SELECT
//           s.name AS name,
//           COUNT(us.user_id)::int AS count
//         FROM software s
//         JOIN user_software us ON us.software_id = s.id
//         JOIN users u
//           ON u.id = us.user_id
//          AND u.location_id = ANY($1::int[])
//         GROUP BY s.name
//         ORDER BY count DESC, name ASC
//         `,
//         [locationIds]
//       )
//     ).rows;

//     /* ================= FINAL RESPONSE ================= */
//     return {
//       summary,
//       location,
//       department: await lookupByLocation('departments', 'department_id'),
//       division: await lookupByLocation('divisions', 'division_id'),
//       category: await lookupByLocation('categories', 'category_id'),
//       model: await lookupByLocation('models', 'model_id'),
//       ram: await lookupByLocation('rams', 'ram_id'),
//       os: await lookupByLocation('operating_systems', 'os_id'),
//       processor: await lookupByLocation('processors', 'processor_id'),
//       warranty,
//       software
//     };

//   } catch (error) {
//     console.error('Dashboard Metrics Error:', error);
//     throw error;
//   }
// };


export const getDashboardData = async (user) => {
  try {
    const locationIds = user?.location_ids || [];

    if (!locationIds.length) {
      return {
        summary: { total_users: 0, available_ips: 0, reserved_ips: 0 },
        location: [],
        department: [],
        division: [],
        category: [],
        model: [],
        ram: [],
        os: [],
        processor: [],
        warranty: [],
        software: []
      };
    }

    /* ================= SUMMARY (NA / N/A IGNORED) ================= */
    const summary = (
      await pool.query(
        `
        SELECT
          COUNT(u.id)::int AS total_users,

          COUNT(u.id) FILTER (
            WHERE LOWER(u.name) IN ('na', 'n/a')
          )::int AS available_ips,

          COUNT(u.id) FILTER (
            WHERE u.name IS NOT NULL
              AND LOWER(u.name) NOT IN ('na', 'n/a')
          )::int AS reserved_ips
        FROM users u
        WHERE u.location_id = ANY($1::int[])
        `,
        [locationIds]
      )
    ).rows[0];

    /* ================= GENERIC LOOKUP (IGNORE NA / N/A) ================= */
    const lookupByLocation = async (table, userCol) => {
      const query = `
        SELECT
          l.name AS name,
          COUNT(u.id)::int AS count
        FROM ${table} l
        JOIN users u
          ON u.${userCol} = l.id
         AND u.location_id = ANY($1::int[])
        WHERE
          l.name IS NOT NULL
          AND LOWER(l.name) NOT IN ('na', 'n/a')
        GROUP BY l.name
        ORDER BY count DESC, name ASC
      `;
      return (await pool.query(query, [locationIds])).rows;
    };

    /* ================= LOCATION ================= */
    const location = (
      await pool.query(
        `
        SELECT
          l.name AS name,
          COUNT(u.id)::int AS count
        FROM locations l
        JOIN users u
          ON u.location_id = l.id
         AND u.location_id = ANY($1::int[])
        WHERE
          LOWER(l.name) NOT IN ('na', 'n/a')
        GROUP BY l.name
        ORDER BY count DESC, name ASC
        `,
        [locationIds]
      )
    ).rows;

    /* ================= WARRANTY ================= */
    const warranty = (
      await pool.query(
        `
        SELECT
          w.warranty_name AS name,
          COUNT(u.id)::int AS count
        FROM warranties w
        JOIN users u
          ON u.warranty_id = w.id
         AND u.location_id = ANY($1::int[])
        WHERE
          w.warranty_name IS NOT NULL
          AND LOWER(w.warranty_name) NOT IN ('na', 'n/a')
        GROUP BY w.warranty_name
        ORDER BY count DESC, name ASC
        `,
        [locationIds]
      )
    ).rows;

    /* ================= SOFTWARE ================= */
    const software = (
      await pool.query(
        `
        SELECT
          s.name AS name,
          COUNT(us.user_id)::int AS count
        FROM software s
        JOIN user_software us ON us.software_id = s.id
        JOIN users u
          ON u.id = us.user_id
         AND u.location_id = ANY($1::int[])
        WHERE
          s.name IS NOT NULL
          AND LOWER(s.name) NOT IN ('na', 'n/a')
        GROUP BY s.name
        ORDER BY count DESC, name ASC
        `,
        [locationIds]
      )
    ).rows;

    /* ================= FINAL RESPONSE ================= */
    return {
      summary,
      location,
      department: await lookupByLocation('departments', 'department_id'),
      division: await lookupByLocation('divisions', 'division_id'),
      category: await lookupByLocation('categories', 'category_id'),
      model: await lookupByLocation('models', 'model_id'),
      ram: await lookupByLocation('rams', 'ram_id'),
      os: await lookupByLocation('operating_systems', 'os_id'),
      processor: await lookupByLocation('processors', 'processor_id'),
      warranty,
      software
    };

  } catch (error) {
    console.error('Dashboard Metrics Error:', error);
    throw error;
  }
};


export const getLookupData = async (user) => {
  console.log("Fetching lookup data for locations:", user.location_ids);
  const locationIds = user?.location_ids || [];
  const query = `
SELECT 
  -- 🔹 MASTER LOOKUPS
  (SELECT COALESCE(JSON_AGG(jsonb_build_object('id', id, 'name', name)), '[]'::json)
   FROM departments) AS departments,

  (SELECT COALESCE(JSON_AGG(jsonb_build_object('id', id, 'name', name)), '[]'::json)
   FROM divisions) AS divisions,

  (SELECT COALESCE(JSON_AGG(jsonb_build_object('id', id, 'name', name)), '[]'::json)
   FROM locations) AS locations,

  -- 🔹 FILTERED CATEGORIES BASED ON LOCATION IDS
  (
    SELECT COALESCE(
      JSON_AGG(jsonb_build_object('id', id, 'name', name)),
      '[]'::json
    )
    FROM categories
    WHERE location_ids && $1::INT[]
  ) AS categories,

  -- 🔹 OTHER LOOKUPS
  (SELECT COALESCE(JSON_AGG(jsonb_build_object('id', id, 'name', name)), '[]'::json)
   FROM models) AS models,

  (SELECT COALESCE(JSON_AGG(jsonb_build_object('id', id, 'name', name)), '[]'::json)
   FROM cpu_serials) AS cpu_serials,

  (SELECT COALESCE(JSON_AGG(jsonb_build_object('id', id, 'name', name)), '[]'::json)
   FROM processors) AS processors,

  (SELECT COALESCE(JSON_AGG(jsonb_build_object('id', id, 'name', name)), '[]'::json)
   FROM cpu_speeds) AS cpu_speeds,

  (SELECT COALESCE(JSON_AGG(jsonb_build_object('id', id, 'name', name)), '[]'::json)
   FROM rams) AS rams,

  (SELECT COALESCE(JSON_AGG(jsonb_build_object('id', id, 'name', name)), '[]'::json)
   FROM hdds) AS hdds,

  (SELECT COALESCE(JSON_AGG(jsonb_build_object('id', id, 'name', name)), '[]'::json)
   FROM monitors) AS monitors,

  (SELECT COALESCE(JSON_AGG(jsonb_build_object('id', id, 'name', name)), '[]'::json)
   FROM monitor_serials) AS monitor_serials,

  (SELECT COALESCE(JSON_AGG(jsonb_build_object('id', id, 'name', name)), '[]'::json)
   FROM keyboards) AS keyboards,

  (SELECT COALESCE(JSON_AGG(jsonb_build_object('id', id, 'name', name)), '[]'::json)
   FROM mice) AS mice,

  (SELECT COALESCE(JSON_AGG(jsonb_build_object('id', id, 'name', name)), '[]'::json)
   FROM cd_dvds) AS cd_dvds,

  (SELECT COALESCE(JSON_AGG(jsonb_build_object('id', id, 'name', name)), '[]'::json)
   FROM operating_systems) AS operating_systems,

  -- 🔹 SOFTWARE FILTERED BY USER LOCATIONS
  (
    SELECT COALESCE(
      JSON_AGG(
        jsonb_build_object(
          'id', s.id,
          'name', s.name,
          'location_ids', 
            COALESCE(
              (SELECT JSON_AGG(l.name)
               FROM locations l
               WHERE l.id = ANY(s.location_ids)),
              '[]'::json
            )
        )
      ),
      '[]'::json
    )
    FROM software s
    WHERE s.location_ids && $1::INT[]   -- filter by user's locations
  ) AS software,

  -- 🔹 NEW LOOKUPS
  (SELECT COALESCE(JSON_AGG(jsonb_build_object('id', id, 'name', warranty_name)), '[]'::json)
   FROM warranties) AS warranties,

  (SELECT COALESCE(JSON_AGG(jsonb_build_object('id', id, 'name', vendor_name)), '[]'::json)
   FROM purchase_from) AS purchase_from

FROM (SELECT 1) AS dummy;

  `;

  const result = await pool.query(query, [locationIds]);
  return result.rows[0];
};
export const getUserById = async (userId) => {
  console.log("Fetching user by ID:", userId);

  const query = `
    SELECT 
      u.id,
      u.hostname,
      u.name,
      u.serial_number,
      u.printer_type,

      u.location_id,
      l.name AS location_name,

      u.department_id,
      d.name AS department_name,

      u.division_id,
      divi.name AS division_name,

      u.category_id,
      c.name AS category_name,

      -- ✅ asset is now a column
      u.asset_tag,

      u.warranty_id,
      u.purchase_from_id,

      u.ip_address1,
      u.ip_address2,
      u.floor,

      m.id AS model_id,
      m.name AS model,

      cs.id AS cpu_serial_id,
      cs.name AS cpu_serial,

      p.id AS processor_id,
      p.name AS processor,

      sp.id AS cpu_speed_id,
      sp.name AS cpu_speed,

      r.id AS ram_id,
      r.name AS ram,

      h.id AS hdd_id,
      h.name AS hdd,

      mo.id AS monitor_id,
      mo.name AS monitor,

      ms.id AS monitor_serial_id,
      ms.name AS monitor_serial,

      kb.id AS keyboard_id,
      kb.name AS keyboard,

      ms2.id AS mouse_id,
      ms2.name AS mouse,

      cd.id AS cd_dvd_id,
      cd.name AS cd_dvd,

      os.id AS os_id,
      os.name AS os,

      -- 🔹 LOOKUP VALUES
      w.warranty_name AS warranty,
      pf.vendor_name AS purchase_from,

      u.usb,
      u.created_at,
      u.updated_at,

      COALESCE(
        (
          SELECT JSON_AGG(s.name)
          FROM user_software us
          JOIN software s ON us.software_id = s.id
          WHERE us.user_id = u.id
        ),
        '[]'
      ) AS software

    FROM users u
    LEFT JOIN locations l ON u.location_id = l.id
    LEFT JOIN departments d ON u.department_id = d.id
    LEFT JOIN divisions divi ON u.division_id = divi.id
    LEFT JOIN categories c ON u.category_id = c.id

    LEFT JOIN models m ON u.model_id = m.id
    LEFT JOIN cpu_serials cs ON u.cpu_serial_id = cs.id
    LEFT JOIN processors p ON u.processor_id = p.id
    LEFT JOIN cpu_speeds sp ON u.cpu_speed_id = sp.id
    LEFT JOIN rams r ON u.ram_id = r.id
    LEFT JOIN hdds h ON u.hdd_id = h.id
    LEFT JOIN monitors mo ON u.monitor_id = mo.id
    LEFT JOIN monitor_serials ms ON u.monitor_serial_id = ms.id
    LEFT JOIN keyboards kb ON u.keyboard_id = kb.id
    LEFT JOIN mice ms2 ON u.mouse_id = ms2.id
    LEFT JOIN cd_dvds cd ON u.cd_dvd_id = cd.id
    LEFT JOIN operating_systems os ON u.os_id = os.id

    LEFT JOIN warranties w ON u.warranty_id = w.id
    LEFT JOIN purchase_from pf ON u.purchase_from_id = pf.id

    WHERE u.id = $1;
  `;

  const result = await pool.query(query, [userId]);
  return result.rows[0];
};


export const addUser = async (data) => {
  const {
    hostname,
    name,
    department_id,
    division_id,
    location_id,
    category_id,
    ip_address1,
    ip_address2,
    floor,
    model_id,
    cpu_serial_id,
    processor_id,
    cpu_speed_id,
    ram_id,
    hdd_id,
    monitor_id,
    monitor_serial_id,
    keyboard_id,
    mouse_id,
    cd_dvd_id,
    os_id,
    usb,
  } = data;

  const result = await pool.query(
    `INSERT INTO users 
      (hostname, name, department_id, division_id, location_id, category_id, 
       ip_address1, ip_address2, floor, model_id, cpu_serial_id, processor_id, cpu_speed_id, 
       ram_id, hdd_id, monitor_id, monitor_serial_id, keyboard_id, mouse_id, cd_dvd_id, os_id, usb)
      VALUES 
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
      RETURNING *`,
    [
      hostname, name, department_id, division_id, location_id, category_id,
      ip_address1, ip_address2, floor, model_id, cpu_serial_id, processor_id, cpu_speed_id,
      ram_id, hdd_id, monitor_id, monitor_serial_id, keyboard_id, mouse_id, cd_dvd_id, os_id, usb
    ]
  );
  return result.rows[0];
};

async function updateUser(id, userData) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const softwareNames = userData.software;
    delete userData.software;

    const cleanData = Object.fromEntries(
      Object.entries(userData).filter(([_, v]) => v !== null && v !== undefined)
    );

    let updatedUser = null;
    if (Object.keys(cleanData).length > 0) {
      const fields = Object.keys(cleanData);
      const values = Object.values(cleanData);

      const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(", ");
      values.push(id);

      const query = `
        UPDATE users
        SET ${setClause}, updated_at = NOW()
        WHERE id = $${fields.length + 1}
        RETURNING *;
      `;

      updatedUser = (await client.query(query, values)).rows[0];
    }

    if (Array.isArray(softwareNames)) {
      if (softwareNames.length === 0) throw new Error("At least one software must be selected.");

      const swRes = await client.query(
        `SELECT id, name FROM software WHERE name = ANY($1)`,
        [softwareNames]
      );

      if (swRes.rows.length !== softwareNames.length) {
        throw new Error("Invalid software name provided");
      }

      const softwareIds = swRes.rows.map(row => row.id);

      await client.query(`DELETE FROM user_software WHERE user_id = $1`, [id]);

      for (const swId of softwareIds) {
        await client.query(
          `INSERT INTO user_software (user_id, software_id) VALUES ($1, $2)`,
          [id, swId]
        );
      }
    }

    await client.query("COMMIT");

    if (!updatedUser) {
      updatedUser = (await client.query(`SELECT * FROM users WHERE id = $1`, [id])).rows[0];
    }

    return updatedUser;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function deleteUser(id) {
  await pool.query("DELETE FROM users WHERE id=$1", [id]);
}

export default {
  addUser,
  getAllUsers,
  getDashboardData,
  getLookupData,
  updateUser,
  deleteUser,
  getUserById
};