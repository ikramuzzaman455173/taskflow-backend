import 'dotenv/config';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Task } from '../models/Task.js';
import { Activity } from '../models/Activity.js';

const d = (s) => new Date(s);

async function main() {
  await connectDB(process.env.MONGO_URI);
  console.log('Connected');

  await User.deleteMany({});
  await Task.deleteMany({});
  await Activity.deleteMany({});

  const admin = await User.create({ name:'Admin User', email:'admin@taskflow.com', password:'admin123', role:'admin', status:'active' });
  const demo = await User.create({ name:'Md. Ikramuzzaman', email:'jakaria455173@gmail.com', password:'demo123', role:'user', status:'active' });

  await Task.insertMany([
    { title: 'Design Homepage', description: 'Create wireframes and mockups for the new homepage design', priority: 'high', status: 'pending', createdBy: demo._id, createdAt: d('2024-08-15'), updatedAt: d('2024-08-15'), dueDate: d('2024-08-20') },
    { title: 'Code Review', description: 'Review pull requests from team members', priority: 'low', status: 'pending', createdBy: demo._id, createdAt: d('2024-08-14'), updatedAt: d('2024-08-14'), dueDate: d('2024-08-16') },
    { title: 'Client Meeting', description: 'Discuss project requirements with stakeholders', priority: 'high', status: 'pending', createdBy: demo._id, createdAt: d('2024-08-12'), updatedAt: d('2024-08-12'), dueDate: d('2024-08-18') },
    { title: 'Setup Database', description: 'Configure PostgreSQL database with proper schemas', priority: 'medium', status: 'completed', createdBy: demo._id, createdAt: d('2024-08-10'), updatedAt: d('2024-08-10') },
  ]);

  await Activity.create({ type: 'admin_seed', message: 'Default admin created', user: admin._id });
  await Activity.create({ type: 'user_registered', message: `New user registered: ${demo.name}`, user: demo._id });

  console.log('Seeded');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });