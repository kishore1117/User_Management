import express from "express";
import { createLocation, updateLocation, deleteLocation, getAllLocations, getLocationById } from '../controller/locationContoller.js';

import { authenticateJWT } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// 🔐 Require a valid token for all
router.use(authenticateJWT);

// 🟢 Only admins can modify locations
router.post("/", authorizeRoles("admin"), createLocation);
router.patch("/:id", authorizeRoles("admin"), updateLocation);
router.delete("/:id", authorizeRoles("admin"), deleteLocation);
router.get("/", authorizeRoles("admin"), getAllLocations);
router.get("/:id", authorizeRoles("admin"), getLocationById);

export default router;
