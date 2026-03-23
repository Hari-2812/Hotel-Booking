const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const { env } = require("./config/env");
const { connectDB } = require("./config/db");
const { createApp } = require("./app");
const { getAvailableRooms } = require("./services/availability");

async function start() {
  await connectDB();

  const app = createApp();

  // ✅ IMPORTANT: Add CORS for Express (HTTP requests)
  app.use(
    cors({
      origin: "http://localhost:5173", // frontend URL
      credentials: true,
    })
  );

  app.use(require("express").json());

  const server = http.createServer(app);

  // ✅ Socket.IO CORS (WebSockets)
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  // ✅ Socket events
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

        const result = await getAvailableRooms({
          checkIn,
          checkOut,
          location,
          minPrice,
          maxPrice,
          guests,
          page: Number(page),
          limit: Number(limit),
        });

        cb?.({
          success: true,
          rooms: result.rooms,
          total: result.total,
        });
      } catch (e) {
        console.error("Socket Error:", e);
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

  // ✅ Start server
  server.listen(env.PORT, () => {
    console.log(`🚀 Server running on http://localhost:${env.PORT}`);
  });
}

// ✅ Error handling
start().catch((e) => {
  console.error("❌ Failed to start server", e);
  process.exit(1);
});