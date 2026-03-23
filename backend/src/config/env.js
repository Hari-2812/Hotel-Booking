const dotenv = require("dotenv");

dotenv.config();

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI,
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,

  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  STRIPE_CURRENCY: process.env.STRIPE_CURRENCY || "usd",
  ENABLE_STRIPE: process.env.ENABLE_STRIPE || "false",

  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: process.env.EMAIL_PORT,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  EMAIL_FROM: process.env.EMAIL_FROM || process.env.EMAIL_USER,

  // Optional: create an admin user automatically for bootstrapping.
  SEED_ADMIN_EMAIL: process.env.SEED_ADMIN_EMAIL || "",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
};

function requireEnv(key) {
  if (!env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

// Required for the app to boot
requireEnv("MONGO_URI");
requireEnv("JWT_ACCESS_SECRET");

// Stripe is required only for booking payments endpoints
if (env.ENABLE_STRIPE !== "false") {
  requireEnv("STRIPE_SECRET_KEY");
  requireEnv("STRIPE_WEBHOOK_SECRET");
}

module.exports = { env };

