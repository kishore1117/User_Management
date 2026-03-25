import express from "express";
import multer from "multer";
import xlsx from "xlsx";
import db from '../config/db.js';
const { pool, initDB } = db;
import { authenticateJWT } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(authenticateJWT);

const TABLE_EXTRA_COLUMNS = {
  models: {
    category_ids: "ARRAY[]::INT[]"
  },
  departments: {
    location_ids: "ARRAY[]::INT[]"
  },
  divisions: {
    department_ids: "ARRAY[]::INT[]"
  },
  software: {
    location_ids: "ARRAY[]::INT[]"
  }
};

const TABLE_COLUMN_MAP = {
  models: "name",
  processors: "name",
  cpu_serials: "name",
  cpu_speeds: "name",
  rams: "name",
  hdds: "name",
  monitors: "name",
  keyboards: "name",
  mice: "name",
  cd_dvds: "name",
  operating_systems: "name",

  warranties: "warranty_name",
  purchase_from: "vendor_name",

  locations: "name",
  departments: "name",
  divisions: "name",
  categories: "name",
  software: "name"
};

const VALID_TABLES = Object.keys(TABLE_COLUMN_MAP);

const NORMALIZATION_CONFIG = {
   Model: {
    enabled: true,
    transforms: [
      { regex: /[^a-zA-Z0-9]/g, replace: "" }
    ],
    finalFormat: "uppercase"
  },
Processor: {
  enabled: true,
  transforms: [
    { regex: /^\s+|\s+$/g, replace: "" },              // trim

    { regex: /[^a-zA-Z0-9]/g, replace: "" },           // remove junk chars & spaces

    { regex: /(intel)(i[3579])/i, replace: "$1 $2" },  // fix IntelI5 → Intel I5

    { regex: /(amd)(ryzen[3579])/i, replace: "$1 $2" }, // optional AMD support

  ],
  finalFormat: "uppercase"
},

  Location: {
    enabled: true,
    transforms: [
      { regex: /^\s+|\s+$/g, replace: "" },
      { regex: /\s+/g, replace: " " }
    ],
    finalFormat: "titlecase"
  },

  Department:{
  enabled: true,
  transforms: [
    { regex: /^\s+|\s+$/g, replace: "" }, // remove leading/trailing spaces
    { regex: /\s+/g, replace: " " }       // normalize multiple spaces
  ],
  finalFormat: "titlecase"
},

  Division: {
  enabled: true,
  transforms: [
    { regex: /^\s+|\s+$/g, replace: "" }, // remove leading/trailing spaces
    { regex: /\s+/g, replace: " " }       // normalize multiple spaces
  ],
  finalFormat: "titlecase"
},

  Category: {
  enabled: true,
  transforms: [
    { regex: /^\s+|\s+$/g, replace: "" }, // remove leading/trailing spaces
    { regex: /\s+/g, replace: " " }       // normalize multiple spaces
  ],
  finalFormat: "titlecase"
},

  "CPU S#": {
    enabled: true,
    transforms: [
      { regex: /^\s+|\s+$/g, replace: "" }
    ],
    finalFormat: "titlecase"
  },
  "CPU Speed": {
    enabled: true,
    transforms: [
      { regex: /^\s+|\s+$/g, replace: "" },              // trim
      { regex: /(\d+(?:\.\d+)?)\s*ghz/i, replace: "$1 GHZ" }, // normalize GHz
      { regex: /\s+/g, replace: " " }                    // clean spaces
    ],
    finalFormat: "uppercase"
  },

"RAM": {
  enabled: true,
  transforms: [
    { regex: /^\s+|\s+$/g, replace: "" },                    // trim
    { regex: /(\d+(?:\.\d+)?)\s*(kb|mb|gb|tb).*/gi, replace: "$1$2" }, // 🔥 extract size only
    { regex: /\s+/g, replace: "" }                           // remove spaces
  ],
  finalFormat: "uppercase"
},

HDD: {
  enabled: true,
  transforms: [
    { regex: /^\s+|\s+$/g, replace: "" },
    { regex: /(\d+)\s*(kb|mb|gb|tb)/gi, replace: "$1$2" },
    { regex: /\s+/g, replace: "" }
  ],
  finalFormat: "uppercase"
},

  Monitor: {
    enabled: true,
    transforms: [
      { regex: /[^a-zA-Z0-9]/g, replace: "" } // remove ALL spaces + junk
    ],
    finalFormat: "titlecase"
  },

  KBD: {
    enabled: true,
    transforms: [
      { regex: /[^a-zA-Z0-9]/g, replace: "" } // remove ALL spaces + junk
    ],
    finalFormat: "titlecase"
  },

  Mouse: {
    enabled: true,
    transforms: [
      { regex: /[^a-zA-Z0-9]/g, replace: "" } // remove ALL spaces + junk
    ],
    finalFormat: "titlecase"
  },

  "CD\\DVD": {
    enabled: true,
    transforms: [
      { regex: /[^a-zA-Z0-9]/g, replace: "" } // remove ALL spaces + junk
    ],
    finalFormat: "titlecase"
  },

  Assettag: { enabled: false },
  IPAddress1: { enabled: false },
  IPAddress2: { enabled: false }
};

