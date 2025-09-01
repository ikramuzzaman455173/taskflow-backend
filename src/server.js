import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './config/db.js';
import { User } from './models/User.js';
import { Activity } from './models/Activity.js';
import { Task } from './models/Task.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

async function ensureDefaultAdmin() {
  const adminExists = await User.findOne({ role: 'admin' });
  if (!adminExists) {
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@taskflow.com',
      password: 'admin123',
      role: 'admin',
      status: 'active',
    });
    await Activity.create({ type: 'admin_seed', message: 'Default admin created', user: admin._id });
    console.log('✅ Default admin created: admin@taskflow.com / admin123');
  }
}

async function seedDemoDataIfNeeded() {
  if (process.env.SEED_DEMO !== 'true') return;
  const tasksCount = await Task.countDocuments();
  if (tasksCount > 0) return;

  // Create a demo user if missing
  let demo = await User.findOne({ email: 'jakaria455173@gmail.com' });
  if (!demo) {
    demo = await User.create({
      name: 'Md. Ikramuzzaman',
      email: 'jakaria455173@gmail.com',
      password: 'demo123',
      role: 'user',
      status: 'active',
    });
  }

  // Helper to construct dates
  const d = (s) => new Date(s);

  await Task.insertMany([
    { title: 'Design Homepage', description: 'Create wireframes and mockups for the new homepage design', priority: 'high', status: 'pending', createdBy: demo._id, createdAt: d('2024-08-15'), updatedAt: d('2024-08-15'), dueDate: d('2024-08-20') },
    { title: 'Code Review', description: 'Review pull requests from team members', priority: 'low', status: 'pending', createdBy: demo._id, createdAt: d('2024-08-14'), updatedAt: d('2024-08-14'), dueDate: d('2024-08-16') },
    { title: 'Client Meeting', description: 'Discuss project requirements with stakeholders', priority: 'high', status: 'pending', createdBy: demo._id, createdAt: d('2024-08-12'), updatedAt: d('2024-08-12'), dueDate: d('2024-08-18') },
    { title: 'Setup Database', description: 'Configure PostgreSQL database with proper schemas', priority: 'medium', status: 'completed', createdBy: demo._id, createdAt: d('2024-08-10'), updatedAt: d('2024-08-10') },
  ]);

  // Additional users for admin list
  const extraUsers = [
    { name: 'John Smith', email: 'john.smith@email.com', password: 'password123', role: 'user', status: 'active', createdAt: d('2024-01-18') },
    { name: 'Sarah Wilson', email: 'sarah.wilson@email.com', password: 'password123', role: 'user', status: 'inactive', createdAt: d('2024-01-10') },
    { name: 'Mike Johnson', email: 'mike.johnson@email.com', password: 'password123', role: 'user', status: 'active', createdAt: d('2024-01-12') },
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

  await Activity.create({ type: 'system_backup', message: 'System backup completed' });
  await Activity.create({ type: 'task_completed', message: 'Task completed by John Doe' });
  console.log('🌱 Demo data seeded');
}

async function start() {
  try {
    await connectDB(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');
    await ensureDefaultAdmin();
    await seedDemoDataIfNeeded();
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

start();