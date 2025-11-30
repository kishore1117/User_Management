import express from "express";
import { addUser, getAllUsers,updateUser,deleteUser,getUserById,getLookupData } from "../controller/userController.js";
import { authenticateJWT } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";


const router = express.Router();

router.use(authenticateJWT);

router.post("/create",authorizeRoles("admin","user"), addUser);
router.get("/lookpData", authorizeRoles("admin","user"), getLookupData);
router.get("/", authorizeRoles("admin","user"), getAllUsers);
router.get("/:id", authorizeRoles("admin","user"),getUserById)
router.patch("/:id",authorizeRoles("admin","user"), updateUser);
router.delete("/:id",authorizeRoles("admin","user"), deleteUser);




export default router;  