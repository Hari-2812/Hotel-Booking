const express = require("express");
const cors = require("cors");
const hpp = require("hpp");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");

const { env } = require("./config/env");

function isAllowedOrigin(origin, allowedOrigins) {
  if (!origin) return true;
  if (allowedOrigins.includes("*")) return true;
  if (allowedOrigins.includes(origin)) return true;

  try {
    const hostname = new URL(origin).hostname;
    if (hostname.endsWith(".vercel.app")) return true;
    if (hostname.endsWith(".onrender.com")) return true;
  } catch {
    return false;
  }

  return false;
}

function createApp() {
  const app = express();

  const allowedOrigins = env.CORS_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const allowedOrigins = env.CORS_ORIGIN.split(",").map((origin) => origin.trim());

  app.use(
    cors({
      origin(origin, callback) {
        if (isAllowedOrigin(origin, allowedOrigins)) {
          return callback(null, true);
        }
        return callback(null, false);
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`CORS not allowed: ${origin}`));
      },
      credentials: true,
    })
  );

  app.use(helmet());
  app.use(express.json());
  app.use(mongoSanitize());
  app.use(hpp());

  app.get("/", (req, res) => {
    res.send("StayBook AI API running 🚀");
  });

  app.use("/api/auth", require("./routes/authRoutes"));
  app.use("/api/users", require("./routes/userRoutes"));
  app.use("/api/rooms", require("./routes/roomRoutes"));
  app.use("/api/reviews", require("./routes/reviewRoutes"));
  app.use("/api/bookings", require("./routes/bookingRoutes"));
  app.use("/api/payments", require("./routes/paymentRoutes"));
  app.use("/api/admin", require("./routes/adminRoutes"));
  app.use("/api/chat", require("./routes/chatRoutes"));
  app.use("/api/ai", require("./routes/aiRoutes"));

  app.use((err, req, res, next) => {
    console.error("🔥 ERROR:", err);
    res.status(err.status || 500).json({
      success: false,
      error: err.message || "Internal Server Error",
    });
  });

  return app;
}

module.exports = { createApp };
