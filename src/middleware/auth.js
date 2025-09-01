import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export async function authRequired(req, res, next) {
  try {
    const token = req.cookies?.accessToken;
    if (!token) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    if (user.status === 'inactive') return res.status(403).json({ success: false, error: 'Account is inactive' });
    req.user = { id: user._id.toString(), role: user.role };
    // Update lastActiveAt lazily
    user.lastActiveAt = new Date();
    await user.save({ validateBeforeSave: false });
    next();
  } catch (e) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin only' });
  }
  next();
}