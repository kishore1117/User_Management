import express from "express";
import { createLocation, updateLocation, deleteLocation, getAllLocations, getLocationById, getAllowedLocations } from '../controller/locationContoller.js';

import { authenticateJWT } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// 🔐 Require a valid token for all
router.use(authenticateJWT);

// 🟢 Only admins can modify locations
router.post("/", authorizeRoles("admin"), createLocation);
router.get("/allowed", authorizeRoles("admin","user"), getAllowedLocations);
router.patch("/:id", authorizeRoles("admin"), updateLocation);
router.delete("/:id", authorizeRoles("admin"), deleteLocation);
router.get("/", authorizeRoles("admin","user"), getAllLocations);
router.get("/:id", authorizeRoles("admin"), getLocationById);

export default router;
