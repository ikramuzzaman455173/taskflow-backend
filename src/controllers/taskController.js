import Joi from 'joi';
import { Task } from '../models/Task.js';

const createSchema = Joi.object({
  title: Joi.string().min(2).max(120).required(),
  description: Joi.string().allow(''),
  priority: Joi.string().valid('low','medium','high').default('medium'),
  status: Joi.string().valid('pending','completed').default('pending'),
  dueDate: Joi.date().optional(),
});

const updateSchema = Joi.object({
  title: Joi.string().min(2).max(120).optional(),
  description: Joi.string().allow(''),
  priority: Joi.string().valid('low','medium','high'),
  status: Joi.string().valid('pending','completed'),
  dueDate: Joi.date().allow(null),
});

export const TaskController = {
  list: async (req, res) => {
    const { status, priority, search, sort='createdAt', order='desc' } = req.query;
    const q = { createdBy: req.user.id };
    if (status) q.status = status;
    if (priority) q.priority = priority;
    if (search) q.title = { $regex: search, $options: 'i' };
    const tasks = await Task.find(q).sort({ [sort]: order === 'asc' ? 1 : -1 }).lean();
    res.json({ success: true, data: tasks });
  },

  getOne: async (req, res) => {
    const t = await Task.findOne({ _id: req.params.id, createdBy: req.user.id }).lean();
    if (!t) return res.status(404).json({ success: false, error: 'Task not found' });
    res.json({ success: true, data: t });
  },

  create: async (req, res) => {
    const { error, value } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, error: error.message });
    const t = await Task.create({ ...value, createdBy: req.user.id });
    res.status(201).json({ success: true, data: t });
  },

  update: async (req, res) => {
    const { error, value } = updateSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, error: error.message });
    const t = await Task.findOneAndUpdate({ _id: req.params.id, createdBy: req.user.id }, value, { new: true });
    if (!t) return res.status(404).json({ success: false, error: 'Task not found' });
    res.json({ success: true, data: t });
  },

  remove: async (req, res) => {
    const t = await Task.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
    if (!t) return res.status(404).json({ success: false, error: 'Task not found' });
    res.json({ success: true, message: 'Deleted' });
  },

  removeAll: async (req, res) => {
    const result = await Task.deleteMany({ createdBy: req.user.id });
    res.json({ success: true, message: `Deleted ${result.deletedCount} tasks` });
  },

  summary: async (req, res) => {
    const now = new Date();
    const tasks = await Task.find({ createdBy: req.user.id }).lean();
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status !== 'completed').length;
    const overdue = tasks.filter(t => t.status !== 'completed' && t.dueDate && t.dueDate < now).length;
    const byPriority = {
      high: tasks.filter(t => t.priority === 'high').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      low: tasks.filter(t => t.priority === 'low').length,
    };
    const recent = tasks.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0,4);
    res.json({ success: true, data: { total, inProgress, completed, overdue, byPriority, recent } });
  },
};