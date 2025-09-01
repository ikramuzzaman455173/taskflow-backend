import mongoose from 'mongoose';
import { TASK_STATUS, TASK_PRIORITY } from '../utils/constants.js';

const TaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    priority: { type: String, enum: Object.values(TASK_PRIORITY), default: TASK_PRIORITY.MEDIUM },
    status: { type: String, enum: Object.values(TASK_STATUS), default: TASK_STATUS.PENDING },
    dueDate: { type: Date, required: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Task = mongoose.model('Task', TaskSchema);