const applyFinalFormat = (value, format) => {
  if (!value) return value;

  switch (format) {
    case "lowercase":
      return value.toLowerCase();
    case "uppercase":
      return value.toUpperCase();
    case "titlecase":
      return value.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    default:
      return value;
  }
};

const normalizeField = (column, value) => {
  if (!value) return null;

  const config = NORMALIZATION_CONFIG[column];

  if (!config || !config.enabled) {
    return value.toString().trim();
  }

  let result = value.toString().trim();

  if (config.transforms?.length) {
    for (const { regex, replace } of config.transforms) {
      result = result.replace(regex, replace);
    }
  }

  result = result.replace(/\s+/g, " ").trim();
  result = applyFinalFormat(result, config.finalFormat);

  return result;
};

const insertLookup = async (table, column, value, client) => {
  if (!value) return null;

  if (!VALID_TABLES.includes(table)) {
    throw new Error(`Invalid table: ${table}`);
  }

  const normalized = normalizeField(column, value);
  if (!normalized) return null;

  const columnName = TABLE_COLUMN_MAP[table];
  const extraCols = TABLE_EXTRA_COLUMNS[table];

  let columns = [columnName];
  let values = ["$1"];
  let queryValues = [normalized];

  // 🔥 Add extra required columns dynamically
  if (extraCols) {
    let i = 2;

    for (const [col, defaultVal] of Object.entries(extraCols)) {
      columns.push(col);
      values.push(defaultVal); // directly injected SQL (safe here)
    }
  }

  const query = `
    INSERT INTO ${table} (${columns.join(", ")})
    VALUES (${values.join(", ")})
    ON CONFLICT (${columnName})
    DO UPDATE SET ${columnName} = EXCLUDED.${columnName}
    RETURNING id
  `;

  const res = await client.query(query, queryValues);

  return res.rows[0].id;
};

const upload = multer({ dest: "uploads/" });

