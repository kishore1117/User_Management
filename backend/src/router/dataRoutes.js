import express from "express";
import multer from "multer";
import xlsx from "xlsx";
import db from '../config/db.js';
const { pool, initDB } = db;
import { authenticateJWT } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(authenticateJWT);

// File upload setup
const upload = multer({ dest: "uploads/" });

// router.post("/upload", upload.single("file"), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ message: "No file uploaded" });
//     }

//     const workbook = xlsx.readFile(req.file.path);
//     const sheet = workbook.Sheets[workbook.SheetNames[0]];
//     const data = xlsx.utils.sheet_to_json(sheet, { defval: null });

//     const DEFAULT_WARRANTY_MONTHS = 12;
//     const DEFAULT_VENDOR_CONTACT = "0000000000";

//     // ---------- Lookup table mapping (EXCEPT warranty & purchase_from) ----------
//     const LOOKUP_TABLES = {
//       Model: "models",
//       "CPU S#": "cpu_serials",
//       Processor: "processors",
//       "CPU Speed": "cpu_speeds",
//       "RAM": "rams",
//       HDD: "hdds",
//       Monitor: "monitors",
//       "Monitor S#": "monitor_serials",
//       KBD: "keyboards",
//       Mouse: "mice",
//       "CD\\DVD": "cd_dvds",
//       "OS":'operating_systems'
//     };

//     for (const row of data) {
//       const {
//         Hostname,
//         Name,
//         Department,
//         Division,
//         Category,
//         Location,
//         Floor,
//         IPAddress1,
//         IPAddress2,
//         Assettag,
//         warrenty,
//         "Purchase From": purchaseFrom,
//         ...rest
//       } = row;

//       if (!Hostname || !Name) continue;

//       // ---------- LOCATION ----------
//       let location_id = null;
//       if (Location?.trim()) {
//         const loc = await pool.query(
//           `INSERT INTO locations (name, address)
//            VALUES ($1,'')
//            ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
//            RETURNING id`,
//           [Location.trim()]
//         );
//         location_id = loc.rows[0].id;
//       }

//       // ---------- DEPARTMENT ----------
//       let department_id = null;
//       console.log(Department, 'department')
//       if (Department?.trim() && location_id && (Department != 'N/A'|| Department != 'NA') ){
//         const dept = await pool.query(
//           `INSERT INTO departments (name, location_id)
//            VALUES ($1,$2)
//            ON CONFLICT (name) DO UPDATE SET location_id = EXCLUDED.location_id
//            RETURNING id`,
//           [Department.trim(), location_id]
//         );
//         department_id = dept.rows[0].id;
//       }

//       // ---------- DIVISION ----------
//       let division_id = null;
//       if (Division?.trim() && department_id) {
//         const div = await pool.query(
//           `INSERT INTO divisions (name, department_id)
//            VALUES ($1,$2)
//            ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
//            RETURNING id`,
//           [Division.trim(), department_id]
//         );
//         division_id = div.rows[0].id;
//       }

//       // ---------- CATEGORY ----------
//       let category_id = null;
//       if (Category?.trim() && location_id) {
//         const cat = await pool.query(
//           `INSERT INTO categories (name, location_id)
//            VALUES ($1,$2)
//            ON CONFLICT (name) DO UPDATE SET location_id = EXCLUDED.location_id
//            RETURNING id`,
//           [Category.trim(), location_id]
//         );
//         category_id = cat.rows[0].id;
//       }

//       // ---------- WARRANTY (CUSTOM) ----------
//       let warranty_id = null;
//       if (warrenty?.trim()) {
//         const existing = await pool.query(
//           `SELECT id FROM warranties WHERE warranty_name = $1`,
//           [warrenty.trim()]
//         );

//         if (existing.rows.length) {
//           warranty_id = existing.rows[0].id;
//         } else {
//           const inserted = await pool.query(
//             `INSERT INTO warranties (warranty_name, duration_months)
//              VALUES ($1,$2)
//              RETURNING id`,
//             [warrenty.trim(), DEFAULT_WARRANTY_MONTHS]
//           );
//           warranty_id = inserted.rows[0].id;
//         }
//       }

//       // ---------- PURCHASE FROM (CUSTOM) ----------
//       let purchase_from_id = null;
//       if (purchaseFrom?.trim()) {
//         const existingVendor = await pool.query(
//           `SELECT id FROM purchase_from WHERE vendor_name = $1`,
//           [purchaseFrom.trim()]
//         );

//         if (existingVendor.rows.length) {
//           purchase_from_id = existingVendor.rows[0].id;
//         } else {
//           const insertedVendor = await pool.query(
//             `INSERT INTO purchase_from (vendor_name, contact_details)
//              VALUES ($1,$2)
//              RETURNING id`,
//             [purchaseFrom.trim(), DEFAULT_VENDOR_CONTACT]
//           );
//           purchase_from_id = insertedVendor.rows[0].id;
//         }
//       }

//       const lookupIds = {};
//       let softwareStart = false;

//       // for (const [col, val] of Object.entries(rest)) {
//       //   console.log(col,val)
//       //   if (!val) continue;

//       //   const col = rawCol.trim();

//       //   if (softwareStart) {
//       //     // Software mapping after O/S Key
//       //     if (val === 1 || val === "1" || val?.toString().toLowerCase() === "yes") {
//       //       const swRes = await pool.query(
//       //         `INSERT INTO software (name)
//       //          VALUES ($1)
//       //          ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
//       //          RETURNING id`,
//       //         [col.trim()]
//       //       );
//       //       if (!lookupIds.software) lookupIds.software = [];
//       //       lookupIds.software.push(swRes.rows[0].id);
//       //     }
//       //   } else if (col === "O/S") {
//       //     softwareStart = true;

//       //     const osRes = await pool.query(
//       //       `INSERT INTO operating_systems (name)
//       //        VALUES ($1)
//       //        ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
//       //        RETURNING id`,
//       //       [val.toString().trim()]
//       //     );
//       //     lookupIds[col] = osRes.rows[0].id;

