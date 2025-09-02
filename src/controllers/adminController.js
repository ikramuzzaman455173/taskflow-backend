import Joi from "joi";
import { User } from "../models/User.js";
import { Task } from "../models/Task.js";
import { Activity } from "../models/Activity.js";

export const AdminController = {
  listUsers: async (req, res) => {
    const { search } = req.query;
    const q = {};
    if (search) {
      q.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }
    const users = await User.find(q).sort({ createdAt: 1 }).lean();

    const userIds = users.map((u) => u._id);
    const counts = await Task.aggregate([
      { $match: { createdBy: { $in: userIds } } },
      { $group: { _id: "$createdBy", count: { $sum: 1 } } }
    ]);
    const countMap = new Map(counts.map((c) => [c._id.toString(), c.count]));
    const data = users.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      tasks: countMap.get(u._id.toString()) || 0,
      joinedAt: u.createdAt,
      lastActive: u.lastActiveAt
    }));
    res.json({ success: true, data });
  },
  // makeAdmin: async (req, res) => {
  //   const user = await User.findByIdAndUpdate(req.params.id, { role: 'admin' }, { new: true });
  //   if (!user) return res.status(404).json({ success: false, error: 'User not found' });
  //   await Activity.create({ type: 'role_change', message: `${user.name} promoted to Admin`, user: user._id });
  //   res.json({ success: true, data: { id: user._id, role: user.role } });
  // },

  // activate: async (req, res) => {
  //   const user = await User.findByIdAndUpdate(req.params.id, { status: 'active' }, { new: true });
  //   if (!user) return res.status(404).json({ success: false, error: 'User not found' });
  //   res.json({ success: true, data: { id: user._id, status: user.status } });
  // },

  // deactivate: async (req, res) => {
  //   const user = await User.findByIdAndUpdate(req.params.id, { status: 'inactive' }, { new: true });
  //   if (!user) return res.status(404).json({ success: false, error: 'User not found' });
  //   res.json({ success: true, data: { id: user._id, status: user.status } });
  // },

  // removeUser: async (req, res) => {
  //   const user = await User.findById(req.params.id);
  //   if (!user) return res.status(404).json({ success: false, error: 'User not found' });
  //   await Task.deleteMany({ createdBy: user._id });
  //   await user.deleteOne();
  //   await Activity.create({ type: 'user_deleted', message: `User deleted: ${user.name}`, user: user._id });
  //   res.json({ success: true, message: 'User and tasks removed' });
  // },

  makeAdmin: async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { role: "admin" },
        { new: true }
      );
      if (!user) {
        return res
          .status(404)
          .json({ success: false, error: "User not found" });
      }

      // log activity
      await Activity.create({
        type: "role_change",
        message: `${user.name} promoted to Admin`,
        user: user._id
        // actor: req.user._id, // optional: who performed it
      });

      res.json({ success: true, data: { id: user._id, role: user.role } });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  activate: async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { status: "active" },
        { new: true }
      );
      if (!user) {
        return res
          .status(404)
          .json({ success: false, error: "User not found" });
      }

      // log activity
      await Activity.create({
        type: "status_change",
        message: `${user.name} account activated`,
        user: user._id
      });

      res.json({ success: true, data: { id: user._id, status: user.status } });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  deactivate: async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { status: "inactive" },
        { new: true }
      );
      if (!user) {
        return res
          .status(404)
          .json({ success: false, error: "User not found" });
      }

      // log activity
      await Activity.create({
        type: "status_change",
        message: `${user.name} account deactivated`,
        user: user._id
      });

      res.json({ success: true, data: { id: user._id, status: user.status } });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  removeUser: async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, error: "User not found" });
      }

      // log activity *before* deletion so we still have the name/id
      await Activity.create({
        type: "user_deleted",
        message: `User deleted: ${user.name}`,
        user: user._id
      });

      await Task.deleteMany({ createdBy: user._id });
      await user.deleteOne();

      res.json({ success: true, message: "User and tasks removed" });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};
