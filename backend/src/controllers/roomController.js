const Room = require('../models/Room');
const Review = require('../models/Review');
const { asyncHandler } = require('../utils/asyncHandler');
const { getAvailableRooms, computePrice } = require('../services/availability');
const { smartSearch } = require('../services/aiService');

const parseList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return String(value).split(',').map((item) => item.trim()).filter(Boolean);
};

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
    amenities,
    rating,
    sort = 'featured',
    smart,
  } = req.query;

  if (smart) {
    const rooms = await smartSearch({ query: smart, guests, limit });
    return res.json({ success: true, rooms, total: rooms.length, page: 1, limit: Number(limit) });
  }

  if (checkIn && checkOut) {
    const result = await getAvailableRooms({
      checkIn,
      checkOut,
      location,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      guests: guests ? Number(guests) : undefined,
      amenities: parseList(amenities),
      rating: rating ? Number(rating) : undefined,
      page: Number(page),
      limit: Number(limit),
      sort,
    });
    return res.json({ success: true, ...result });
  }

  const query = { isActive: true };
  if (location) query.location = { $regex: new RegExp(String(location), 'i') };
  if (minPrice) query.basePricePerNight = { ...(query.basePricePerNight || {}), $gte: Number(minPrice) };
  if (maxPrice) query.basePricePerNight = { ...(query.basePricePerNight || {}), $lte: Number(maxPrice) };
  if (guests) query.maxGuests = { $gte: Number(guests) };
  if (rating) query.avgRating = { $gte: Number(rating) };
  const amenityList = parseList(amenities);
  if (amenityList.length) query.amenities = { $all: amenityList };

  const sortMap = {
    featured: { isFeatured: -1, avgRating: -1, createdAt: -1 },
    priceAsc: { basePricePerNight: 1, avgRating: -1 },
    priceDesc: { basePricePerNight: -1, avgRating: -1 },
    rating: { avgRating: -1, ratingCount: -1 },
    newest: { createdAt: -1 },
  };

  const skip = (Number(page) - 1) * Number(limit);
  const [rooms, total] = await Promise.all([
    Room.find(query).sort(sortMap[sort] || sortMap.featured).skip(skip).limit(Number(limit)).lean(),
    Room.countDocuments(query),
  ]);

  res.json({ success: true, rooms, total, page: Number(page), limit: Number(limit) });
});

const getRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id).lean();
  if (!room) return res.status(404).json({ success: false, error: 'Room not found' });

  const reviews = await Review.find({ roomId: room._id })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('userId', 'name email')
    .select('rating comment userId createdAt')
    .lean();

  res.json({ success: true, room, reviews });
});

const createRoom = asyncHandler(async (req, res) => {
  const room = await Room.create({
    ...req.body,
    amenities: parseList(req.body.amenities),
    images: parseList(req.body.images),
    tags: parseList(req.body.tags),
  });

  res.status(201).json({ success: true, room });
});

const updateRoom = asyncHandler(async (req, res) => {
  const payload = {
    ...req.body,
    ...(req.body.amenities ? { amenities: parseList(req.body.amenities) } : {}),
    ...(req.body.images ? { images: parseList(req.body.images) } : {}),
    ...(req.body.tags ? { tags: parseList(req.body.tags) } : {}),
  };

  const room = await Room.findByIdAndUpdate(req.params.id, payload, { new: true });
  if (!room) return res.status(404).json({ success: false, error: 'Room not found' });
  res.json({ success: true, room });
});

const deleteRoom = asyncHandler(async (req, res) => {
  const room = await Room.findByIdAndDelete(req.params.id);
  if (!room) return res.status(404).json({ success: false, error: 'Room not found' });
  res.json({ success: true });
});

const calcPrice = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.body.roomId).lean();
  if (!room) return res.status(404).json({ success: false, error: 'Room not found' });

  const { nights, total, nightlyPrice } = computePrice({ nightlyPrice: room.basePricePerNight, checkIn: req.body.checkIn, checkOut: req.body.checkOut });
  res.json({ success: true, price: { nights, total, nightlyPrice, currency: room.currency } });
});

module.exports = { calcPrice, createRoom, deleteRoom, getRoom, getRooms, updateRoom };