//       //   } else if (LOOKUP_TABLES[col]) {
//       //     console.log(LOOKUP_TABLES[col],'col')
//       //     // Lookup tables  
//       //     const table = LOOKUP_TABLES[col];
//       //     const res = await pool.query(
//       //       `INSERT INTO ${table} (name)
//       //        VALUES ($1)
//       //        ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
//       //        RETURNING id`,
//       //       [val.toString().trim()]
//       //     );
//       //     lookupIds[col] = res.rows[0].id;

//       //   } else if (col === "IP Address2") {
//       //     lookupIds["ip_address2"] = val;
//       //   }
//       // }

//       for (const [rawCol, val] of Object.entries(rest)) {
//   if (!val) continue;

//   const col = rawCol.trim();

//   // ---------- O/S ----------
//   if (col === "O/S") {
//     softwareStart = true;
//     const osRes = await pool.query(
//       `INSERT INTO operating_systems (name)
//        VALUES ($1)
//        ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
//        RETURNING id`,
//       [val.toString().trim()]
//     );
//     lookupIds["O/S"] = osRes.rows[0].id;
//     continue;
//   }

//   // ---------- HARDWARE LOOKUPS (ALWAYS ALLOWED) ----------
//   if (LOOKUP_TABLES[col] ) {
//     const table = LOOKUP_TABLES[col];
//     const res = await pool.query(
//       `INSERT INTO ${table} (name)
//        VALUES ($1)
//        ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
//        RETURNING id`,
//       [val.toString().trim()]
//     );
//     lookupIds[col] = res.rows[0].id;
//     continue;
//   }

//   // ---------- SOFTWARE (ONLY AFTER O/S) ----------
//   if (softwareStart) {
//     if (val === 1 || val === "1" || val?.toString().toLowerCase() === "yes") {
//       const swRes = await pool.query(
//         `INSERT INTO software (name)
//          VALUES ($1)
//          ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
//          RETURNING id`,
//         [col]
//       );
//       if (!lookupIds.software) lookupIds.software = [];
//       lookupIds.software.push(swRes.rows[0].id);
//     }
//   }
// }

//       console.log(lookupIds)

//         // ---------- Check if user exists ----------
//       let userRes = await pool.query(
//         `SELECT id FROM users WHERE hostname = $1 OR asset_tag = $2`,
//         [Hostname, Assettag]
//       );

//       let user_id;
//       if (userRes.rows.length) {
//         console.log(IPAddress1, lookupIds["ip_address2"] || null, 'jksdajkdasjk');
//         // Update existing user
//         user_id = userRes.rows[0].id;
//         await pool.query(
//           `UPDATE users SET
//             name=$1, department_id=$2, division_id=$3, location_id=$4, category_id=$5,
//             model_id=$6, cpu_serial_id=$7, processor_id=$8, cpu_speed_id=$9, ram_id=$10, hdd_id=$11,
//             monitor_id=$12, monitor_serial_id=$13, keyboard_id=$14, mouse_id=$15, cd_dvd_id=$16, os_id=$17,
//             warranty_id=$18, purchase_from_id=$19,
//             floor=$20, ip_address1=$21, ip_address2=$22, asset_tag=$23
//            WHERE id=$24`,
//           [
//             Name, department_id, division_id, location_id, category_id,
//             lookupIds["Model"] || null,
//             lookupIds["CPU S#"] || null,
//             lookupIds["Processor"] || null,
//             lookupIds["CPU Speed"] || null,
//             lookupIds["RAM"] || null,
//             lookupIds["HDD"] || null,
//             lookupIds["Monitor"] || null,
//             lookupIds["Monitor S#"] || null,
//             lookupIds["KBD"] || null,
//             lookupIds["Mouse"] || null,
//             lookupIds["CD\\DVD"] || null,
//             lookupIds["O/S"] || null,
//             warranty_id,
//             purchase_from_id,
//             Floor, IPAddress1, IPAddress2, Assettag,
//             user_id
//           ]
//         );
//       } else {
//         // Insert new user
//         const insertRes = await pool.query(
//           `INSERT INTO users
//             (hostname, name, department_id, division_id, location_id, category_id,
//              model_id, cpu_serial_id, processor_id, cpu_speed_id, ram_id, hdd_id,
//              monitor_id, monitor_serial_id, keyboard_id, mouse_id, cd_dvd_id, os_id,
//              warranty_id, purchase_from_id,
//              floor, ip_address1, ip_address2, asset_tag)
//            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,
//                    $13,$14,$15,$16,$17,$18,$19,$20,
//                    $21,$22,$23,$24)
//            RETURNING id`,
//           [
//             Hostname, Name, department_id, division_id, location_id, category_id, 
//             lookupIds["Model"] || null,
//             lookupIds["CPU S#"] || null,
//             lookupIds["Processor"] || null,
//             lookupIds["CPU Speed"] || null,
//             lookupIds["RAM"] || null,
//             lookupIds["HDD"] || null,
//             lookupIds["Monitor"] || null,
//             lookupIds["Monitor S#"] || null,
//             lookupIds["KBD"] || null,
//             lookupIds["Mouse"] || null,
//             lookupIds["CD\\DVD"] || null,
//             lookupIds["O/S"] || null,
//             warranty_id,
//             purchase_from_id,
//             Floor, IPAddress1, IPAddress2, Assettag
//           ]
//         );
//         user_id = insertRes.rows[0].id;
//       }

//       // ---------- MAP SOFTWARE ----------
//       if (lookupIds.software?.length) {
//         for (const swId of lookupIds.software) {
//           await pool.query(
//             `INSERT INTO user_software (user_id, software_id)
//              VALUES ($1,$2)
//              ON CONFLICT (user_id, software_id) DO NOTHING`,
//             [user_id, swId]
//           );
//         }
//       }
//     }

//     res.json({ message: "✅ Upload completed successfully" });

//   } catch (error) {
//     console.error("❌ Upload error:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });



// router.get("/download", async (req, res) => {
//   try {
//     console.log("User info for download:", req.user);
//     const locationAccess = req.user?.location_ids || [];

