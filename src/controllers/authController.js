import Joi from "joi";
import ms from "ms";
import { v4 as uuidv4 } from "uuid";
import { User } from "../models/User.js";
import { RefreshToken } from "../models/RefreshToken.js";
import { Activity } from "../models/Activity.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyToken
} from "../utils/jwt.js";

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(80).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

// function setCookies(res, accessToken, refreshToken) {
//   const isProd = process.env.NODE_ENV === 'production';
//   const accessTtl = ms(process.env.ACCESS_TOKEN_EXPIRES || '15m');
//   const refreshTtl = ms(process.env.REFRESH_TOKEN_EXPIRES || '7d');
//   const common = { httpOnly: true, sameSite: 'lax', secure: isProd, path: '/' };
//   res.cookie('accessToken', accessToken, { ...common, maxAge: accessTtl });
//   res.cookie('refreshToken', refreshToken, { ...common, maxAge: refreshTtl });
// }

function setCookies(res, accessToken, refreshToken) {
  const isProd = process.env.NODE_ENV === "production";
  const accessTtl = ms(process.env.ACCESS_TOKEN_EXPIRES || "15m");
  const refreshTtl = ms(process.env.REFRESH_TOKEN_EXPIRES || "7d");

  const common = {
    httpOnly: true,
    secure: isProd, // must be true in production (HTTPS)
    sameSite: isProd ? "none" : "lax", // cross-site allowed in prod, safe lax in local
    path: "/"
  };

  res.cookie("accessToken", accessToken, { ...common, maxAge: accessTtl });
  res.cookie("refreshToken", refreshToken, { ...common, maxAge: refreshTtl });
}

export const AuthController = {
  register: async (req, res) => {
    const { error, value } = registerSchema.validate(req.body);

    if (error)
      return res.status(400).json({ success: false, error: error.message });

    const exists = await User.findOne({ email: value.email.toLowerCase() });
    if (exists)
      return res
        .status(400)
        .json({ success: false, error: "Email already registered" });

    const user = await User.create({
      ...value,
      email: value.email.toLowerCase()
    });
    await Activity.create({
      type: "user_registered",
      message: `New user registered: ${user.name}`,
      user: user._id
    });

    const payload = { sub: user._id.toString(), role: user.role };
    const jti = uuidv4();
    const access = signAccessToken(
      payload,
      process.env.JWT_ACCESS_SECRET,
      process.env.ACCESS_TOKEN_EXPIRES || "15m"
    );
    const refresh = signRefreshToken(
      payload,
      process.env.JWT_REFRESH_SECRET,
      process.env.REFRESH_TOKEN_EXPIRES || "7d",
      jti
    );
    await RefreshToken.create({
      user: user._id,
      jti,
      userAgent: req.get("user-agent") || "",
      ip: req.ip,
      expiresAt: new Date(
        Date.now() + ms(process.env.REFRESH_TOKEN_EXPIRES || "7d")
      )
    });

    setCookies(res, access, refresh);
    res
      .status(201)
      .json({
        success: true,
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
  },

  login: async (req, res) => {
    const { error, value } = loginSchema.validate(req.body);

    if (error)
      return res.status(400).json({ success: false, error: error.message });

    const user = await User.findOne({
      email: value.email.toLowerCase()
    }).select("+password");
    if (!user || !(await user.comparePassword(value.password))) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid email or password" });
    }
    if (user.status === "inactive")
      return res
        .status(403)
        .json({ success: false, error: "Account is inactive" });

    const payload = { sub: user._id.toString(), role: user.role };
    const jti = uuidv4();
    const access = signAccessToken(
      payload,
      process.env.JWT_ACCESS_SECRET,
      process.env.ACCESS_TOKEN_EXPIRES || "15m"
    );
    const refresh = signRefreshToken(
      payload,
      process.env.JWT_REFRESH_SECRET,
      process.env.REFRESH_TOKEN_EXPIRES || "7d",
      jti
    );
    await RefreshToken.create({
      user: user._id,
      jti,
      userAgent: req.get("user-agent") || "",
      ip: req.ip,
      expiresAt: new Date(
        Date.now() + ms(process.env.REFRESH_TOKEN_EXPIRES || "7d")
      )
    });

    setCookies(res, access, refresh);
    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  },

  logout: async (req, res) => {
    try {
      const refresh = req.cookies?.refreshToken;
      if (refresh) {
        try {
          const decoded = verifyToken(refresh, process.env.JWT_REFRESH_SECRET);
          await RefreshToken.updateOne(
            { jti: decoded.jti },
            { $set: { revoked: true } }
          );
        } catch {}
      }
      const isProd = process.env.NODE_ENV === "production";
      const common = {
        httpOnly: true,
        sameSite: "lax",
        secure: isProd,
        path: "/",
        maxAge: 0
      };
      res.cookie("accessToken", "", common);
      res.cookie("refreshToken", "", common);
      res.json({ success: true, message: "Logged out" });
    } catch (e) {
      res.json({ success: true, message: "Logged out" });
    }
  },

  refresh: async (req, res) => {
    const token = req.cookies?.refreshToken;
    if (!token)
      return res
        .status(401)
        .json({ success: false, error: "No refresh token" });
    try {
      const decoded = verifyToken(token, process.env.JWT_REFRESH_SECRET);
      const tokenDoc = await RefreshToken.findOne({
        jti: decoded.jti,
        revoked: false
      });
      if (!tokenDoc)
        return res
          .status(401)
          .json({ success: false, error: "Invalid refresh token" });
      if (tokenDoc.expiresAt < new Date())
        return res
          .status(401)
          .json({ success: false, error: "Refresh token expired" });

      // Rotate refresh token
      tokenDoc.revoked = true;
      await tokenDoc.save();

      const payload = { sub: decoded.sub, role: decoded.role };
      const jti = uuidv4();
      const access = signAccessToken(
        payload,
        process.env.JWT_ACCESS_SECRET,
        process.env.ACCESS_TOKEN_EXPIRES || "15m"
      );
      const refresh = signRefreshToken(
        payload,
        process.env.JWT_REFRESH_SECRET,
        process.env.REFRESH_TOKEN_EXPIRES || "7d",
        jti
      );
      await RefreshToken.create({
        user: decoded.sub,
        jti,
        userAgent: req.get("user-agent") || "",
        ip: req.ip,
        expiresAt: new Date(
          Date.now() + ms(process.env.REFRESH_TOKEN_EXPIRES || "7d")
        )
      });

      setCookies(res, access, refresh);
      res.json({ success: true, message: "Token refreshed" });
    } catch (e) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid refresh token" });
    }
  },

  me: async (req, res) => {
    const user = await User.findById(req.user.id).lean();
    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        preferences: user.preferences,
        joinedAt: user.joinedAt,
        lastActiveAt: user.lastActiveAt
      }
    });
  }
};
