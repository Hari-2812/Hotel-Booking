const http = require('http');
const { Server } = require('socket.io');

const { env } = require('./config/env');
const { connectDB } = require('./config/db');
const { createApp } = require('./app');
const { getAvailableRooms } = require('./services/availability');

async function start() {
  await connectDB();
  const app = createApp();
  const server = http.createServer(app);

  const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', env.CORS_ORIGIN].filter(Boolean);
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    socket.on('availability:check', async (payload, cb) => {
      try {
        const result = await getAvailableRooms({
          checkIn: payload?.checkIn,
          checkOut: payload?.checkOut,
          location: payload?.location,
          minPrice: payload?.minPrice,
          maxPrice: payload?.maxPrice,
          guests: payload?.guests,
          amenities: payload?.amenities || [],
          rating: payload?.rating,
          page: Number(payload?.page || 1),
          limit: Number(payload?.limit || 12),
          sort: payload?.sort,
        });

        cb?.({ success: true, rooms: result.rooms, total: result.total });
      } catch (error) {
        cb?.({ success: false, error: error.message || 'Availability check failed' });
      }
    });
  });

  server.listen(env.PORT, () => {
    console.log(`🚀 Server running on port ${env.PORT}`);
  });
}

start().catch((error) => {
  console.error('❌ Failed to start server', error);
  process.exit(1);
});
