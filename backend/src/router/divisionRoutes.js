import express from "express";
import { createDivision, getAllDivisions, getDivisionById, updateDivision, deleteDivision } from "../controller/divisionController.js";

import { authenticateJWT } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(authenticateJWT);

router.post("/", authorizeRoles("admin"), createDivision);
router.get("/", authorizeRoles("admin", "user"), getAllDivisions);
router.get("/:id", authorizeRoles("admin", "user"), getDivisionById);
router.patch("/:id", authorizeRoles("admin"), updateDivision);
router.delete("/:id", authorizeRoles("admin"), deleteDivision);

export default router;
