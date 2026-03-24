const http = require("http");
const { Server } = require("socket.io");

const { env } = require("./config/env");
const { connectDB } = require("./config/db");
const { createApp } = require("./app");
const { getAvailableRooms } = require("./services/availability");

async function start() {
  await connectDB();

  const app = createApp();
  const server = http.createServer(app);

  const allowedOrigins = [
    "http://localhost:5173",
    "https://hotel-booking-jz2dzzxto-haris-projects-f04f3456.vercel.app",
  ];

  // ✅ SOCKET.IO
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("✅ User connected:", socket.id);

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

        // ✅ SAFE PARSE
        const safeMinPrice =
          minPrice && minPrice !== "" ? Number(minPrice) : 0;

        const safeMaxPrice =
          maxPrice && maxPrice !== "" ? Number(maxPrice) : 100000;

        const safeGuests =
          guests && guests !== "" ? Number(guests) : 1;

        // ⚠️ IMPORTANT VALIDATION
        if (!checkIn || !checkOut) {
          return cb?.({
            success: false,
            error: "checkIn and checkOut required",
          });
        }

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
  });

  server.listen(env.PORT, () => {
    console.log(`🚀 Server running on port ${env.PORT}`);
  });
}

// ✅ GLOBAL ERROR
start().catch((e) => {
  console.error("❌ Failed to start server", e);
  process.exit(1);
});