router.post("/upload", upload.single("file"), async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet, { defval: null });

    const LOOKUP_TABLES = {
      Model: "models",
      "CPU S#": "cpu_serials",
      Processor: "processors",
      "CPU Speed": "cpu_speeds",
      "RAM": "rams",
      HDD: "hdds",
      Monitor: "monitors",
      KBD: "keyboards",
      Mouse: "mice",
      "CD\\DVD": "cd_dvds"
    };

    let success = 0;
    let skipped = 0;

    for (const row of data) {
      await client.query("SAVEPOINT row_save");

      try {
        let {
          Hostname,
          Name,
          Department,
          Division,
          Category,
          Location,
          Floor,
          IPAddress1,
          IPAddress2,
          Assettag,
          Serial_number,
          Printer_type,
          warrenty,
          "Purchase From": purchaseFrom,
          ...rest
        } = row;

        // Normalize IPs
        IPAddress1 = normalizeField("IPAddress1", IPAddress1);
        IPAddress2 = normalizeField("IPAddress2", IPAddress2);

        if (!IPAddress1) {
          skipped++;
          await client.query("ROLLBACK TO SAVEPOINT row_save");
          continue;
        }

        // Duplicate IP check
        const ipCheck = await client.query(
          `SELECT id FROM users 
       WHERE ip_address1=$1 OR ip_address2=$1 
          OR ip_address1=$2 OR ip_address2=$2`,
          [IPAddress1, IPAddress2]
        );

        if (ipCheck.rows.length > 0) {
          skipped++;
          await client.query("ROLLBACK TO SAVEPOINT row_save");
          continue;
        }

        // Lookup inserts (IMPORTANT: pass client)
        const location_id = await insertLookup("locations", "Location", Location, client);
        const department_id = await insertLookup("departments", "Department", Department, client);
        const division_id = await insertLookup("divisions", "Division", Division, client);
        const category_id = await insertLookup("categories", "Category", Category, client);
        const warranty_id = await insertLookup("warranties", "warrenty", warrenty, client);
        const purchase_from_id = await insertLookup("purchase_from", "Purchase From", purchaseFrom, client);

        const lookupIds = {};
        let softwareStart = false;

        for (const [col, val] of Object.entries(rest)) {
          // Trim column name to remove trailing/leading spaces
          const trimmedCol = col.trim();
          
          if (!val) continue;

          const normalized = normalizeField(trimmedCol, val);
          if (!normalized) continue;

          if (trimmedCol === "O/S") {
            softwareStart = true;
            lookupIds.os_id = await insertLookup("operating_systems", trimmedCol, val, client);
            continue;
          }

          if (LOOKUP_TABLES[trimmedCol]) {
            lookupIds[trimmedCol] = await insertLookup(LOOKUP_TABLES[trimmedCol], trimmedCol, val, client);
            continue;
          }

          const truthy = ["1", "yes", "y", "true"];

          if (softwareStart && truthy.includes(normalized.toLowerCase())) {
            const swId = await insertLookup("software", trimmedCol, trimmedCol, client);
            lookupIds.software ??= [];
            lookupIds.software.push(swId);
          }
        }

        // Insert user
        const userRes = await client.query(
          `
      INSERT INTO users
      (hostname, name, department_id, division_id, location_id, category_id,
       model_id, cpu_serial_id, processor_id, cpu_speed_id, ram_id, hdd_id,
       monitor_id, keyboard_id, mouse_id, cd_dvd_id, os_id,
       warranty_id, purchase_from_id,
       floor, ip_address1, ip_address2, asset_tag,
       monitor_serial_number, printer_type)
      VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,
       $13,$14,$15,$16,$17,$18,$19,$20,
       $21,$22,$23,$24,$25)
      RETURNING id
      `,
          [
            normalizeField("Hostname", Hostname),
            normalizeField("Name", Name),
            department_id,
            division_id,
            location_id,
            category_id,
            lookupIds["Model"] || null,
            lookupIds["CPU S#"] || null,
            lookupIds["Processor"] || null,
            lookupIds["CPU Speed"] || null,
            lookupIds["RAM"] || null,
            lookupIds["HDD"] || null,
            lookupIds["Monitor"] || null,
            lookupIds["KBD"] || null,
            lookupIds["Mouse"] || null,
            lookupIds["CD\\DVD"] || null,
            lookupIds.os_id || null,
            warranty_id,
            purchase_from_id,
            normalizeField("Floor", Floor),
            IPAddress1,
            IPAddress2,
            normalizeField("Assettag", Assettag),
            normalizeField("Serial_number", Serial_number),
            normalizeField("Printer_type", Printer_type)
          ]
        );

        const user_id = userRes.rows[0].id;

        // Map software
        if (lookupIds.software?.length) {
          for (const swId of lookupIds.software) {
            await client.query(
              `INSERT INTO user_software (user_id, software_id)
           VALUES ($1,$2)
           ON CONFLICT DO NOTHING`,
              [user_id, swId]
            );
          }
        }

        success++;

      } catch (err) {
        console.error("Row failed:", err.message);

        // 🔥 KEY FIX
        await client.query("ROLLBACK TO SAVEPOINT row_save");

        skipped++;
      }
    }

    await client.query("COMMIT");

    res.json({
      message: "Upload completed",
      success,
      skipped
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  } finally {
    client.release();
  }
});

