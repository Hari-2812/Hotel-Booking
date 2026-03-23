const Booking = require('../models/Booking');
const Room = require('../models/Room');
const User = require('../models/User');
const { asyncHandler } = require('../utils/asyncHandler');

const listRooms = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);
  const skip = (page - 1) * limit;
  const [rooms, total] = await Promise.all([
    Room.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Room.countDocuments({}),
  ]);
  res.json({ success: true, rooms, total, page, limit });
});

const listUsers = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);
  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find({}).select('name email role wishlist recentSearches authProvider createdAt').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments({}),
  ]);
  res.json({ success: true, users, total, page, limit });
});

const listBookings = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);
  const skip = (page - 1) * limit;
  const filter = req.query.status ? { status: req.query.status } : {};

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email')
      .populate('roomId', 'hotelName location basePricePerNight')
      .lean(),
    Booking.countDocuments(filter),
  ]);

  res.json({ success: true, bookings, total, page, limit });
});

const analytics = asyncHandler(async (req, res) => {
  const from = req.query.from ? new Date(req.query.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const to = req.query.to ? new Date(req.query.to) : new Date();

  const [confirmed, roomsCount, usersCount, pendingBookings] = await Promise.all([
    Booking.find({ status: { $in: ['confirmed', 'modified'] }, createdAt: { $gte: from, $lte: to } }).lean(),
    Room.countDocuments({}),
    User.countDocuments({}),
    Booking.countDocuments({ status: 'pending' }),
  ]);

  const revenue = confirmed.reduce((sum, booking) => sum + Number(booking.totalPrice || 0), 0);
  const byDayMap = {};
  for (const booking of confirmed) {
    const key = booking.createdAt.toISOString().slice(0, 10);
    byDayMap[key] = byDayMap[key] || { date: key, count: 0, revenue: 0 };
    byDayMap[key].count += 1;
    byDayMap[key].revenue += Number(booking.totalPrice || 0);
  }

  res.json({
    success: true,
    metrics: {
      from: from.toISOString(),
      to: to.toISOString(),
      confirmedBookings: confirmed.length,
      pendingBookings,
      roomsCount,
      usersCount,
      revenue,
      averageOrderValue: confirmed.length ? Number((revenue / confirmed.length).toFixed(2)) : 0,
    },
    series: Object.values(byDayMap).sort((a, b) => a.date.localeCompare(b.date)),
  });
});

const updateUserRole = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true })
    .select('name email role')
    .lean();
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });
  res.json({ success: true, user });
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });
  res.json({ success: true });
});

module.exports = { analytics, deleteUser, listBookings, listRooms, listUsers, updateUserRole };
