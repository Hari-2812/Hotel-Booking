const Room = require("../models/Room");
const Review = require("../models/Review");
const { asyncHandler } = require("../utils/asyncHandler");
const { getAvailableRooms, computePrice } = require("../services/availability");

const getRooms = asyncHandler(async (req, res) => {
  const {
    location,
    minPrice,
    maxPrice,
    guests,
    checkIn,
    checkOut,
    page = 1,
    limit = 12,
  } = req.query;

  // Availability-aware search (optional)
  if (checkIn && checkOut) {
    const result = await getAvailableRooms({
      checkIn,
      checkOut,
      location,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      guests: guests ? Number(guests) : undefined,
      page: Number(page),
      limit: Number(limit),
    });
    return res.json({ success: true, ...result });
  }

  // Otherwise: just filtered listing
  const query = { isActive: true };
  if (location) query.location = { $regex: new RegExp(String(location), "i") };
  if (minPrice) query.basePricePerNight = { ...(query.basePricePerNight || {}), $gte: Number(minPrice) };
  if (maxPrice) query.basePricePerNight = { ...(query.basePricePerNight || {}), $lte: Number(maxPrice) };

  const skip = (Number(page) - 1) * Number(limit);

  const rooms = await Room.find(query)
    .skip(skip)
    .limit(Number(limit))
    .lean();

  const total = await Room.countDocuments(query);

  res.json({ success: true, rooms, total, page: Number(page), limit: Number(limit) });
});

const getRoom = asyncHandler(async (req, res) => {
  const roomId = req.params.id;
  const room = await Room.findById(roomId).lean();
  if (!room) return res.status(404).json({ success: false, error: "Room not found" });

  const reviews = await Review.find({ roomId: room._id })
    .sort({ createdAt: -1 })
    .limit(10)
    .select("rating comment userId createdAt");

  res.json({ success: true, room, reviews });
});

const createRoom = asyncHandler(async (req, res) => {
  const {
    hotelName,
    location,
    address,
    description,
    images = [],
    amenities = [],
    basePricePerNight,
    currency,
    maxGuests,
  } = req.body;

  const room = await Room.create({
    hotelName,
    location,
    address,
    description,
    images,
    amenities,
    basePricePerNight,
    currency,
    maxGuests,
  });

  res.status(201).json({ success: true, room });
});

const updateRoom = asyncHandler(async (req, res) => {
  const roomId = req.params.id;
  const room = await Room.findByIdAndUpdate(roomId, req.body, { new: true });
  if (!room) return res.status(404).json({ success: false, error: "Room not found" });
  res.json({ success: true, room });
});

const deleteRoom = asyncHandler(async (req, res) => {
  const roomId = req.params.id;
  const room = await Room.findByIdAndDelete(roomId);
  if (!room) return res.status(404).json({ success: false, error: "Room not found" });
  res.json({ success: true });
});

// Helper endpoint for UI price calculation
const calcPrice = asyncHandler(async (req, res) => {
  const { roomId, checkIn, checkOut } = req.body;
  const room = await Room.findById(roomId).lean();
  if (!room) return res.status(404).json({ success: false, error: "Room not found" });

  const { nights, total, nightlyPrice } = computePrice({
    nightlyPrice: room.basePricePerNight,
    checkIn,
    checkOut,
  });

  res.json({
    success: true,
    price: { nights, total, nightlyPrice, currency: room.currency },
  });
});

module.exports = {
  getRooms,
  getRoom,
  createRoom,
  updateRoom,
  deleteRoom,
  calcPrice,
};

