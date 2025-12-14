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

//   try {
//     if (!req.file) return res.status(400).json({ message: "No file uploaded" });

//     const workbook = xlsx.readFile(req.file.path);
//     const sheet = workbook.Sheets[workbook.SheetNames[0]];
//     const data = xlsx.utils.sheet_to_json(sheet, { defval: null });

//         const DEFAULT_WARRANTY_MONTHS = 12;
//     const DEFAULT_VENDOR_CONTACT = '0000000000';

//     // ---------- Lookup table mapping ----------
//     const LOOKUP_TABLES  = {
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
//       "O/S Key": "operating_systems",
//       warrenty: "warranties",
//       "Purchase From": "purchase_from"
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
//         warrenty,
//         Assettag,
//         ...rest
//       } = row;

//       if (!Hostname || !Name) continue;

//       // ---------- Location ----------
//       let location_id = null;
//       if (Location?.trim()) {
//         const locRes = await pool.query(
//           `INSERT INTO locations (name, address)
//            VALUES ($1, '')
//            ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
//            RETURNING id`,
//           [Location.trim()]
//         );
//         location_id = locRes.rows[0].id;
//       }

//       // ---------- Department ----------
//       let department_id = null;
//       if (Department?.trim() && location_id) {
//         const deptRes = await pool.query(
//           `INSERT INTO departments (name, location_id)
//            VALUES ($1, $2)
//            ON CONFLICT (name) DO UPDATE SET location_id = EXCLUDED.location_id
//            RETURNING id`,
//           [Department.trim(), location_id]
//         );
//         department_id = deptRes.rows[0].id;
//       }

//       // ---------- Division ----------
//       let division_id = null;
//       if (Division?.trim() && department_id) {
//         const divRes = await pool.query(
//           `INSERT INTO divisions (name, department_id)
//            VALUES ($1, $2)
//            ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
//            RETURNING id`,
//           [Division.trim(), department_id]
//         );
//         division_id = divRes.rows[0].id;
//       }

//         let warranty_id = null;
//       if (warranty?.trim()) {
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

//       // ---------- Category ----------
//       let category_id = null;
//       if (Category?.trim() && location_id) {
//         const catRes = await pool.query(
//           `INSERT INTO categories (name, location_id)
//            VALUES ($1, $2)
//            ON CONFLICT (name) DO UPDATE SET location_id = EXCLUDED.location_id
//            RETURNING id`,
//           [Category.trim(), location_id]
//         );
//         category_id = catRes.rows[0].id;
//       }

//       // ---------- Lookup and Software ----------
//       const lookupIds = {};
//       let softwareStart = false;

//       for (const [col, val] of Object.entries(rest)) {
//         console.log(col, val, 'colvalcolval');
//         if (!val) continue;

//         if (softwareStart) {
//           // Software mapping after O/S Key
//           if (val === 1 || val === "1" || val?.toString().toLowerCase() === "yes") {
//             const swRes = await pool.query(
//               `INSERT INTO software (name)
//                VALUES ($1)
//                ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
//                RETURNING id`,
//               [col.trim()]
//             );
//             if (!lookupIds.software) lookupIds.software = [];
//             lookupIds.software.push(swRes.rows[0].id);
//           }
//         } else if (col === "O/S") {
//           softwareStart = true;

//           const osRes = await pool.query(
//             `INSERT INTO operating_systems (name)
//              VALUES ($1)
//              ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
//              RETURNING id`,
//             [val.toString().trim()]
//           );
//           lookupIds[col] = osRes.rows[0].id;

//         } else if (LOOKUP_TABLES[col]) {
//           // Lookup tables
//           const table = LOOKUP_TABLES[col];
//           console.log(table, 'tabletabletable');
//           const res = await pool.query(
//             `INSERT INTO ${table} (name)
//              VALUES ($1)
//              ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
//              RETURNING id`,
//             [val.toString().trim()]
//           );
//           lookupIds[col] = res.rows[0].id;

//         } else if (col === "IP Address2") {
//           lookupIds["ip_address2"] = val;
//         }
//       }

