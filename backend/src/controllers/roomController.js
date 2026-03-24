const Room = require("../models/Room");
const { asyncHandler } = require("../utils/asyncHandler");

// ------------------ HELPERS ------------------ //

const parseList = (value) => {
  if (!value) return [];
  return String(value).split(",").filter(Boolean);
};

const safeNumber = (val) =>
  val !== undefined && val !== "" ? Number(val) : undefined;

// ------------------ GET ALL ROOMS ------------------ //

const getRooms = asyncHandler(async (req, res) => {
  console.log("🔥 QUERY:", req.query);

  const {
    location,
    minPrice,
    maxPrice,
    guests,
    page = 1,
    limit = 12,
    amenities,
    rating,
    sort = "featured",
  } = req.query;

  const query = { isActive: true };

  if (location) {
    query.location = { $regex: new RegExp(location, "i") };
  }

  if (safeNumber(minPrice) || safeNumber(maxPrice)) {
    query.basePricePerNight = {
      $gte: safeNumber(minPrice) || 0,
      $lte: safeNumber(maxPrice) || 100000,
    };
  }

  if (safeNumber(guests)) {
    query.maxGuests = { $gte: safeNumber(guests) };
  }

  if (rating) {
    query.avgRating = { $gte: Number(rating) };
  }

  const amenityList = parseList(amenities);
  if (amenityList.length) {
    query.amenities = { $all: amenityList };
  }

  const sortMap = {
    featured: { createdAt: -1 },
    priceAsc: { basePricePerNight: 1 },
    priceDesc: { basePricePerNight: -1 },
    rating: { avgRating: -1 },
  };

  const skip = (Number(page) - 1) * Number(limit);

  const [rooms, total] = await Promise.all([
    Room.find(query)
      .sort(sortMap[sort] || sortMap.featured)
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Room.countDocuments(query),
  ]);

  res.json({
    success: true,
    rooms,
    total,
    page: Number(page),
    limit: Number(limit),
  });
});

// ------------------ GET SINGLE ROOM ------------------ //

const getRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id).lean();

  if (!room) {
    return res.status(404).json({ success: false, error: "Room not found" });
  }

  res.json({ success: true, room });
});

// ------------------ CREATE ROOM ------------------ //

const createRoom = asyncHandler(async (req, res) => {
  const room = await Room.create({
    ...req.body,
    amenities: parseList(req.body.amenities),
  });

  res.status(201).json({ success: true, room });
});

// ------------------ UPDATE ROOM ------------------ //

const updateRoom = asyncHandler(async (req, res) => {
  const room = await Room.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  if (!room) {
    return res.status(404).json({ success: false, error: "Room not found" });
  }

  res.json({ success: true, room });
});

// ------------------ DELETE ROOM ------------------ //

const deleteRoom = asyncHandler(async (req, res) => {
  const room = await Room.findByIdAndDelete(req.params.id);

  if (!room) {
    return res.status(404).json({ success: false, error: "Room not found" });
  }

  res.json({ success: true });
});

// ------------------ CALCULATE PRICE ------------------ //

const calcPrice = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.body.roomId);

  if (!room) {
    return res.status(404).json({ success: false, error: "Room not found" });
  }

  const nights = 1; // simplified
  const total = room.basePricePerNight * nights;

  res.json({
    success: true,
    price: {
      nights,
      total,
      nightlyPrice: room.basePricePerNight,
    },
  });
});

// ------------------ EXPORT ------------------ //

module.exports = {
  getRooms,
  getRoom,
  createRoom,
  updateRoom,
  deleteRoom,
  calcPrice,
};