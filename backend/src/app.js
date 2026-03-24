const express = require("express");
const cors = require("cors");
const hpp = require("hpp");

function createApp() {
  const app = express();

  const allowedOrigins = [
    "http://localhost:5173",
    "https://hotel-booking-jz2dzzxto-haris-projects-f04f3456.vercel.app",
  ];

  // ✅ CORS
  app.use(
    cors({
      origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("CORS not allowed: " + origin));
        }
      },
      credentials: true,
    })
  );

  // ✅ BODY PARSER
  app.use(express.json());

  // ✅ HPP (safe)
  app.use(hpp());

  // ✅ ROUTES
  app.use("/api/rooms", require("./routes/roomRoutes"));
  app.use("/api/ai", require("./routes/aiRoutes"));

  // ✅ HEALTH CHECK
  app.get("/", (req, res) => {
    res.send("API running 🚀");
  });

  // ✅ ERROR HANDLER
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