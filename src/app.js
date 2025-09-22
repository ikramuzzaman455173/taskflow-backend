import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";

dotenv.config();

const app = express();

// Security & misc
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());
const origin = process.env.CLIENT_ORIGIN;
const methods = ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"];
app.use(cors({ origin, methods, credentials: true }));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100
});
app.use(limiter);

// Routes
app.get("/", (req, res) =>
  res.json({ success: true, message: "TaskFlow API" })
);
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/health", healthRoutes);

// Errors
app.use(notFound);
app.use(errorHandler);

export default app;
