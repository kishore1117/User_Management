import express from "express";
import { createDepartment, getAllDepartments, getDepartmentById, updateDepartment, deleteDepartment } from "../controller/departmentController.js";

import { authenticateJWT } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(authenticateJWT);

router.post("/", authorizeRoles("admin"), createDepartment);
router.get("/", authorizeRoles("admin", "user"), getAllDepartments);
router.get("/:id", authorizeRoles("admin", "user"), getDepartmentById);
router.patch("/:id", authorizeRoles("admin"), updateDepartment);
router.delete("/:id", authorizeRoles("admin"), deleteDepartment);

export default router;
