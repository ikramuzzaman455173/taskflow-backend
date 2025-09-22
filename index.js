import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { errorHandler, notFound } from "./src/middleware/errorHandler.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import authRoutes from "./src/routes/authRoutes.js";
import dashboardRoutes from "./src/routes/dashboardRoutes.js";
import healthRoutes from "./src/routes/healthRoutes.js";
import profileRoutes from "./src/routes/profileRoutes.js";
import taskRoutes from "./src/routes/taskRoutes.js";
import { connectDB } from "./src/config/db.js";
import { Activity } from "./src/models/Activity.js";
import { User } from "./src/models/User.js";
import { Task } from "./src/models/Task.js";

const PORT = process.env.PORT || 5000;

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
app.use("/api/healths", healthRoutes);

// Errors
app.use(notFound);
app.use(errorHandler);

async function ensureDefaultAdmin() {
  const adminExists = await User.findOne({ role: "admin" });
  if (!adminExists) {
    const admin = await User.create({
      name: "Admin User",
      email: "admin@taskflow.com",
      password: "admin123",
      role: "admin",
      status: "active"
    });
    await Activity.create({
      type: "admin_seed",
      message: "Default admin created",
      user: admin._id
    });
    console.log("✅ Default admin created: admin@taskflow.com / admin123");
  }
}

async function seedDemoDataIfNeeded() {
  if (process.env.SEED_DEMO !== "true") return;
  const tasksCount = await Task.countDocuments();
  if (tasksCount > 0) return;

  // Create a demo user if missing
  let demo = await User.findOne({ email: "jakaria455173@gmail.com" });
  if (!demo) {
    demo = await User.create({
      name: "Md. Ikramuzzaman",
      email: "jakaria455173@gmail.com",
      password: "demo123",
      role: "user",
      status: "active"
    });
  }

  // Helper to construct dates
  const d = (s) => new Date(s);

  await Task.insertMany([
    {
      title: "Design Homepage",
      description: "Create wireframes and mockups for the new homepage design",
      priority: "high",
      status: "pending",
      createdBy: demo._id,
      createdAt: d("2024-08-15"),
      updatedAt: d("2024-08-15"),
      dueDate: d("2024-08-20")
    },
    {
      title: "Code Review",
      description: "Review pull requests from team members",
      priority: "low",
      status: "pending",
      createdBy: demo._id,
      createdAt: d("2024-08-14"),
      updatedAt: d("2024-08-14"),
      dueDate: d("2024-08-16")
    },
    {
      title: "Client Meeting",
      description: "Discuss project requirements with stakeholders",
      priority: "high",
      status: "pending",
      createdBy: demo._id,
      createdAt: d("2024-08-12"),
      updatedAt: d("2024-08-12"),
      dueDate: d("2024-08-18")
    },
    {
      title: "Setup Database",
      description: "Configure PostgreSQL database with proper schemas",
      priority: "medium",
      status: "completed",
      createdBy: demo._id,
      createdAt: d("2024-08-10"),
      updatedAt: d("2024-08-10")
    }
  ]);

  // Additional users for admin list
  const extraUsers = [
    {
      name: "John Smith",
      email: "john.smith@email.com",
      password: "password123",
      role: "user",
      status: "active",
      createdAt: d("2024-01-18")
    },
    {
      name: "Sarah Wilson",
      email: "sarah.wilson@email.com",
      password: "password123",
      role: "user",
      status: "inactive",
      createdAt: d("2024-01-10")
    },
    {
      name: "Mike Johnson",
      email: "mike.johnson@email.com",
      password: "password123",
      role: "user",
      status: "active",
      createdAt: d("2024-01-12")
    }
  ];
  for (const data of extraUsers) {
    const exists = await User.findOne({ email: data.email });
    if (!exists) {
      const u = new User(data);
      // override timestamps
      u.set({ createdAt: data.createdAt, updatedAt: data.createdAt });
      await u.save();
    }
  }

  await Activity.create({
    type: "system_backup",
    message: "System backup completed"
  });
  await Activity.create({
    type: "task_completed",
    message: "Task completed by John Doe"
  });
  console.log("🌱 Demo data seeded");
}

async function start() {
  try {
    await connectDB();
    await ensureDefaultAdmin();
    await seedDemoDataIfNeeded();
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

start();


export default app;