//     if (!Array.isArray(locationAccess) || locationAccess.length === 0) {
//       return res.status(400).json({ message: "No valid location access found" });
//     }

//     // 1. Get software list
//     const softwareRes = await pool.query(
//       `SELECT id, name FROM software ORDER BY name`
//     );
//     const softwareList = softwareRes.rows;

//     // 2. Fetch only users where location_id is in locationAccess[]
//     const usersRes = await pool.query(
//       `
//       SELECT 
//         u.id,
//         u.hostname,
//         u.name,
//         u.ip_address1,
//         u.ip_address2,
//         u.floor,

//         l.name AS location,
//         d.name AS department,
//         dv.name AS division,
//         c.name AS category,

//         m.name AS model,
//         cs.name AS cpu_serial,
//         p.name AS processor,
//         sp.name AS cpu_speed,
//         r.name AS ram,
//         h.name AS hdd,
//         mn.name AS monitor,
//         ms.name AS monitor_serial,
//         kb.name AS keyboard,
//         me.name AS mouse,
//         cd.name AS cd_dvd,
//         os.name AS operating_system,

//         u.usb

//       FROM users u
//       LEFT JOIN locations l ON u.location_id = l.id
//       LEFT JOIN departments d ON u.department_id = d.id
//       LEFT JOIN divisions dv ON u.division_id = dv.id
//       LEFT JOIN categories c ON u.category_id = c.id

//       LEFT JOIN models m ON u.model_id = m.id
//       LEFT JOIN cpu_serials cs ON u.cpu_serial_id = cs.id
//       LEFT JOIN processors p ON u.processor_id = p.id
//       LEFT JOIN cpu_speeds sp ON u.cpu_speed_id = sp.id
//       LEFT JOIN rams r ON u.ram_id = r.id
//       LEFT JOIN hdds h ON u.hdd_id = h.id
//       LEFT JOIN monitors mn ON u.monitor_id = mn.id
//       LEFT JOIN monitor_serials ms ON u.monitor_serial_id = ms.id
//       LEFT JOIN keyboards kb ON u.keyboard_id = kb.id
//       LEFT JOIN mice me ON u.mouse_id = me.id
//       LEFT JOIN cd_dvds cd ON u.cd_dvd_id = cd.id
//       LEFT JOIN operating_systems os ON u.os_id = os.id

//       WHERE u.location_id = ANY($1::int[])
//       ORDER BY u.id;
//     `,
//       [locationAccess]
//     );

//     const users = usersRes.rows;
//     // 3. Get user → software mapping
//     const userSoftwareRes = await pool.query(`
//       SELECT user_id, software_id 
//       FROM user_software
//     `);

//     const userSoftwareMap = {};
//     userSoftwareRes.rows.forEach((row) => {
//       if (!userSoftwareMap[row.user_id])
//         userSoftwareMap[row.user_id] = new Set();
//       userSoftwareMap[row.user_id].add(row.software_id);
//     });

//     // 4. Build Excel rows
//     const excelRows = users.map((user) => {
      
//       const baseRow = {
//         Hostname: user.hostname,
//         Name: user.name,
//         Location: user.location,
//         Department: user.department,
//         Division: user.division,
//         Category: user.category,
//         "IP Address1": user.ip_address1,
//         "IP Address2": user.ip_address2,
//         Floor: user.floor,
//         Model: user.model,
//         "CPU Serial": user.cpu_serial,
//         Processor: user.processor,
//         "CPU Speed": user.cpu_speed,
//         RAM: user.ram,
//         HDD: user.hdd,
//         Monitor: user.monitor,
//         "Monitor Serial": user.monitor_serial,
//         Keyboard: user.keyboard,
//         Mouse: user.mouse,
//         "CD/DVD": user.cd_dvd,
//         OS: user.operating_system,
//         USB: user.usb ? "Yes" : "No",
//       };

//       // Dynamic software columns: Yes/No
//       for (const sw of softwareList) {
//         baseRow[sw.name] = userSoftwareMap[user.id]?.has(sw.id)
//           ? "Yes"
//           : "No";
//       }

//       return baseRow;
//     });

//     // 5. Create Excel workbook
//     const workbook = xlsx.utils.book_new();
//     const worksheet = xlsx.utils.json_to_sheet(excelRows);

//     xlsx.utils.book_append_sheet(workbook, worksheet, "Users");

//     const filePath = "./downloads/users_export.xlsx";
//     xlsx.writeFile(workbook, filePath);

//     // 6. Send the file to the browser
//     res.download(filePath, "users_export.xlsx");
//   } catch (err) {
//     console.error("Download error:", err);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });


// router.post("/upload", upload.single("file"), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ message: "No file uploaded" });
//     }

//     const workbook = xlsx.readFile(req.file.path);
//     const sheet = workbook.Sheets[workbook.SheetNames[0]];
//     const data = xlsx.utils.sheet_to_json(sheet, { defval: null });

//     // ---------- HELPERS ----------
//     const normalizeNullable = (val) => {
//       if (!val) return null;
//       const v = val.toString().trim().toUpperCase();
//       if (["N/A", "NA", "-"].includes(v)) return null;
//       return val.toString().trim();
//     };

//     const normalizeRequiredText = (val) => {
//       if (!val) return "N/A";
//       return val.toString().trim();
//     };

//     const LOOKUP_TABLES = {
//       Model: "models",
//       "CPU S#": "cpu_serials",
//       Processor: "processors",
//       "CPU Speed": "cpu_speeds",
//       RAM: "rams",
//       HDD: "hdds",
//       Monitor: "monitors",
//       "Monitor S#": "monitor_serials",
//       KBD: "keyboards",
//       Mouse: "mice",
//       "CD-Rom": "cd_dvds"
//     };

//     for (const row of data) {

//       const {
//         Hostname,
//         Name,
//         Department,
//         Division,
//         Category,
//         Location,
//         Floor,
//         IPAddress1,
//         IPAddress2,
//         Assettag,
//         ...rest
//       } = row;

