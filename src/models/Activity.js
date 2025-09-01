import mongoose from 'mongoose';

const ActivitySchema = new mongoose.Schema(
  {
    type: { type: String, required: true }, // e.g., user_registered, task_completed, system_backup
    message: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Activity = mongoose.model('Activity', ActivitySchema);