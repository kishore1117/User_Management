import express from "express";
import { createSoftware, updateSoftware, deleteSoftware, getAllSoftware, getSoftwareById } from "../controller/softwareController.js"; '../controller/softwareController.js';

import { authenticateJWT } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateJWT);

// 🟢 Admin only: create, update, delete
router.post("/", authorizeRoles("admin"), createSoftware);
router.patch("/:id", authorizeRoles("admin"), updateSoftware);
router.delete("/:id", authorizeRoles("admin"), deleteSoftware);
router.get("/", authorizeRoles("admin","user"), getAllSoftware);
router.get("/:id", authorizeRoles("admin"), getSoftwareById);

export default router;
