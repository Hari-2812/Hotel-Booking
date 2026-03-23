const Booking = require("../models/Booking");
const Room = require("../models/Room");
const User = require("../models/User");
const { asyncHandler } = require("../utils/asyncHandler");

const listRooms = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);
  const skip = (page - 1) * limit;
  const [rooms, total] = await Promise.all([
    Room.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Room.countDocuments({}),
  ]);
  res.json({ success: true, rooms, total, page, limit });
});

const listUsers = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find({})
      .select("name email role wishlist createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments({}),
  ]);

  res.json({ success: true, users, total, page, limit });
});

const listBookings = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);
  const skip = (page - 1) * limit;
  const status = req.query.status;

  const filter = {};
  if (status) filter.status = status;

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "name email")
      .populate("roomId", "hotelName location")
      .lean(),
    Booking.countDocuments(filter),
  ]);

  res.json({ success: true, bookings, total, page, limit });
});

// Basic analytics: confirmed bookings count + revenue over a date range.
const analytics = asyncHandler(async (req, res) => {
  const from = req.query.from ? new Date(req.query.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const to = req.query.to ? new Date(req.query.to) : new Date();

  const confirmed = await Booking.find({
    status: "confirmed",
    createdAt: { $gte: from, $lte: to },
  }).lean();

  const revenue = confirmed.reduce((sum, b) => sum + Number(b.totalPrice || 0), 0);

  const byDay = {};
  for (const b of confirmed) {
    const key = b.createdAt.toISOString().slice(0, 10);
    byDay[key] = byDay[key] || { date: key, count: 0, revenue: 0 };
    byDay[key].count += 1;
    byDay[key].revenue += Number(b.totalPrice || 0);
  }

  const series = Object.values(byDay).sort((a, b) => (a.date < b.date ? -1 : 1));
  res.json({
    success: true,
    metrics: {
      from: from.toISOString(),
      to: to.toISOString(),
      confirmedBookings: confirmed.length,
      revenue,
    },
    series,
  });
});

const updateUserRole = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const { role } = req.body;
  if (!["user", "admin"].includes(role)) {
    return res.status(400).json({ success: false, error: "Invalid role" });
  }

  const user = await User.findByIdAndUpdate(userId, { role }, { new: true }).select("name email role").lean();
  if (!user) return res.status(404).json({ success: false, error: "User not found" });
  res.json({ success: true, user });
});

const deleteUser = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const user = await User.findByIdAndDelete(userId);
  if (!user) return res.status(404).json({ success: false, error: "User not found" });

  // Note: In production you may also want to cascade delete bookings/reviews.
  res.json({ success: true });
});

module.exports = { listRooms, listUsers, listBookings, analytics, updateUserRole, deleteUser };

