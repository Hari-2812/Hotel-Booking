const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");
const rateLimit = require("express-rate-limit");

const { env } = require("./config/env");
const { errorHandler } = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const roomRoutes = require("./routes/roomRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const chatRoutes = require("./routes/chatRoutes");

function createApp() {
  const app = express();

  app.disable("x-powered-by");

  // ✅ Security & Rate Limiting
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
    })
  );

  app.use(helmet());
  app.use(hpp());
  // app.use(mongoSanitize());
  app.use(morgan("dev"));

  // ✅ FIXED CORS (IMPORTANT)
  const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    env.CORS_ORIGIN, // from .env
  ].filter(Boolean);

  app.use(
    cors({
      origin: function (origin, callback) {
        // allow requests with no origin (like Postman)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        } else {
          console.error("❌ CORS blocked:", origin);
          return callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
    })
  );

  // ✅ Stripe webhook (must be before JSON parser)
  app.use(
    "/api/payments/stripe/webhook",
    express.raw({ type: "application/json" })
  );

  // ✅ Body parsers
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false }));

  // ✅ Health check
  app.get("/api/health", (req, res) => {
    res.json({ ok: true });
  });

  // ✅ Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/rooms", roomRoutes);
  app.use("/api/reviews", reviewRoutes);
  app.use("/api/bookings", bookingRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use("/api/chat", chatRoutes);

  // ✅ Global error handler
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };