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

      u.usb,
      u.created_at,
      u.updated_at,
      COALESCE(JSON_AGG(s.name) FILTER (WHERE s.name IS NOT NULL), '[]') AS software
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

    LEFT JOIN user_software us ON u.id = us.user_id
    LEFT JOIN software s ON us.software_id = s.id

    WHERE u.location_id = ANY($1)
    GROUP BY u.id, d.name, divi.name, l.name, c.name,
      m.name, cs.name, p.name, sp.name, r.name, h.name, mo.name, ms.name,
      kb.name, ms2.name, cd.name, os.name
    ORDER BY u.id ASC;
    `,
    [locationAccess]
  );

  return result.rows;
};

export const getDashboardData = async (req) => {
  const locationAccess = req.user?.location_ids || [];

  // Query 1: Get location summary with counts
  const locationResult = await pool.query(
    `
    SELECT 
      l.id AS location_id,
      l.name AS location_name,
      COUNT(DISTINCT u.id) AS total_users
    FROM users u
    LEFT JOIN locations l ON u.location_id = l.id
    WHERE u.location_id = ANY($1)
    GROUP BY l.id, l.name
    ORDER BY l.name ASC;
    `,
    [locationAccess]
  );

  // Query 2: Get department distribution
  const deptResult = await pool.query(
    `
    SELECT 
      u.location_id,
      d.id,
      d.name,
      COUNT(*) AS count
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE u.location_id = ANY($1)
    GROUP BY u.location_id, d.id, d.name
    ORDER BY u.location_id, count DESC;
    `,
    [locationAccess]
  );

  // Query 3: Get category distribution
  const categoryResult = await pool.query(
    `
    SELECT 
      u.location_id,
      c.id,
      c.name,
      COUNT(*) AS count
    FROM users u
    LEFT JOIN categories c ON u.category_id = c.id
    WHERE u.location_id = ANY($1)
    GROUP BY u.location_id, c.id, c.name
    ORDER BY u.location_id, count DESC;
    `,
    [locationAccess]
  );

  // Query 4: Get IP Status
  const ipStatusResult = await pool.query(
    `
    SELECT 
      u.location_id,
      COUNT(CASE WHEN u.name = 'NA' OR u.name IS NULL THEN 1 END) AS available_ips,
      COUNT(CASE WHEN u.name != 'NA' AND u.name IS NOT NULL THEN 1 END) AS reserved_ips,
      COUNT(*) AS total_ips
    FROM users u
    WHERE u.location_id = ANY($1)
    GROUP BY u.location_id;
    `,
    [locationAccess]
  );

  // Query 5: Get hardware distribution (Processor)
  const processorResult = await pool.query(
    `
    SELECT 
      u.location_id,
      'Processor' AS hardware_type,
      p.name,
      COUNT(*) AS count
    FROM users u
    LEFT JOIN processors p ON u.processor_id = p.id
    WHERE u.location_id = ANY($1)
    GROUP BY u.location_id, p.id, p.name
    ORDER BY u.location_id, count DESC;
    `,
    [locationAccess]
  );

  // Query 6: Get hardware distribution (RAM)
  const ramResult = await pool.query(
    `
    SELECT 
      u.location_id,
      'RAM' AS hardware_type,
      r.name,
      COUNT(*) AS count
    FROM users u
    LEFT JOIN rams r ON u.ram_id = r.id
    WHERE u.location_id = ANY($1)
    GROUP BY u.location_id, r.id, r.name
    ORDER BY u.location_id, count DESC;
    `,
    [locationAccess]
  );

  // Query 7: Get hardware distribution (HDD)
  const hddResult = await pool.query(
    `
    SELECT 
      u.location_id,
      'HDD' AS hardware_type,
      h.name,
      COUNT(*) AS count
    FROM users u
    LEFT JOIN hdds h ON u.hdd_id = h.id
    WHERE u.location_id = ANY($1)
    GROUP BY u.location_id, h.id, h.name
    ORDER BY u.location_id, count DESC;
    `,
    [locationAccess]
  );

  // Query 8: Get hardware distribution (OS)
  const osResult = await pool.query(
    `
    SELECT 
      u.location_id,
      'OS' AS hardware_type,
      os.name,
      COUNT(*) AS count
    FROM users u
    LEFT JOIN operating_systems os ON u.os_id = os.id
    WHERE u.location_id = ANY($1)
    GROUP BY u.location_id, os.id, os.name
    ORDER BY u.location_id, count DESC;
    `,
    [locationAccess]
  );

  // Query 9: Get software distribution (top 10)
  const softwareResult = await pool.query(
    `
    SELECT 
      u.location_id,
      s.name,
      COUNT(*) AS count
    FROM user_software us
    JOIN software s ON us.software_id = s.id
    JOIN users u ON us.user_id = u.id
    WHERE u.location_id = ANY($1)
    GROUP BY u.location_id, s.id, s.name
    ORDER BY u.location_id, count DESC
    LIMIT 10;
    `,
    [locationAccess]
  );

  // Query 10: Get device utilization
  const utilizationResult = await pool.query(
    `
    SELECT 
      u.location_id,
      COUNT(CASE WHEN u.name IS NOT NULL AND u.name != 'NA' THEN 1 END)::float / 
        NULLIF(COUNT(u.id), 0)::float * 100 AS device_utilization_percent
    FROM users u
    WHERE u.location_id = ANY($1)
    GROUP BY u.location_id;
    `,
    [locationAccess]
  );

  // Combine all results
  const hardwareResult = [
    ...processorResult.rows,
    ...ramResult.rows,
    ...hddResult.rows,
    ...osResult.rows
  ];

  // Format results by location
  const formattedData = locationResult.rows.map(location => {
    const locId = location.location_id;

    return {
      location_id: locId,
      location_name: location.location_name,
      total_users: location.total_users,
      department_distribution: deptResult.rows
        .filter(d => d.location_id === locId)
        .map(d => ({ id: d.id, name: d.name, count: d.count })),
      category_distribution: categoryResult.rows
        .filter(c => c.location_id === locId)
        .map(c => ({ id: c.id, name: c.name, count: c.count })),
      ip_status: ipStatusResult.rows.find(ip => ip.location_id === locId) || {
        available_ips: 0,
        reserved_ips: 0,
        total_ips: 0
      },
      hardware_distribution: {
        processor: processorResult.rows
          .filter(h => h.location_id === locId)
          .map(h => ({ name: h.name, count: h.count })),
        ram: ramResult.rows
          .filter(h => h.location_id === locId)
          .map(h => ({ name: h.name, count: h.count })),
        hdd: hddResult.rows
          .filter(h => h.location_id === locId)
          .map(h => ({ name: h.name, count: h.count })),
        os: osResult.rows
          .filter(h => h.location_id === locId)
          .map(h => ({ name: h.name, count: h.count }))
      },
      software_distribution: softwareResult.rows
        .filter(s => s.location_id === locId)
        .map(s => ({ name: s.name, count: s.count })),
      device_utilization_percent: 
        utilizationResult.rows.find(u => u.location_id === locId)?.device_utilization_percent || 0
    };
  });

  return formattedData;
};

export const getLookupData = async () => {
  const query = `
    SELECT 
      (SELECT JSON_AGG(jsonb_build_object('id', id, 'name', name)) FROM departments) AS departments,
      (SELECT JSON_AGG(jsonb_build_object('id', id, 'name', name)) FROM divisions) AS divisions,
      (SELECT JSON_AGG(jsonb_build_object('id', id, 'name', name)) FROM locations) AS locations,
      (SELECT JSON_AGG(jsonb_build_object('id', id, 'name', name)) FROM categories) AS categories,
      (SELECT JSON_AGG(jsonb_build_object('id', id, 'name', name)) FROM models) AS models,
      (SELECT JSON_AGG(jsonb_build_object('id', id, 'name', name)) FROM cpu_serials) AS cpu_serials,
      (SELECT JSON_AGG(jsonb_build_object('id', id, 'name', name)) FROM processors) AS processors,
      (SELECT JSON_AGG(jsonb_build_object('id', id, 'name', name)) FROM cpu_speeds) AS cpu_speeds,
      (SELECT JSON_AGG(jsonb_build_object('id', id, 'name', name)) FROM rams) AS rams,
      (SELECT JSON_AGG(jsonb_build_object('id', id, 'name', name)) FROM hdds) AS hdds,
      (SELECT JSON_AGG(jsonb_build_object('id', id, 'name', name)) FROM monitors) AS monitors,
      (SELECT JSON_AGG(jsonb_build_object('id', id, 'name', name)) FROM monitor_serials) AS monitor_serials,
      (SELECT JSON_AGG(jsonb_build_object('id', id, 'name', name)) FROM keyboards) AS keyboards,
      (SELECT JSON_AGG(jsonb_build_object('id', id, 'name', name)) FROM mice) AS mice,
      (SELECT JSON_AGG(jsonb_build_object('id', id, 'name', name)) FROM cd_dvds) AS cd_dvds,
      (SELECT JSON_AGG(jsonb_build_object('id', id, 'name', name)) FROM operating_systems) AS operating_systems,
      (SELECT JSON_AGG(jsonb_build_object('id', id, 'name', name)) FROM software) AS software
    FROM (SELECT 1) AS dummy;
  `;
  
  const result = await pool.query(query);
  return result.rows[0];
};

export const getUserById = async (userId) => {
  console.log("Fetching user by ID:", userId);
  const query = `
    SELECT 
      u.id,
      u.hostname,
      u.name,
      u.location_id,
      l.name AS location_name,
      d.name AS department_name,
      divi.name AS division_name,
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

      u.usb,
      u.created_at,
      u.updated_at,

      COALESCE(
        (SELECT JSON_AGG(s.name)
         FROM user_software us
         JOIN software s ON us.software_id = s.id
         WHERE us.user_id = u.id), '[]'
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