import express from "express";
import multer from "multer";
import xlsx from "xlsx";
import db from '../config/db.js';
const { pool, initDB } = db; 

const router = express.Router();

// File upload setup
const upload = multer({ dest: "uploads/" });

// ✅ Upload route
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    for (const row of data) {
      // ✅ Safe destructuring with defaults
      const {
        Hostname = null,
        Name = null,
        Department = null,
        Division = null,
        Location = null,
        Category = null,
        "IP Address1": ip_address1 = null,
        "IP Address2": ip_address2 = null,
        Floor = null,
        Model = null,
        "CPU S#": cpu_serial = null,
        Processor = null,
        "CPU Speed": cpu_speed = null,
        RAM = null,
        HDD = null,
        Monitor = null,
        "Monitor S#": monitor_serial = null,
        KBD: keyboard = null,
        Mouse: mouse = null,
        "CD\\DVD": cd_dvd = null,
        "O/S": os = null,
        USB = null,
        ...softwareColumns
      } = row;

      // Skip if no Hostname or Name (essential fields)
      if (!Hostname || !Name) continue;

      // 🔹 Ensure Location exists or create
      let location_id = null;
      if (Location && Location.trim() !== "") {
        const locRes = await pool.query(
          `INSERT INTO locations (name, address)
           VALUES ($1, '')
           ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
           RETURNING id`,
          [Location.trim()]
        );
        location_id = locRes.rows[0].id;
      }

      // 🔹 Ensure Department exists or create
      let department_id = null;
      if (Department && Department.trim() !== "" && location_id) {
        const deptRes = await pool.query(
          `INSERT INTO departments (name, location_id)
           VALUES ($1, $2)
           ON CONFLICT (name, location_id) DO UPDATE SET name = EXCLUDED.name
           RETURNING id`,
          [Department.trim(), location_id]
        );
        department_id = deptRes.rows[0].id;
      }

      // 🔹 Ensure Division exists or create
      let division_id = null;
      if (Division && Division.trim() !== "" && department_id) {
        const divRes = await pool.query(
          `INSERT INTO divisions (name, department_id)
           VALUES ($1, $2)
           ON CONFLICT (name, department_id) DO UPDATE SET name = EXCLUDED.name
           RETURNING id`,
          [Division.trim(), department_id]
        );
        division_id = divRes.rows[0].id;
      }

      // 🔹 Ensure Category exists or create (belongs to location)
      let category_id = null;
      if (Category && Category.trim() !== "" && location_id) {
        const catRes = await pool.query(
          `INSERT INTO categories (name, location_id)
           VALUES ($1, $2)
           ON CONFLICT (name, location_id) DO UPDATE SET name = EXCLUDED.name
           RETURNING id`,
          [Category.trim(), location_id]
        );
        category_id = catRes.rows[0].id;
      }

      // 🔹 Insert user record
      const userRes = await pool.query(
        `INSERT INTO users 
         (hostname, name, department_id, division_id, location_id, category_id, 
          ip_address1, ip_address2, floor, model, cpu_serial, processor, cpu_speed, 
          ram, hdd, monitor, monitor_serial, keyboard, mouse, cd_dvd, os, usb)
         VALUES 
         ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
         RETURNING id`,
        [
          Hostname,
          Name,
          department_id,
          division_id,
          location_id,
          category_id,
          ip_address1,
          ip_address2,
          Floor,
          Model,
          cpu_serial,
          Processor,
          cpu_speed,
          RAM,
          HDD,
          Monitor,
          monitor_serial,
          keyboard,
          mouse,
          cd_dvd,
          os,
          USB?.toString().toLowerCase() === "yes" ||
          USB === 1 ||
          USB === true
        ]
      );

      const user_id = userRes.rows[0].id;

      // 🔹 Link software (columns with value 1 / yes)
      for (const [softwareName, val] of Object.entries(softwareColumns)) {
        if (
          val === 1 ||
          val === "1" ||
          val?.toString().toLowerCase() === "yes"
        ) {
          const swRes = await pool.query(
            `INSERT INTO software (name)
             VALUES ($1)
             ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
             RETURNING id`,
            [softwareName.trim()]
          );
          const software_id = swRes.rows[0].id;

          await pool.query(
            `INSERT INTO user_software (user_id, software_id)
             VALUES ($1, $2)
             ON CONFLICT (user_id, software_id) DO NOTHING`,
            [user_id, software_id]
          );
        }
      }
    }

    res.json({ message: "✅ Data uploaded successfully" });
  } catch (error) {
    console.error("❌ Upload error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
