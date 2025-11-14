import express from "express";
import { addUser, getAllUsers,updateUser,deleteUser } from "../controller/userController.js";
import db from '../config/db.js';
import { authenticateJWT } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { getUserById } from "../services/userService.js";
const { pool, initDB } = db; 

const router = express.Router();

router.use(authenticateJWT);

router.get("/:id", authorizeRoles("admin","user"), getUserById)
router.post("/create",authorizeRoles("admin","user"), addUser);
router.get("/", authorizeRoles("admin","user"), getAllUsers);
router.patch("/:id",authorizeRoles("admin","user"), updateUser);
router.delete("/:id",authorizeRoles("admin","user"), deleteUser);



export default router;  