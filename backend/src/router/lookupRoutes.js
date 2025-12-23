import express from "express";
import { addUser, getAllUsers,updateUser,deleteUser,getUserById,getLookupData, getDashboardData} from "../controller/userController.js";
import { authenticateJWT } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";


const router = express.Router();

router.use(authenticateJWT);
router.get("/", authorizeRoles("admin","user"), getLookupData);
router.get("/dashboard", authorizeRoles("admin","user"), getDashboardData);

export default router;  