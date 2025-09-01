import Joi from "joi";
import { User } from "../models/User.js";

const profileSchema = Joi.object({
  name: Joi.string().min(2).max(80).required(),
  email: Joi.string()
    .trim()
    .lowercase()
    .email({ tlds: { allow: false } }) // allow any TLD
    .max(254)
    .required(),
  preferences: Joi.object({ darkMode: Joi.boolean() }).optional()
});

const passwordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required()
});

export const ProfileController = {
  get: async (req, res) => {
    const user = await User.findById(req.user.id).lean();
    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        preferences: user.preferences
      }
    });
  },
  update: async (req, res) => {
    const { error, value } = profileSchema.validate(req.body);
    if (error)
      return res.status(400).json({ success: false, error: error.message });
    const user = await User.findByIdAndUpdate(req.user.id, value, {
      new: true
    });
    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        preferences: user.preferences
      }
    });
  },
  changePassword: async (req, res) => {
    const { error, value } = passwordSchema.validate(req.body);
    console.log("🚀 ~ req.body:", req.body)
    if (error)
      return res.status(400).json({ success: false, error: error.message });
    const user = await User.findById(req.user.id).select("+password");
    const ok = await user.comparePassword(value.currentPassword);
    if (!ok)
      return res
        .status(400)
        .json({ success: false, error: "Current password incorrect" });
    user.password = value.newPassword;
    await user.save();
    res.json({ success: true, message: "Password updated" });
  }
};
