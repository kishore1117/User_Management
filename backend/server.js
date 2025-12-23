import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fs from "fs";
import multer from "multer";
import xlsx from "xlsx";
import helmet from "helmet";
import compression from "compression";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { initDB, pool } from "./src/config/db.js";

// ------------------------
// 📁 Local Imports
// ------------------------
import app from "./src/app.js";
import db from "./src/config/db.js";

// ------------------------
// 🔧 ES Module __dirname fix
// ------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//Initialize Database table creation
initDB();

// ------------------------
// 🌱 Environment Variables
// ------------------------
dotenv.config({
  path: path.resolve(__dirname, "../.env"),
  override: true
});

// ------------------------
// 🗄️ Database Init
// ------------------------
const { pool, initDB } = db;
// initDB();

// ------------------------
// 🛡️ Security & Middleware
// ------------------------
app.use(
  helmet({
    contentSecurityPolicy: false // Required for Angular
  })
);

app.use(cors());
app.use(bodyParser.json());
app.use(compression());

// ------------------------
// 🅰️ Angular Build Path
// ------------------------
const angularDistPath = path.join(
  __dirname,
  "dist",
  "user-management",
  "browser"
);

const indexPath = path.join(angularDistPath, "index.html");

// ------------------------
// 📦 Serve Angular Static Files
// ------------------------
app.use(
  express.static(angularDistPath, {
    maxAge: "1y",
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache");
      }
    }
  })
);

// ------------------------
// 🔁 Angular Route Fallback
// ------------------------
app.get("*", (req, res) => {
  res.sendFile(indexPath);
});

// ------------------------
// 🚀 Start Server
// ------------------------
const PORT =  3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📂 Serving Angular from: ${angularDistPath}`);
});

// ------------------------
// ❌ Global Error Handling
// ------------------------
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});
