import mongoose from 'mongoose';
import { Task } from '../models/Task.js';
import { User } from '../models/User.js';
import { Activity } from '../models/Activity.js';

export const DashboardController = {
  user: async (req, res) => {
    const now = new Date();
    const userId = req.user.id;
    const tasks = await Task.find({ createdBy: userId }).lean();
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status !== 'completed').length;
    const overdue = tasks.filter(t => t.status !== 'completed' && t.dueDate && t.dueDate < now).length;
    const completionRate = total ? Math.round((completed / total) * 100) : 0;
    const byPriority = {
      high: tasks.filter(t => t.priority === 'high').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      low: tasks.filter(t => t.priority === 'low').length,
    };
    const recent = tasks.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0,4);
    res.json({
      success: true,
      data: {
        totals: { total, inProgress, completed, overdue },
        completionRate,
        byPriority,
        recent,
      },
    });
  },

  admin: async (req, res) => {
    const [totalUsers, activeUsers, totalTasks, completedTasks] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ status: 'active' }),
      Task.countDocuments({}),
      Task.countDocuments({ status: 'completed' }),
    ]);

    const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Task status overview
    const pendingCount = await Task.countDocuments({ status: 'pending' });
    const overdueCount = await Task.countDocuments({ status: 'pending', dueDate: { $lt: new Date() } });

    // Recent activity (last 10)
    const recentActivity = await Activity.find({}).sort({ createdAt: -1 }).limit(10).lean();

    // Users table with tasks count
    const usersWithCounts = await User.aggregate([
      { $sort: { createdAt: 1 } },
      {
        $lookup: {
          from: 'tasks',
          localField: '_id',
          foreignField: 'createdBy',
          as: 'tasks',
        },
      },
      {
        $addFields: {
          tasksCount: { $size: '$tasks' },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          role: 1,
          status: 1,
          joinedAt: '$createdAt',
          lastActiveAt: 1,
          tasksCount: 1,
        },
      },
    ]);

    // System health: simplistic view
    const dbReady = mongoose.connection.readyState === 1;
    const systemHealth = {
      serverStatus: 'Online',
      database: dbReady ? 'Healthy' : 'Disconnected',
      responseTimeMs: 120, // static placeholder; front-end can ignore/replace
    };

    res.json({
      success: true,
      data: {
        metrics: {
          totalUsers,
          activeUsers,
          totalTasks,
          completionRate,
        },
        statusOverview: {
          completed: completedTasks,
          pending: pendingCount,
          overdue: overdueCount,
        },
        systemHealth,
        recentActivity,
        users: usersWithCounts,
      },
    });
  },
};