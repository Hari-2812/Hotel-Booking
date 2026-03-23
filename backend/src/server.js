const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const express = require("express");

const { env } = require("./config/env");
const { connectDB } = require("./config/db");
const { createApp } = require("./app");
const { getAvailableRooms } = require("./services/availability");

async function start() {
  await connectDB();

  const app = createApp();

  // ✅ ALLOWED ORIGINS (LOCAL + VERCEL)
  const allowedOrigins = [
    "http://localhost:5173",
    "https://hotel-booking-jz2dzzxto-haris-projects-f04f3456.vercel.app",
  ];

  // ✅ CORS (VERY IMPORTANT - PLACE BEFORE ROUTES)
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

  // ✅ JSON middleware
  app.use(express.json());

  // ✅ Create HTTP server
  const server = http.createServer(app);

  // ✅ Socket.IO with CORS
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // ✅ SOCKET EVENTS
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("availability:check", async (payload, cb) => {
      try {
        const {
          checkIn,
          checkOut,
          location,
          minPrice,
          maxPrice,
          guests,
          page = 1,
          limit = 12,
        } = payload || {};

        // ✅ SAFE VALUES (IMPORTANT FIX)
        const safeMinPrice = minPrice ? Number(minPrice) : 0;
        const safeMaxPrice = maxPrice ? Number(maxPrice) : 100000;
        const safeGuests = guests ? Number(guests) : 1;

        const result = await getAvailableRooms({
          checkIn,
          checkOut,
          location,
          minPrice: safeMinPrice,
          maxPrice: safeMaxPrice,
          guests: safeGuests,
          page: Number(page),
          limit: Number(limit),
        });

        cb?.({
          success: true,
          rooms: result.rooms,
          total: result.total,
        });
      } catch (e) {
        console.error("❌ Socket Error:", e);
        cb?.({
          success: false,
          error: e.message || "Availability check failed",
        });
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // ✅ START SERVER
  server.listen(env.PORT, () => {
    console.log(`🚀 Server running on port ${env.PORT}`);
  });
}

// ✅ GLOBAL ERROR HANDLING
start().catch((e) => {
  console.error("❌ Failed to start server", e);
  process.exit(1);
});