//       // ---------- Check if user exists ----------
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
//             lookupIds["O/S Key"] || null,
//             lookupIds["warranty_id"] || null,
//             lookupIds["purchase_from_id"] || null,
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
//             lookupIds["O/S Key"] || null,
//             lookupIds["warranty_id"] || null,
//             lookupIds["purchase_from_id"] || null,
//             Floor, IPAddress1, IPAddress2, Assettag
//           ]
//         );
//         user_id = insertRes.rows[0].id;
//       }

//       // ---------- Map software ----------
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

//     res.json({ message: "✅ Data uploaded successfully" });
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
//     const DEFAULT_VENDOR_CONTACT = '0000000000';

//     // ---------- Lookup table mapping (EXCEPT warranty & purchase_from) ----------
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

//       if (!Hostname || !Name) continue;

//       // ---------- Location ----------
//       let location_id = null;
//       if (Location?.trim()) {
//         const loc = await pool.query(
//           `INSERT INTO locations (name, address)
//            VALUES ($1, '')
//            ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
//            RETURNING id`,
//           [Location.trim()]
//         );
//         location_id = loc.rows[0].id;
//       }

//       // ---------- Department ----------
//       let department_id = null;
//       if (Department?.trim() && location_id) {
//         const dept = await pool.query(
//           `INSERT INTO departments (name, location_id)
//            VALUES ($1,$2)
//            ON CONFLICT (name) DO UPDATE SET location_id = EXCLUDED.location_id
//            RETURNING id`,
//           [Department.trim(), location_id]
//         );
//         department_id = dept.rows[0].id;
//       }

//       // ---------- Division ----------
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

//       // ---------- Category ----------
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

//       // ---------- WARRANTY (CUSTOM HANDLING) ----------
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

//       // ---------- PURCHASE FROM (CUSTOM HANDLING) ----------
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

//    // ---------- Other Lookups & Software ----------
// const lookupIds = {};
// let softwareStart = false;

// for (const [col, val] of Object.entries(rest)) {
//   if (!val) continue;

//   // ---------- O/S column ----------
//   if (col === "O/S") {
//     softwareStart = true;

//     const os = await pool.query(
//       `INSERT INTO operating_systems (name)
//        VALUES ($1)
//        ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
//        RETURNING id`,
//       [val.toString().trim()]
//     );

//     lookupIds.os_id = os.rows[0].id;
//     continue;
//   }

//   // ---------- SOFTWARE COLUMNS (AFTER O/S) ----------
//   if (softwareStart) {
//     if (
//       val === 1 ||
//       val === "1" ||
//       val?.toString().toLowerCase() === "yes"
//     ) {
//       const sw = await pool.query(
//         `INSERT INTO software (name)
//          VALUES ($1)
//          ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
//          RETURNING id`,
//         [col.trim()]
//       );

//       if (!lookupIds.software) lookupIds.software = [];
//       lookupIds.software.push(sw.rows[0].id);
//     }
//     continue;
//   }

//   // ---------- LOOKUP TABLES (BEFORE O/S) ----------
//   if (LOOKUP_TABLES[col]) {
//     const table = LOOKUP_TABLES[col];

//     const res = await pool.query(
//       `INSERT INTO ${table} (name)
//        VALUES ($1)
//        ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
//        RETURNING id`,
//       [val.toString().trim()]
//     );

//     lookupIds[col] = res.rows[0].id;
//   }
// }


//       // ---------- UPSERT USER ----------
//       const existingUser = await pool.query(
//         `SELECT id FROM users WHERE hostname = $1 OR asset_tag = $2`,
//         [Hostname, Assettag]
//       );

