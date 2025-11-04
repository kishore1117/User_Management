import express from "express";
import { addUser } from "../controller/userController.js";

const router = express.Router();

// router.get("/user", getAllUsers);
router.post("/create", addUser);

export default router;