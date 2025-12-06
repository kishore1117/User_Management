import express from "express";
import { addUser, getAllUsers,updateUser,deleteUser,getTableDetails,getUserById,getLookupData,createTableRecord,getTableRows,updateTableRecord,deleteTableRecord} from "../controller/userController.js";
import { authenticateJWT } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";


const router = express.Router();

router.use(authenticateJWT);

router.post("/create",authorizeRoles("admin","user"), addUser);
router.get("/tableData",authorizeRoles("admin"), getTableRows);
router.get("/tableSchema", authorizeRoles("admin"), getTableDetails);
router.get("/lookpData", authorizeRoles("admin","user"), getLookupData);
router.get("/", authorizeRoles("admin","user"), getAllUsers);
router.get("/:id", authorizeRoles("admin","user"),getUserById)
router.patch("/:id",authorizeRoles("admin","user"), updateUser);
router.delete("/:id",authorizeRoles("admin","user"), deleteUser);
router.post("/table",authorizeRoles("admin"), createTableRecord);
router.put("/table/:id",authorizeRoles("admin"), updateTableRecord);
router.delete("/table/:id",authorizeRoles("admin"), deleteTableRecord);




export default router;  