//       // ---------- MANDATORY ----------
//       const locationVal = normalizeNullable(Location);
//       const ip1Val = normalizeNullable(IPAddress1);

//       if (!locationVal || !ip1Val) continue;

//       // ---------- NOT NULL TEXT ----------
//       const HostnameVal = normalizeRequiredText(Hostname);
//       const NameVal = normalizeRequiredText(Name);

//       // ---------- OPTIONAL ----------
//       const AssettagVal = normalizeNullable(Assettag);
//       const FloorVal = normalizeNullable(Floor);
//       const ip2Val = normalizeNullable(IPAddress2);

//       // ---------- LOCATION ----------
//       const locRes = await pool.query(
//         `INSERT INTO locations (name)
//          VALUES ($1)
//          ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
//          RETURNING id`,
//         [locationVal]
//       );
//       const location_id = locRes.rows[0].id;

//       // ---------- DEPARTMENT ----------
//       let department_id = null;
//       const deptVal = normalizeNullable(Department);
//       if (deptVal) {
//         const res = await pool.query(
//           `INSERT INTO departments (name, location_id)
//            VALUES ($1,$2)
//            ON CONFLICT (name) DO UPDATE SET location_id = EXCLUDED.location_id
//            RETURNING id`,
//           [deptVal, location_id]
//         );
//         department_id = res.rows[0].id;
//       }

//       // ---------- DIVISION ----------
//       let division_id = null;
//       const divVal = normalizeNullable(Division);
//       if (divVal && department_id) {
//         const res = await pool.query(
//           `INSERT INTO divisions (name, department_id)
//            VALUES ($1,$2)
//            ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
//            RETURNING id`,
//           [divVal, department_id]
//         );
//         division_id = res.rows[0].id;
//       }

//       // ---------- CATEGORY ----------
//       let category_id = null;
//       const catVal = normalizeNullable(Category);
//       if (catVal) {
//         const res = await pool.query(
//           `INSERT INTO categories (name, location_id)
//            VALUES ($1,$2)
//            ON CONFLICT (name) DO UPDATE SET location_id = EXCLUDED.location_id
//            RETURNING id`,
//           [catVal, location_id]
//         );
//         category_id = res.rows[0].id;
//       }

//       // ---------- HARDWARE & SOFTWARE ----------
//       const lookupIds = {};
//       let softwareStart = false;

//       for (const [rawCol, val] of Object.entries(rest)) {
//         const cleanVal = normalizeNullable(val);
//         const col = rawCol.trim();

//         // O/S
//         if (col === "O/S" && cleanVal) {
//           softwareStart = true;
//           const osRes = await pool.query(
//             `INSERT INTO operating_systems (name)
//              VALUES ($1)
//              ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
//              RETURNING id`,
//             [cleanVal]
//           );
//           lookupIds.os_id = osRes.rows[0].id;
//           continue;
//         }

//         // Hardware lookups
//         if (LOOKUP_TABLES[col] && cleanVal) {
//           const res = await pool.query(
//             `INSERT INTO ${LOOKUP_TABLES[col]} (name)
//              VALUES ($1)
//              ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
//              RETURNING id`,
//             [cleanVal]
//           );
//           lookupIds[col] = res.rows[0].id;
//           continue;
//         }

//         // Software flags
//         if (softwareStart && (val === 1 || val === "1" || val === "YES")) {
//           const swRes = await pool.query(
//             `INSERT INTO software (name)
//              VALUES ($1)
//              ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
//              RETURNING id`,
//             [col]
//           );
//           lookupIds.software ??= [];
//           lookupIds.software.push(swRes.rows[0].id);
//         }
//       }

//       // ---------- INSERT USER (NO SKIP) ----------
//       const insertUser = await pool.query(
//         `INSERT INTO users (
//           hostname, name, location_id, ip_address1, ip_address2,
//           department_id, division_id, category_id,
//           asset_tag, floor, os_id
//         )
//         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
//         RETURNING id`,
//         [
//           HostnameVal,
//           NameVal,
//           location_id,
//           ip1Val,
//           ip2Val,
//           department_id,
//           division_id,
//           category_id,
//           AssettagVal,
//           FloorVal,
//           lookupIds.os_id || null
//         ]
//       );

//       const user_id = insertUser.rows[0].id;

//       // ---------- MAP SOFTWARE ----------
//       if (lookupIds.software?.length) {
//         for (const swId of lookupIds.software) {
//           await pool.query(
//             `INSERT INTO user_software (user_id, software_id)
//              VALUES ($1,$2)
//              ON CONFLICT DO NOTHING`,
//             [user_id, swId]
//           );
//         }
//       }
//     }

//     res.json({ message: "✅ Upload completed successfully" });

//   } catch (error) {
//     console.error("❌ Upload error:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// router.post("/upload", upload.single("file"), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ message: "No file uploaded" });
//     }

//     const workbook = xlsx.readFile(req.file.path);
//     const sheet = workbook.Sheets[workbook.SheetNames[0]];
//     const data = xlsx.utils.sheet_to_json(sheet, { defval: null });

//     const DEFAULT_WARRANTY_MONTHS = 12;
//     const DEFAULT_VENDOR_CONTACT = "0000000000";

//     // ---------- HELPERS ----------
//     const isNA = (v) =>
//       v === null ||
//       v === undefined ||
//       v.toString().trim().toUpperCase() === "N/A" ||
//       v.toString().trim() === "";

//     const textOrNA = (v) => (isNA(v) ? "NA" : v.toString().trim());
//     const nullable = (v) => (isNA(v) ? null : v.toString().trim());

//     // ---------- Lookup table mapping ----------
//     const LOOKUP_TABLES = {
//       Model: "models",
//       "CPU S#": "cpu_serials",
//       Processor: "processors",
//       "CPU Speed": "cpu_speeds",
//       RAM: "rams",
//       HDD: "hdds",
//       Monitor: "monitors",
//       "Monitor S#": "monitor_serials",
//       KBD: "keyboards",
//       Mouse: "mice",
//       "CD\\DVD": "cd_dvds"
//     };

