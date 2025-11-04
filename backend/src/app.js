import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import userRoutes from "./router/userrouter.js";
import { errorHandler } from "./middleware/errorHandler.js";
import userAccessRoutes from "./router/userAccessRoutes.js";

const app = express();

app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/user-access", userAccessRoutes);
// app.use("/api/auth", authRoutes);

// Error handling middleware
app.use(errorHandler);

export default app;
