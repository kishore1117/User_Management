import express from "express";
import { createUserAccess , updateUserAccess, deleteUserAccess, getAllUserAccess, getUserAccessById, loginUserAccess } from '../controller/userAccessController.js';
import { authenticateJWT } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
const router = express.Router();

router.post("/login", loginUserAccess);
router.use(authenticateJWT);

router.post("/", authorizeRoles("admin"), createUserAccess);
router.patch("/:id", authorizeRoles("admin"), updateUserAccess);
router.get("/", authorizeRoles("admin"), getAllUserAccess);
router.get("/:id", authorizeRoles("admin"), getUserAccessById);
router.delete("/:id", authorizeRoles("admin"), deleteUserAccess);


export default router;