//     for (const row of data) {
//       const {
//         Hostname,
//         Name,
//         Department,
//         Division,
//         Category,
//         Location,
//         Floor,
//         IPAddress1,
//         IPAddress2,
//         Assettag,
//         warrenty,
//         "Purchase From": purchaseFrom,
//         ...rest
//       } = row;

//       // ---------- MANDATORY ----------
//       const locationVal = nullable(Location);
//       const ip1Val = nullable(IPAddress1);
//       if (!locationVal || !ip1Val) continue;

//       const hostnameVal = textOrNA(Hostname);
//       const nameVal = textOrNA(Name);

//       // ---------- LOCATION ----------
//       const loc = await pool.query(
//         `INSERT INTO locations (name, address)
//          VALUES ($1,'')
//          ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
//          RETURNING id`,
//         [locationVal]
//       );
//       const location_id = loc.rows[0].id;

//       // ---------- DEPARTMENT ----------
//       let department_id = null;
//       if (!isNA(Department)) {
//         const dept = await pool.query(
//           `INSERT INTO departments (name, location_id)
//            VALUES ($1,$2)
//            ON CONFLICT (name) DO UPDATE SET location_id = EXCLUDED.location_id
//            RETURNING id`,
//           [Department.trim(), location_id]
//         );
//         department_id = dept.rows[0].id;
//       }

//       // ---------- DIVISION ----------
//       let division_id = null;
//       if (!isNA(Division) && department_id) {
//         const div = await pool.query(
//           `INSERT INTO divisions (name, department_id)
//            VALUES ($1,$2)
//            ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
//            RETURNING id`,
//           [Division.trim(), department_id]
//         );
//         division_id = div.rows[0].id;
//       }

//       // ---------- CATEGORY ----------
//       let category_id = null;
//       if (!isNA(Category)) {
//         const cat = await pool.query(
//           `INSERT INTO categories (name, location_id)
//            VALUES ($1,$2)
//            ON CONFLICT (name) DO UPDATE SET location_id = EXCLUDED.location_id
//            RETURNING id`,
//           [Category.trim(), location_id]
//         );
//         category_id = cat.rows[0].id;
//       }

//       // ---------- WARRANTY ----------
//       let warranty_id = null;
//       if (!isNA(warrenty)) {
//         const w = await pool.query(
//           `INSERT INTO warranties (warranty_name, duration_months)
//            VALUES ($1,$2)
//            ON CONFLICT (warranty_name)
//            DO UPDATE SET warranty_name = EXCLUDED.warranty_name
//            RETURNING id`,
//           [warrenty.trim(), DEFAULT_WARRANTY_MONTHS]
//         );
//         warranty_id = w.rows[0].id;
//       }

//       // ---------- PURCHASE FROM ----------
//       let purchase_from_id = null;
//       if (!isNA(purchaseFrom)) {
//         const p = await pool.query(
//           `INSERT INTO purchase_from (vendor_name, contact_details)
//            VALUES ($1,$2)
//            ON CONFLICT (vendor_name)
//            DO UPDATE SET vendor_name = EXCLUDED.vendor_name
//            RETURNING id`,
//           [purchaseFrom.trim(), DEFAULT_VENDOR_CONTACT]
//         );
//         purchase_from_id = p.rows[0].id;
//       }

//       // ---------- LOOKUPS & SOFTWARE ----------
//       const lookupIds = {};
//       let softwareStart = false;

//       for (const [col, val] of Object.entries(rest)) {
//         if (isNA(val)) continue;

//         // O/S
//         if (col === "O/S") {
//           softwareStart = true;
//           const os = await pool.query(
//             `INSERT INTO operating_systems (name)
//              VALUES ($1)
//              ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
//              RETURNING id`,
//             [val.trim()]
//           );
//           lookupIds.os_id = os.rows[0].id;
//           continue;
//         }

//         // SOFTWARE
//         if (softwareStart) {
//           if (val === 1 || val === "1" || val.toString().toLowerCase() === "yes") {
//             const sw = await pool.query(
//               `INSERT INTO software (name)
//                VALUES ($1)
//                ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
//                RETURNING id`,
//               [col.trim()]
//             );
//             lookupIds.software ??= [];
//             lookupIds.software.push(sw.rows[0].id);
//           }
//           continue;
//         }

//         // LOOKUP TABLES
//         if (LOOKUP_TABLES[col]) {
//           const table = LOOKUP_TABLES[col];
//           const res = await pool.query(
//             `INSERT INTO ${table} (name)
//              VALUES ($1)
//              ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
//              RETURNING id`,
//             [val.trim()]
//           );
//           lookupIds[col] = res.rows[0].id;
//         }
//       }

//       // ---------- INSERT USER (NO SKIP) ----------
//       const userRes = await pool.query(
//         `INSERT INTO users
//          (hostname, name, department_id, division_id, location_id, category_id,
//           warranty_id, purchase_from_id, floor,
//           ip_address1, ip_address2, asset_tag, os_id)
//          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
//          RETURNING id`,
//         [
//           hostnameVal,
//           nameVal,
//           department_id,
//           division_id,
//           location_id,
//           category_id,
//           warranty_id,
//           purchase_from_id,
//           nullable(Floor),
//           ip1Val,
//           nullable(IPAddress2),
//           nullable(Assettag),
//           lookupIds.os_id || null
//         ]
//       );

//       const user_id = userRes.rows[0].id;

//       // ---------- USER SOFTWARE ----------
//       if (lookupIds.software?.length) {
//         for (const swId of lookupIds.software) {
//           await pool.query(
//             `INSERT INTO user_software (user_id, software_id)
//              VALUES ($1,$2)
//              ON CONFLICT DO NOTHING`,
//             [user_id, swId]
//           );
//         }
//       }
//     }

//     res.json({ message: "✅ Upload completed successfully" });
//   } catch (error) {
//     console.error("❌ Upload error:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });


// router.post("/upload", upload.single("file"), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ message: "No file uploaded" });
//     }

