import db from '../config/db.js';
const { pool, initDB } = db;

export const getAllUsers = async () => {
  const result = await pool.query(`
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
        u.model,
        u.cpu_serial,
        u.processor,
        u.cpu_speed,
        u.ram,
        u.hdd,
        u.monitor,
        u.monitor_serial,
        u.keyboard,
        u.mouse,
        u.cd_dvd,
        u.os,
        u.usb,
        u.created_at,
        u.updated_at,
        -- Aggregate software names into JSON array
        COALESCE(
          JSON_AGG(s.name) FILTER (WHERE s.name IS NOT NULL),
          '[]'
        ) AS software
      FROM users u
      LEFT JOIN locations l ON u.location_id = l.id
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN divisions divi ON u.division_id = divi.id
      LEFT JOIN categories c ON u.category_id = c.id
      LEFT JOIN user_software us ON u.id = us.user_id
      LEFT JOIN software s ON us.software_id = s.id
      GROUP BY 
        u.id, d.name, divi.name, l.name, c.name
      ORDER BY 
        u.id ASC;
    `);
  return result;
};
export const getUserById = async (id) => {
  const result = await pool.query(
    `SELECT 
      u.id,
      u.hostname,
      u.name,
      u.location_id,
      d.name AS department_name,
      divi.name AS division_name,
      l.name AS location_name,
      c.name AS category_name,
      u.ip_address1,
      u.ip_address2,
      u.floor,
      u.model,
      u.cpu_serial,
      u.processor,
      u.cpu_speed,
      u.ram,
      u.hdd,
      u.monitor,
      u.monitor_serial,
      u.keyboard,
      u.mouse,
      u.cd_dvd,
      u.os,
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
    LEFT JOIN user_software us ON u.id = us.user_id
    LEFT JOIN software s ON us.software_id = s.id
    WHERE u.id = $1
    GROUP BY 
      u.id, d.name, divi.name, l.name, c.name
    LIMIT 1;
    `,
    [id]
  );

  return result.rows[0] || null; 
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
    model,
    cpu_serial,
    processor,
    cpu_speed,
    ram,
    hdd,
    monitor,
    monitor_serial,
    keyboard,
    mouse,
    cd_dvd,
    os,
    usb,
  } = data;
  

  const access = await pool.query(
    `SELECT 1 FROM user_access WHERE $1 = ANY(location_ids)`,
    [ location_id]
  );
  if (access.rowCount === 0)
    return res.status(403).json({ message: "❌ You don’t have access to this location." });


  const result = await pool.query(
    `INSERT INTO users 
      (hostname, name, department_id, division_id, location_id, category_id, 
       ip_address1, ip_address2, floor, model, cpu_serial, processor, cpu_speed, 
       ram, hdd, monitor, monitor_serial, keyboard, mouse, cd_dvd, os, usb)
       VALUES 
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
      RETURNING *`,
    [
      hostname, name, department_id, division_id, location_id, category_id,
      ip_address1, ip_address2, floor, model, cpu_serial, processor, cpu_speed,
      ram, hdd, monitor, monitor_serial, keyboard, mouse, cd_dvd, os, usb
    ]
  );
  return result.rows[0];
}


async function updateUser(id, userData) {
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
    model,
    cpu_serial,
    processor,
    cpu_speed,
    ram,
    hdd,
    monitor,
    monitor_serial,
    keyboard,
    mouse,
    cd_dvd,
    os,
    usb
  } = userData;

  const query = `
    UPDATE users
    SET hostname=$1, name=$2, department_id=$3, division_id=$4, location_id=$5,
        category_id=$6, ip_address1=$7, ip_address2=$8, floor=$9, model=$10,
        cpu_serial=$11, processor=$12, cpu_speed=$13, ram=$14, hdd=$15,
        monitor=$16, monitor_serial=$17, keyboard=$18, mouse=$19, cd_dvd=$20,
        os=$21, usb=$22, updated_at=NOW()
    WHERE id=$23
    RETURNING *;
  `;

  const result = await pool.query(query, [
    hostname, name, department_id, division_id, location_id, category_id,
    ip_address1, ip_address2, floor, model, cpu_serial, processor, cpu_speed,
    ram, hdd, monitor, monitor_serial, keyboard, mouse, cd_dvd, os, usb, id
  ]);

  return result.rows[0];
}

async function deleteUser(id) {
  await pool.query("DELETE FROM users WHERE id=$1", [id]);
}
export default { addUser, getAllUsers, updateUser, deleteUser, getUserById };