const Booking = require("../models/Booking");
const Room = require("../models/Room");

const BLOCKING_STATUSES = ["pending", "confirmed", "modified"];

const isValidDate = (value) => {
  if (!value || value === "") return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
};

async function findOverlappingBookings({ roomIds, checkIn, checkOut }) {
  if (!roomIds.length) return [];

  return Booking.find({
    roomId: { $in: roomIds },
    status: { $in: BLOCKING_STATUSES },
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
  })
    .select({ roomId: 1 })
    .lean();
}

async function getAvailableRooms(params) {
  let {
    checkIn,
    checkOut,
    location,
    minPrice,
    maxPrice,
    guests,
    amenities = [],
    rating,
    page = 1,
    limit = 12,
  } = params;

  // ✅ FIX: prevent crash
  if (!isValidDate(checkIn) || !isValidDate(checkOut)) {
    return { rooms: [], total: 0, page: Number(page), limit: Number(limit) };
  }

  checkIn = new Date(checkIn);
  checkOut = new Date(checkOut);

  if (checkIn >= checkOut) {
    return { rooms: [], total: 0, page: Number(page), limit: Number(limit) };
  }

  const query = { isActive: true };

  if (location) query.location = { $regex: new RegExp(location, "i") };

  if (minPrice && minPrice !== "") {
    query.basePricePerNight = { ...(query.basePricePerNight || {}), $gte: Number(minPrice) };
  }

  if (maxPrice && maxPrice !== "") {
    query.basePricePerNight = { ...(query.basePricePerNight || {}), $lte: Number(maxPrice) };
  }

  if (guests && guests !== "") {
    query.maxGuests = { $gte: Number(guests) };
  }

  if (rating && rating !== "") {
    query.avgRating = { $gte: Number(rating) };
  }

  if (amenities.length) {
    query.amenities = { $all: amenities };
  }

  const candidates = await Room.find(query).lean();

  return {
    rooms: candidates.slice(0, Number(limit)),
    total: candidates.length,
    page: Number(page),
    limit: Number(limit),
  };
}

module.exports = { getAvailableRooms };