//     const workbook = xlsx.readFile(req.file.path);
//     const sheet = workbook.Sheets[workbook.SheetNames[0]];
//     const data = xlsx.utils.sheet_to_json(sheet, { defval: null });

//     const DEFAULT_WARRANTY_MONTHS = 12;
//     const DEFAULT_VENDOR_CONTACT = "0000000000";

//     /* ---------- Lookup table mapping ---------- */
//     const LOOKUP_TABLES = {
//       Model: "models",
//       "CPU S#": "cpu_serials",
//       Processor: "processors",
//       "CPU Speed": "cpu_speeds",
//       RAM: "rams",
//       HDD: "hdds",
//       Monitor: "monitors",
//       "Monitor S#": "monitor_serials",
//       KBD: "keyboards",
//       Mouse: "mice",
//       "CD\\DVD": "cd_dvds",
//       "O/S": "operating_systems"
//     };

//     for (const row of data) {
//       const {
//         Hostname,
//         Name,
//         Department,
//         Division,
//         Category,
//         Location,
//         Floor,
//         IPAddress1,
//         IPAddress2,
//         Assettag,
//         warrenty,
//         "Purchase From": purchaseFrom,
//         ...rest
//       } = row;

//       /* ❌ HARD STOP — skip invalid rows */
//       if (
//         !Hostname?.trim() ||
//         !Name?.trim() ||
//         !Location?.trim() ||
//         !IPAddress1?.trim()
//       ) {
//         continue;
//       }

//       /* ---------- LOCATION ---------- */
//       const locRes = await pool.query(
//         `
//         INSERT INTO locations (name, address)
//         VALUES ($1,'')
//         ON CONFLICT (name)
//         DO UPDATE SET name = EXCLUDED.name
//         RETURNING id
//         `,
//         [Location.trim()]
//       );
//       const location_id = locRes.rows[0].id;

//       /* ---------- DEPARTMENT ---------- */
//       let department_id = null;
//       if (
//         Department?.trim() &&
//         !["na", "n/a"].includes(Department.trim().toLowerCase())
//       ) {
//         const deptRes = await pool.query(
//           `
//           INSERT INTO departments (name, location_id)
//           VALUES ($1,$2)
//           ON CONFLICT (name)
//           DO UPDATE SET location_id = EXCLUDED.location_id
//           RETURNING id
//           `,
//           [Department.trim(), location_id]
//         );
//         department_id = deptRes.rows[0].id;
//       }

//       /* ---------- DIVISION ---------- */
//       let division_id = null;
//       if (
//         Division?.trim() &&
//         !["na", "n/a"].includes(Division.trim().toLowerCase()) &&
//         department_id
//       ) {
//         const divRes = await pool.query(
//           `
//           INSERT INTO divisions (name, department_id)
//           VALUES ($1,$2)
//           ON CONFLICT (name)
//           DO UPDATE SET name = EXCLUDED.name
//           RETURNING id
//           `,
//           [Division.trim(), department_id]
//         );
//         division_id = divRes.rows[0].id;
//       }

//       /* ---------- CATEGORY ---------- */
//       let category_id = null;
//       if (
//         Category?.trim() &&
//         !["na", "n/a"].includes(Category.trim().toLowerCase())
//       ) {
//         const catRes = await pool.query(
//           `
//           INSERT INTO categories (name, location_id)
//           VALUES ($1,$2)
//           ON CONFLICT (name)
//           DO UPDATE SET location_id = EXCLUDED.location_id
//           RETURNING id
//           `,
//           [Category.trim(), location_id]
//         );
//         category_id = catRes.rows[0].id;
//       }

//       /* ---------- WARRANTY ---------- */
//       let warranty_id = null;
//       if (
//         warrenty?.trim() &&
//         !["na", "n/a"].includes(warrenty.trim().toLowerCase())
//       ) {
//         const wRes = await pool.query(
//           `
//           INSERT INTO warranties (warranty_name)
//           VALUES ($1)
//           ON CONFLICT (warranty_name)
//           DO UPDATE SET warranty_name = EXCLUDED.warranty_name
//           RETURNING id
//           `,
//           [warrenty.trim()]
//         );
//         warranty_id = wRes.rows[0].id;
//       }

//       /* ---------- PURCHASE FROM ---------- */
//       let purchase_from_id = null;
//       if (
//         purchaseFrom?.trim() &&
//         !["na", "n/a"].includes(purchaseFrom.trim().toLowerCase())
//       ) {
//         const pRes = await pool.query(
//           `
//           INSERT INTO purchase_from (vendor_name)
//           VALUES ($1)
//           ON CONFLICT (vendor_name)
//           DO UPDATE SET vendor_name = EXCLUDED.vendor_name
//           RETURNING id
//           `,
//           [purchaseFrom.trim()]
//         );
//         purchase_from_id = pRes.rows[0].id;
//       }

//       /* ---------- HARDWARE & SOFTWARE ---------- */
//       const lookupIds = {};
//       let softwareStart = false;

//       for (const [rawCol, val] of Object.entries(rest)) {
//         if (!val) continue;

//         const col = rawCol.trim();
//         const value = val.toString().trim();

//         if (!value || ["na", "n/a"].includes(value.toLowerCase())) continue;

//         /* O/S */
//         if (col === "O/S") {
//           softwareStart = true;
//           const osRes = await pool.query(
//             `
//             INSERT INTO operating_systems (name)
//             VALUES ($1)
//             ON CONFLICT (name)
//             DO UPDATE SET name = EXCLUDED.name
//             RETURNING id
//             `,
//             [value]
//           );
//           lookupIds["O/S"] = osRes.rows[0].id;
//           continue;
//         }

//         /* Hardware lookups */
//         if (LOOKUP_TABLES[col]) {
//           const table = LOOKUP_TABLES[col];
//           const res = await pool.query(
//             `
//             INSERT INTO ${table} (name)
//             VALUES ($1)
//             ON CONFLICT (name)
//             DO UPDATE SET name = EXCLUDED.name
//             RETURNING id
//             `,
//             [value]
//           );
//           lookupIds[col] = res.rows[0].id;
//           continue;
//         }

