import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import userRoutes from "./router/userRouter.js";
import { errorHandler } from "./middleware/errorHandler.js";
import userAccessRoutes from "./router/userAccessRoutes.js";
import locationRouteres from "./router/locationRoutes.js";
import departmentRoutes from "./router/departmentRoutes.js";
import divisionRoutes from "./router/divisionRoutes.js";
import softwareRoutes from "./router/softwareRoutes.js";
import uploadRouter from "./router/uploadDataRoutes.js"

const app = express();

app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/user-access", userAccessRoutes);
app.use("/api/locations", locationRouteres);
app.use("/api/departments", departmentRoutes);
app.use("/api/divisions", divisionRoutes);
app.use("/api/software", softwareRoutes);
app.use("/api", uploadRouter);
// app.use("/api/auth", authRoutes);

// Error handling middleware
app.use(errorHandler);

export default app;
