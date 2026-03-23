const Booking = require('../models/Booking');
const Room = require('../models/Room');

const BLOCKING_STATUSES = ['pending', 'confirmed', 'modified'];

function toDateOrThrow(value, fieldName) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date for ${fieldName}`);
  }
  return date;
}

function nightsBetween(checkIn, checkOut) {
  const ms = checkOut.getTime() - checkIn.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

async function findOverlappingBookings({ roomIds, checkIn, checkOut, excludeBookingId }) {
  if (!roomIds || roomIds.length === 0) return [];

  const query = {
    roomId: { $in: roomIds },
    status: { $in: BLOCKING_STATUSES },
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  return Booking.find(query).select({ roomId: 1 }).lean();
}

async function getAvailableRooms({
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
  sort = 'featured',
}) {
  checkIn = toDateOrThrow(checkIn, 'checkIn');
  checkOut = toDateOrThrow(checkOut, 'checkOut');
  if (checkIn >= checkOut) {
    throw new Error('checkOut must be after checkIn');
  }

  const query = { isActive: true };
  if (location) query.location = { $regex: new RegExp(location, 'i') };
  if (minPrice !== undefined && !Number.isNaN(Number(minPrice))) {
    query.basePricePerNight = { ...(query.basePricePerNight || {}), $gte: Number(minPrice) };
  }
  if (maxPrice !== undefined && !Number.isNaN(Number(maxPrice))) {
    query.basePricePerNight = { ...(query.basePricePerNight || {}), $lte: Number(maxPrice) };
  }
  if (guests && !Number.isNaN(Number(guests))) query.maxGuests = { $gte: Number(guests) };
  if (rating && !Number.isNaN(Number(rating))) query.avgRating = { $gte: Number(rating) };
  if (amenities.length) query.amenities = { $all: amenities };

  const sortMap = {
    featured: { isFeatured: -1, avgRating: -1, createdAt: -1 },
    priceAsc: { basePricePerNight: 1, avgRating: -1 },
    priceDesc: { basePricePerNight: -1, avgRating: -1 },
    rating: { avgRating: -1, ratingCount: -1 },
    newest: { createdAt: -1 },
  };

  const candidates = await Room.find(query).sort(sortMap[sort] || sortMap.featured).lean();
  if (!candidates.length) {
    return { rooms: [], total: 0, page: Number(page), limit: Number(limit) };
  }

  const overlapping = await findOverlappingBookings({
    roomIds: candidates.map((room) => room._id),
    checkIn,
    checkOut,
  });
  const blocked = new Set(overlapping.map((booking) => String(booking.roomId)));
  const availableRooms = candidates.filter((room) => !blocked.has(String(room._id)));
  const skip = (Number(page) - 1) * Number(limit);

  return {
    rooms: availableRooms.slice(skip, skip + Number(limit)),
    total: availableRooms.length,
    page: Number(page),
    limit: Number(limit),
  };
}

function computePrice({ nightlyPrice, checkIn, checkOut }) {
  const start = toDateOrThrow(checkIn, 'checkIn');
  const end = toDateOrThrow(checkOut, 'checkOut');
  if (start >= end) {
    throw new Error('checkOut must be after checkIn');
  }

  const nights = nightsBetween(start, end);
  if (nights < 1) throw new Error('Invalid date range');

  const nightlyPriceNum = Number(nightlyPrice);
  return {
    nights,
    total: nightlyPriceNum * nights,
    nightlyPrice: nightlyPriceNum,
  };
}

module.exports = { BLOCKING_STATUSES, computePrice, findOverlappingBookings, getAvailableRooms };