//         /* Software */
//         if (softwareStart && ["1", "yes"].includes(value.toLowerCase())) {
//           const swRes = await pool.query(
//             `
//             INSERT INTO software (name)
//             VALUES ($1)
//             ON CONFLICT (name)
//             DO UPDATE SET name = EXCLUDED.name
//             RETURNING id
//             `,
//             [col]
//           );
//           if (!lookupIds.software) lookupIds.software = [];
//           lookupIds.software.push(swRes.rows[0].id);
//         }
//       }

//       /* ---------- UPSERT USER ---------- */
//       // const existingUser = await pool.query(
//       //   `SELECT id FROM users WHERE hostname = $1 OR asset_tag = $2`,
//       //   [Hostname, Assettag]
//       // );

//       let user_id;

//       // if (existingUser.rows.length) {
//       //   user_id = existingUser.rows[0].id;

//       //   await pool.query(
//       //     `
//       //     UPDATE users SET
//       //       name=$1, department_id=$2, division_id=$3, location_id=$4, category_id=$5,
//       //       model_id=$6, cpu_serial_id=$7, processor_id=$8, cpu_speed_id=$9,
//       //       ram_id=$10, hdd_id=$11, monitor_id=$12, monitor_serial_id=$13,
//       //       keyboard_id=$14, mouse_id=$15, cd_dvd_id=$16, os_id=$17,
//       //       warranty_id=$18, purchase_from_id=$19,
//       //       floor=$20, ip_address1=$21, ip_address2=$22, asset_tag=$23
//       //     WHERE id=$24
//       //     `,
//       //     [
//       //       Name, department_id, division_id, location_id, category_id,
//       //       lookupIds["Model"] || null,
//       //       lookupIds["CPU S#"] || null,
//       //       lookupIds["Processor"] || null,
//       //       lookupIds["CPU Speed"] || null,
//       //       lookupIds["RAM"] || null,
//       //       lookupIds["HDD"] || null,
//       //       lookupIds["Monitor"] || null,
//       //       lookupIds["Monitor S#"] || null,
//       //       lookupIds["KBD"] || null,
//       //       lookupIds["Mouse"] || null,
//       //       lookupIds["CD\\DVD"] || null,
//       //       lookupIds["O/S"] || null,
//       //       warranty_id,
//       //       purchase_from_id,
//       //       Floor, IPAddress1, IPAddress2, Assettag,
//       //       user_id
//       //     ]
//       //   );
//       // } else {
//         const insertRes = await pool.query(
//           `
//           INSERT INTO users
//           (hostname, name, department_id, division_id, location_id, category_id,
//            model_id, cpu_serial_id, processor_id, cpu_speed_id, ram_id, hdd_id,
//            monitor_id, monitor_serial_id, keyboard_id, mouse_id, cd_dvd_id, os_id,
//            warranty_id, purchase_from_id,
//            floor, ip_address1, ip_address2, asset_tag)
//           VALUES
//           ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,
//            $13,$14,$15,$16,$17,$18,$19,$20,
//            $21,$22,$23,$24)
//           RETURNING id
//           `,
//           [
//             Hostname, Name, department_id, division_id, location_id, category_id,
//             lookupIds["Model"] || null,
//             lookupIds["CPU S#"] || null,
//             lookupIds["Processor"] || null,
//             lookupIds["CPU Speed"] || null,
//             lookupIds["RAM"] || null,
//             lookupIds["HDD"] || null,
//             lookupIds["Monitor"] || null,
//             lookupIds["Monitor S#"] || null,
//             lookupIds["KBD"] || null,
//             lookupIds["Mouse"] || null,
//             lookupIds["CD\\DVD"] || null,
//             lookupIds["O/S"] || null,
//             warranty_id,
//             purchase_from_id,
//             Floor, IPAddress1, IPAddress2, Assettag
//           ]
//         );

//         user_id = insertRes.rows[0].id;
//       // }

//       /* ---------- MAP SOFTWARE ---------- */
//       if (lookupIds.software?.length) {
//         for (const swId of lookupIds.software) {
//           await pool.query(
//             `
//             INSERT INTO user_software (user_id, software_id)
//             VALUES ($1,$2)
//             ON CONFLICT (user_id, software_id) DO NOTHING
//             `,
//             [user_id, swId]
//           );
//         }
//       }
//     }

//     res.json({ message: "✅ Upload completed successfully" });