//       if (existingUser.rows.length) {
//         await pool.query(
//           `UPDATE users SET
//             name=$1, department_id=$2, division_id=$3, location_id=$4, category_id=$5,
//             warranty_id=$6, purchase_from_id=$7,
//             floor=$8, ip_address1=$9, ip_address2=$10, asset_tag=$11
//            WHERE id=$12`,
//           [
//             Name, department_id, division_id, location_id, category_id,
//             warranty_id, purchase_from_id,
//             Floor, IPAddress1, IPAddress2, Assettag,
//             existingUser.rows[0].id
//           ]
//         );
//       } else {
//         await pool.query(
//           `INSERT INTO users
//            (hostname, name, department_id, division_id, location_id, category_id,
//             warranty_id, purchase_from_id,
//             floor, ip_address1, ip_address2, asset_tag)
//            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
//           [
//             Hostname, Name, department_id, division_id, location_id, category_id,
//             warranty_id, purchase_from_id,
//             Floor, IPAddress1, IPAddress2, Assettag
//           ]
//         );
//       }
//     }

//     res.json({ message: "✅ Upload completed successfully" });

//   } catch (error) {
//     console.error("❌ Upload error:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// })

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet, { defval: null });

    const DEFAULT_WARRANTY_MONTHS = 12;
    const DEFAULT_VENDOR_CONTACT = "0000000000";

    // ---------- Lookup table mapping (EXCEPT warranty & purchase_from) ----------
    const LOOKUP_TABLES = {
      Model: "models",
      "CPU S#": "cpu_serials",
      Processor: "processors",
      "CPU Speed": "cpu_speeds",
      "RAM": "rams",
      HDD: "hdds",
      Monitor: "monitors",
      "Monitor S#": "monitor_serials",
      KBD: "keyboards",
      Mouse: "mice",
      "CD\\DVD": "cd_dvds",
      "OS":'operating_systems'
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
        warrenty,
        "Purchase From": purchaseFrom,
        ...rest
      } = row;

      if (!Hostname || !Name) continue;

      // ---------- LOCATION ----------
      let location_id = null;
      if (Location?.trim()) {
        const loc = await pool.query(
          `INSERT INTO locations (name, address)
           VALUES ($1,'')
           ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
           RETURNING id`,
          [Location.trim()]
        );
        location_id = loc.rows[0].id;
      }

      // ---------- DEPARTMENT ----------
      let department_id = null;
      if (Department?.trim() && location_id) {
        const dept = await pool.query(
          `INSERT INTO departments (name, location_id)
           VALUES ($1,$2)
           ON CONFLICT (name) DO UPDATE SET location_id = EXCLUDED.location_id
           RETURNING id`,
          [Department.trim(), location_id]
        );
        department_id = dept.rows[0].id;
      }

      // ---------- DIVISION ----------
      let division_id = null;
      if (Division?.trim() && department_id) {
        const div = await pool.query(
          `INSERT INTO divisions (name, department_id)
           VALUES ($1,$2)
           ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
           RETURNING id`,
          [Division.trim(), department_id]
        );
        division_id = div.rows[0].id;
      }

      // ---------- CATEGORY ----------
      let category_id = null;
      if (Category?.trim() && location_id) {
        const cat = await pool.query(
          `INSERT INTO categories (name, location_id)
           VALUES ($1,$2)
           ON CONFLICT (name) DO UPDATE SET location_id = EXCLUDED.location_id
           RETURNING id`,
          [Category.trim(), location_id]
        );
        category_id = cat.rows[0].id;
      }

      // ---------- WARRANTY (CUSTOM) ----------
      let warranty_id = null;
      if (warrenty?.trim()) {
        const existing = await pool.query(
          `SELECT id FROM warranties WHERE warranty_name = $1`,
          [warrenty.trim()]
        );

        if (existing.rows.length) {
          warranty_id = existing.rows[0].id;
        } else {
          const inserted = await pool.query(
            `INSERT INTO warranties (warranty_name, duration_months)
             VALUES ($1,$2)
             RETURNING id`,
            [warrenty.trim(), DEFAULT_WARRANTY_MONTHS]
          );
          warranty_id = inserted.rows[0].id;
        }
      }

      // ---------- PURCHASE FROM (CUSTOM) ----------
      let purchase_from_id = null;
      if (purchaseFrom?.trim()) {
        const existingVendor = await pool.query(
          `SELECT id FROM purchase_from WHERE vendor_name = $1`,
          [purchaseFrom.trim()]
        );

        if (existingVendor.rows.length) {
          purchase_from_id = existingVendor.rows[0].id;
        } else {
          const insertedVendor = await pool.query(
            `INSERT INTO purchase_from (vendor_name, contact_details)
             VALUES ($1,$2)
             RETURNING id`,
            [purchaseFrom.trim(), DEFAULT_VENDOR_CONTACT]
          );
          purchase_from_id = insertedVendor.rows[0].id;
        }
      }

      const lookupIds = {};
      let softwareStart = false;

      // for (const [col, val] of Object.entries(rest)) {
      //   console.log(col,val)
      //   if (!val) continue;

      //   const col = rawCol.trim();

      //   if (softwareStart) {
      //     // Software mapping after O/S Key
      //     if (val === 1 || val === "1" || val?.toString().toLowerCase() === "yes") {
      //       const swRes = await pool.query(
      //         `INSERT INTO software (name)
      //          VALUES ($1)
      //          ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
      //          RETURNING id`,
      //         [col.trim()]
      //       );
      //       if (!lookupIds.software) lookupIds.software = [];
      //       lookupIds.software.push(swRes.rows[0].id);
      //     }
      //   } else if (col === "O/S") {
      //     softwareStart = true;

      //     const osRes = await pool.query(
      //       `INSERT INTO operating_systems (name)
      //        VALUES ($1)
      //        ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
      //        RETURNING id`,
      //       [val.toString().trim()]
      //     );
      //     lookupIds[col] = osRes.rows[0].id;

      //   } else if (LOOKUP_TABLES[col]) {
      //     console.log(LOOKUP_TABLES[col],'col')
      //     // Lookup tables  
      //     const table = LOOKUP_TABLES[col];
      //     const res = await pool.query(
      //       `INSERT INTO ${table} (name)
      //        VALUES ($1)
      //        ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
      //        RETURNING id`,
      //       [val.toString().trim()]
      //     );
      //     lookupIds[col] = res.rows[0].id;

      //   } else if (col === "IP Address2") {
      //     lookupIds["ip_address2"] = val;
      //   }
      // }

      for (const [rawCol, val] of Object.entries(rest)) {
  if (!val) continue;

  const col = rawCol.trim();

  // ---------- O/S ----------
  if (col === "O/S") {
    softwareStart = true;
    const osRes = await pool.query(
      `INSERT INTO operating_systems (name)
       VALUES ($1)
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [val.toString().trim()]
    );
    lookupIds["O/S"] = osRes.rows[0].id;
    continue;
  }

  // ---------- HARDWARE LOOKUPS (ALWAYS ALLOWED) ----------
  if (LOOKUP_TABLES[col] ) {
    const table = LOOKUP_TABLES[col];
    const res = await pool.query(
      `INSERT INTO ${table} (name)
       VALUES ($1)
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [val.toString().trim()]
    );
    lookupIds[col] = res.rows[0].id;
    continue;
  }

  // ---------- SOFTWARE (ONLY AFTER O/S) ----------
  if (softwareStart) {
    if (val === 1 || val === "1" || val?.toString().toLowerCase() === "yes") {
      const swRes = await pool.query(
        `INSERT INTO software (name)
         VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [col]
      );
      if (!lookupIds.software) lookupIds.software = [];
      lookupIds.software.push(swRes.rows[0].id);
    }
  }
}

      console.log(lookupIds)

        // ---------- Check if user exists ----------
      let userRes = await pool.query(
        `SELECT id FROM users WHERE hostname = $1 OR asset_tag = $2`,
        [Hostname, Assettag]
      );

      let user_id;
      if (userRes.rows.length) {
        console.log(IPAddress1, lookupIds["ip_address2"] || null, 'jksdajkdasjk');
        // Update existing user
        user_id = userRes.rows[0].id;
        await pool.query(
          `UPDATE users SET
            name=$1, department_id=$2, division_id=$3, location_id=$4, category_id=$5,
            model_id=$6, cpu_serial_id=$7, processor_id=$8, cpu_speed_id=$9, ram_id=$10, hdd_id=$11,
            monitor_id=$12, monitor_serial_id=$13, keyboard_id=$14, mouse_id=$15, cd_dvd_id=$16, os_id=$17,
            warranty_id=$18, purchase_from_id=$19,
            floor=$20, ip_address1=$21, ip_address2=$22, asset_tag=$23
           WHERE id=$24`,
          [
            Name, department_id, division_id, location_id, category_id,
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
            lookupIds["O/S"] || null,
            warranty_id,
            purchase_from_id,
            Floor, IPAddress1, IPAddress2, Assettag,
            user_id
          ]
        );
      } else {
        // Insert new user
        const insertRes = await pool.query(
          `INSERT INTO users
            (hostname, name, department_id, division_id, location_id, category_id,
             model_id, cpu_serial_id, processor_id, cpu_speed_id, ram_id, hdd_id,
             monitor_id, monitor_serial_id, keyboard_id, mouse_id, cd_dvd_id, os_id,
             warranty_id, purchase_from_id,
             floor, ip_address1, ip_address2, asset_tag)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,
                   $13,$14,$15,$16,$17,$18,$19,$20,
                   $21,$22,$23,$24)
           RETURNING id`,
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
            lookupIds["O/S"] || null,
            warranty_id,
            purchase_from_id,
            Floor, IPAddress1, IPAddress2, Assettag
          ]
        );
        user_id = insertRes.rows[0].id;
      }

      // ---------- MAP SOFTWARE ----------
      if (lookupIds.software?.length) {
        for (const swId of lookupIds.software) {
          await pool.query(
            `INSERT INTO user_software (user_id, software_id)
             VALUES ($1,$2)
             ON CONFLICT (user_id, software_id) DO NOTHING`,
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

    // 1. Get software list
    const softwareRes = await pool.query(
      `SELECT id, name FROM software ORDER BY name`
    );
    const softwareList = softwareRes.rows;

    // 2. Fetch only users where location_id is in locationAccess[]
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

    // 3. Get user → software mapping
    const userSoftwareRes = await pool.query(`
      SELECT user_id, software_id 
      FROM user_software
    `);

    const userSoftwareMap = {};
    userSoftwareRes.rows.forEach((row) => {
      if (!userSoftwareMap[row.user_id])
        userSoftwareMap[row.user_id] = new Set();
      userSoftwareMap[row.user_id].add(row.software_id);
    });

    // 4. Build Excel rows
    const excelRows = users.map((user) => {
      const baseRow = {
        Hostname: user.hostname,
        Name: user.name,
        Location: user.location,
        Department: user.department,
        Division: user.division,
        Category: user.category,
        "IP Address1": user.ip_address1,
        "IP Address2": user.ip_address2,
        Floor: user.floor,
        Model: user.model,
        "CPU Serial": user.cpu_serial,
        Processor: user.processor,
        "CPU Speed": user.cpu_speed,
        RAM: user.ram,
        HDD: user.hdd,
        Monitor: user.monitor,
        "Monitor Serial": user.monitor_serial,
        Keyboard: user.keyboard,
        Mouse: user.mouse,
        "CD/DVD": user.cd_dvd,
        OS: user.operating_system,
        USB: user.usb ? "Yes" : "No",
      };

      // Dynamic software columns: Yes/No
      for (const sw of softwareList) {
        baseRow[sw.name] = userSoftwareMap[user.id]?.has(sw.id)
          ? "Yes"
          : "No";
      }

      return baseRow;
    });

    // 5. Create Excel workbook
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(excelRows);

    xlsx.utils.book_append_sheet(workbook, worksheet, "Users");

    const filePath = "./downloads/users_export.xlsx";
    xlsx.writeFile(workbook, filePath);

    // 6. Send the file to the browser
    res.download(filePath, "users_export.xlsx");
  } catch (err) {
    console.error("Download error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});


export default router;
