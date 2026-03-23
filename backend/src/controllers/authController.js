const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const { env } = require("../config/env");
const { asyncHandler } = require("../utils/asyncHandler");

const ACCESS_TOKEN_TTL = "7d";

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ success: false, error: "Email already registered" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const isSeedAdmin = env.SEED_ADMIN_EMAIL && env.SEED_ADMIN_EMAIL.toLowerCase() === email.toLowerCase();

  const user = await User.create({
    name,
    email,
    passwordHash,
    role: isSeedAdmin ? "admin" : "user",
  });

  const token = jwt.sign(
    { sub: user._id.toString(), email: user.email, role: user.role },
    env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL }
  );

  res.json({
    success: true,
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ success: false, error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ success: false, error: "Invalid credentials" });

  const token = jwt.sign(
    { sub: user._id.toString(), email: user.email, role: user.role },
    env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL }
  );

  res.json({
    success: true,
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

module.exports = { register, login };