//   } catch (error) {
//     console.error("❌ Upload error:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
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
      RAM: "rams",
      HDD: "hdds",
      Monitor: "monitors",
      "Monitor S#": "monitor_serials",
      KBD: "keyboards",
      Mouse: "mice",
      "CD\\DVD": "cd_dvds"
    };

    for (const row of data) {
      const {
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

      /* ❌ HARD STOP — required fields */
      if (
        !Hostname?.trim() ||
        !Name?.trim() ||
        !Location?.trim() ||
        !IPAddress1?.trim()
      ) {
        continue;
      }

      /* ❌ SKIP IF IP EXISTS */
      const ipCheck = await pool.query(
        `
        SELECT id FROM users
        WHERE ip_address1 = $1
           OR ip_address2 = $1
           OR ip_address1 = $2
           OR ip_address2 = $2
        `,
        [IPAddress1, IPAddress2]
      );

      if (ipCheck.rows.length > 0) {
        console.log(`⏭️ Skipping ${Hostname} — IP already exists`);
        continue;
      }

      /* ---------- LOCATION ---------- */
      const locRes = await pool.query(
        `
        INSERT INTO locations (name, address)
        VALUES ($1,'')
        ON CONFLICT (name)
        DO UPDATE SET name = EXCLUDED.name
        RETURNING id
        `,
        [Location.trim()]
      );
      const location_id = locRes.rows[0].id;

      /* ---------- DEPARTMENT ---------- */
      let department_id = null;
      if (Department?.trim() && !["na", "n/a"].includes(Department.toLowerCase())) {
        const deptRes = await pool.query(
          `
          INSERT INTO departments (name, location_id)
          VALUES ($1,$2)
          ON CONFLICT (name)
          DO UPDATE SET location_id = EXCLUDED.location_id
          RETURNING id
          `,
          [Department.trim(), location_id]
        );
        department_id = deptRes.rows[0].id;
      }

      /* ---------- DIVISION ---------- */
      let division_id = null;
      if (Division?.trim() && department_id) {
        const divRes = await pool.query(
          `
          INSERT INTO divisions (name, department_id)
          VALUES ($1,$2)
          ON CONFLICT (name)
          DO UPDATE SET name = EXCLUDED.name
          RETURNING id
          `,
          [Division.trim(), department_id]
        );
        division_id = divRes.rows[0].id;
      }

      /* ---------- CATEGORY ---------- */
      let category_id = null;
      if (Category?.trim()) {
        const catRes = await pool.query(
          `
          INSERT INTO categories (name, location_ids)
          VALUES ($1, ARRAY[$2::INT])
          ON CONFLICT (name)
          DO UPDATE SET location_ids = categories.location_ids || EXCLUDED.location_ids
          RETURNING id
          `,
          [Category.trim(), location_id]
        );
        category_id = catRes.rows[0].id;
      }

      /* ---------- WARRANTY ---------- */
      let warranty_id = null;
      if (warrenty?.trim()) {
        const wRes = await pool.query(
          `
          INSERT INTO warranties (warranty_name)
          VALUES ($1)
          ON CONFLICT (warranty_name)
          DO UPDATE SET warranty_name = EXCLUDED.warranty_name
          RETURNING id
          `,
          [warrenty.trim()]
        );
        warranty_id = wRes.rows[0].id;
      }

      /* ---------- PURCHASE FROM ---------- */
      let purchase_from_id = null;
      if (purchaseFrom?.trim()) {
        const pRes = await pool.query(
          `
          INSERT INTO purchase_from (vendor_name)
          VALUES ($1)
          ON CONFLICT (vendor_name)
          DO UPDATE SET vendor_name = EXCLUDED.vendor_name
          RETURNING id
          `,
          [purchaseFrom.trim()]
        );
        purchase_from_id = pRes.rows[0].id;
      }

      /* ---------- HARDWARE & SOFTWARE ---------- */
      const lookupIds = {};
      let softwareStart = false;

      for (const [rawCol, val] of Object.entries(rest)) {
        if (!val) continue;

        const col = rawCol.trim();
        const value = val.toString().trim();
        if (!value || ["na", "n/a"].includes(value.toLowerCase())) continue;

        /* O/S */
        if (col === "O/S") {
          softwareStart = true;
          const osRes = await pool.query(
            `
            INSERT INTO operating_systems (name)
            VALUES ($1)
            ON CONFLICT (name)
            DO UPDATE SET name = EXCLUDED.name
            RETURNING id
            `,
            [value]
          );
          lookupIds.os_id = osRes.rows[0].id;
          continue;
        }

        /* Hardware */
        if (LOOKUP_TABLES[col]) {
          const table = LOOKUP_TABLES[col];
          const res = await pool.query(
            `
            INSERT INTO ${table} (name)
            VALUES ($1)
            ON CONFLICT (name)
            DO UPDATE SET name = EXCLUDED.name
            RETURNING id
            `,
            [value]
          );
          lookupIds[col] = res.rows[0].id;
          continue;
        }

        /* Software */
        if (softwareStart && ["1", "yes"].includes(value.toLowerCase())) {
          const swRes = await pool.query(
            `
            INSERT INTO software (name, location_ids)
            VALUES ($1, ARRAY[$2::INT])
            ON CONFLICT (name)
            DO UPDATE SET location_ids = software.location_ids || EXCLUDED.location_ids
            RETURNING id
            `,
            [col, location_id]
          );

          lookupIds.software ??= [];
          lookupIds.software.push(swRes.rows[0].id);
        }
      }

      /* ---------- INSERT USER ---------- */
      const insertRes = await pool.query(
        `
        INSERT INTO users
        (hostname, name, department_id, division_id, location_id, category_id,
         model_id, cpu_serial_id, processor_id, cpu_speed_id, ram_id, hdd_id,
         monitor_id, monitor_serial_id, keyboard_id, mouse_id, cd_dvd_id, os_id,
         warranty_id, purchase_from_id,
         floor, ip_address1, ip_address2, asset_tag, serial_number, printer_type)
        VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,
         $13,$14,$15,$16,$17,$18,$19,$20,
         $21,$22,$23,$24, $25, $26)
        RETURNING id
        `,
        [
          Hostname, Name, department_id, division_id, location_id, category_id,
          lookupIds["Model"] || null,
          lookupIds["CPU S#"] || null,
          lookupIds["Processor"] || null,
          lookupIds["CPU Speed"] || null,
          lookupIds["RAM"] || null,
          lookupIds["HDD"] || null,
          lookupIds["Monitor"] || null,
          lookupIds["Monitor S#"] || null,
          lookupIds["KBD"] || null,
          lookupIds["Mouse"] || null,
          lookupIds["CD\\DVD"] || null,
          lookupIds.os_id || null,
          warranty_id,
          purchase_from_id,
          Floor, IPAddress1, IPAddress2, Assettag,
          Serial_number, Printer_type
        ]
      );

      const user_id = insertRes.rows[0].id;

      /* ---------- MAP SOFTWARE ---------- */
      if (lookupIds.software?.length) {
        for (const swId of lookupIds.software) {
          await pool.query(
            `
            INSERT INTO user_software (user_id, software_id)
            VALUES ($1,$2)
            ON CONFLICT (user_id, software_id) DO NOTHING
            `,
            [user_id, swId]
          );
        }
      }
    }

    res.json({ message: "✅ Upload completed successfully" });

  } catch (error) {
    console.error("❌ Upload error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/download", async (req, res) => {
  try {
    console.log("User info for download:", req.user);
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
        ms.name AS monitor_serial,
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
      LEFT JOIN monitor_serials ms ON u.monitor_serial_id = ms.id
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
        "Monitor Serial": user.monitor_serial,
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