router.get("/download", async (req, res) => {
  try {

    const locationAccess = req.user?.location_ids || [];

    if (!Array.isArray(locationAccess) || locationAccess.length === 0) {
      return res.status(400).json({ message: "No valid location access found" });
    }

    /* ================= 1. SOFTWARE LIST ================= */
    const softwareRes = await pool.query(
      `SELECT id, name FROM software ORDER BY name`
    );
    const softwareList = softwareRes.rows;

    /* ================= 2. USERS ================= */
    const usersRes = await pool.query(
      `
      SELECT 
        u.id,
        u.hostname,
        u.name,
        u.ip_address1,
        u.ip_address2,
        u.floor,

        l.name AS location,
        d.name AS department,
        dv.name AS division,
        c.name AS category,

        m.name AS model,
        cs.name AS cpu_serial,
        p.name AS processor,
        sp.name AS cpu_speed,
        r.name AS ram,
        h.name AS hdd,
        mn.name AS monitor,
        kb.name AS keyboard,
        me.name AS mouse,
        cd.name AS cd_dvd,
        os.name AS operating_system,

        u.usb

      FROM users u
      LEFT JOIN locations l ON u.location_id = l.id
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN divisions dv ON u.division_id = dv.id
      LEFT JOIN categories c ON u.category_id = c.id

      LEFT JOIN models m ON u.model_id = m.id
      LEFT JOIN cpu_serials cs ON u.cpu_serial_id = cs.id
      LEFT JOIN processors p ON u.processor_id = p.id
      LEFT JOIN cpu_speeds sp ON u.cpu_speed_id = sp.id
      LEFT JOIN rams r ON u.ram_id = r.id
      LEFT JOIN hdds h ON u.hdd_id = h.id
      LEFT JOIN monitors mn ON u.monitor_id = mn.id
      LEFT JOIN keyboards kb ON u.keyboard_id = kb.id
      LEFT JOIN mice me ON u.mouse_id = me.id
      LEFT JOIN cd_dvds cd ON u.cd_dvd_id = cd.id
      LEFT JOIN operating_systems os ON u.os_id = os.id

      WHERE u.location_id = ANY($1::int[])
      ORDER BY u.id;
      `,
      [locationAccess]
    );

    const users = usersRes.rows;

    /* ================= 3. USER ↔ SOFTWARE MAP ================= */
    const userSoftwareRes = await pool.query(`
      SELECT user_id, software_id FROM user_software
    `);

    const userSoftwareMap = {};
    userSoftwareRes.rows.forEach((row) => {
      if (!userSoftwareMap[row.user_id]) {
        userSoftwareMap[row.user_id] = new Set();
      }
      userSoftwareMap[row.user_id].add(row.software_id);
    });

    /* ================= 4. EXCEL ROWS ================= */
    const excelRows = users.map((user) => {
      const baseRow = {
        Hostname: user.hostname,
        Name: user.name,
        Location: user.location,
        Department: user.department,
        Division: user.division,
        Category: user.category,      // ✅ FIXED
        "IP Address1": user.ip_address1,
        "IP Address2": user.ip_address2,
        Floor: user.floor,
        Model: user.model,
        "CPU Serial": user.cpu_serial,
        Processor: user.processor,
        "CPU Speed": user.cpu_speed,
        RAM: user.ram,                // ✅ FIXED
        HDD: user.hdd,
        Monitor: user.monitor,
        Keyboard: user.keyboard,
        Mouse: user.mouse,
        "CD/DVD": user.cd_dvd,
        OS: user.operating_system,
        USB: user.usb ? "Yes" : "No",
      };

      // ✅ PREFIX SOFTWARE COLUMNS
      for (const sw of softwareList) {
        baseRow[`SW_${sw.name}`] =
          userSoftwareMap[user.id]?.has(sw.id) ? "Yes" : "No";
      }

      return baseRow;
    });

    /* ================= 5. EXCEL ================= */
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(excelRows);
    xlsx.utils.book_append_sheet(workbook, worksheet, "Users");

    const filePath = "./downloads/users_export.xlsx";
    xlsx.writeFile(workbook, filePath);

    /* ================= 6. DOWNLOAD ================= */
    res.download(filePath, "users_export.xlsx");
  } catch (err) {
    console.error("Download error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});


export default router;
