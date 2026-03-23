const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const { env } = require('../config/env');
const { asyncHandler } = require('../utils/asyncHandler');

const ACCESS_TOKEN_TTL = '7d';

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email, role: user.role },
    env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL }
  );
}

function sanitizeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar || '',
    authProvider: user.authProvider || 'local',
  };
}

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ success: false, error: 'Email already registered' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const isSeedAdmin = env.SEED_ADMIN_EMAIL && env.SEED_ADMIN_EMAIL.toLowerCase() === email.toLowerCase();
  const user = await User.create({
    name,
    email,
    passwordHash,
    role: isSeedAdmin ? 'admin' : 'user',
  });

  res.json({ success: true, token: signToken(user), user: sanitizeUser(user) });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ success: false, error: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ success: false, error: 'Invalid credentials' });

  res.json({ success: true, token: signToken(user), user: sanitizeUser(user) });
});

async function verifyGoogleIdToken(idToken) {
  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
  if (!response.ok) {
    throw new Error('Google token verification failed');
  }

  const payload = await response.json();
  if (env.GOOGLE_CLIENT_ID && payload.aud !== env.GOOGLE_CLIENT_ID) {
    throw new Error('Google client mismatch');
  }
  if (!payload.email || payload.email_verified !== 'true') {
    throw new Error('Google email is not verified');
  }
  return payload;
}

const googleLogin = asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  const profile = await verifyGoogleIdToken(idToken);

  let user = await User.findOne({ email: profile.email });
  if (!user) {
    user = await User.create({
      name: profile.name || profile.email.split('@')[0],
      email: profile.email,
      passwordHash: crypto.randomBytes(24).toString('hex'),
      authProvider: 'google',
      avatar: profile.picture || '',
      role:
        env.SEED_ADMIN_EMAIL && env.SEED_ADMIN_EMAIL.toLowerCase() === profile.email.toLowerCase()
          ? 'admin'
          : 'user',
    });
  } else if (user.authProvider !== 'google' || (profile.picture && user.avatar !== profile.picture)) {
    user.authProvider = 'google';
    user.avatar = profile.picture || user.avatar;
    await user.save();
  }

  res.json({ success: true, token: signToken(user), user: sanitizeUser(user) });
});

module.exports = { googleLogin, login, register, sanitizeUser, signToken };
