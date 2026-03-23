const Room = require("../models/Room");
const Booking = require("../models/Booking");

// Blocking statuses for preventing double booking
const BLOCKING_STATUSES = ["pending", "confirmed"];

// ✅ Convert to Date safely
function toDateOrThrow(value, fieldName) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid date for ${fieldName}`);
  }
  return d;
}

// ✅ Calculate nights
function nightsBetween(checkIn, checkOut) {
  const ms = checkOut.getTime() - checkIn.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

// ✅ Find overlapping bookings
async function findOverlappingBookings({ roomIds, checkIn, checkOut }) {
  if (!roomIds || roomIds.length === 0) return [];

  return Booking.find({
    roomId: { $in: roomIds },
    status: { $in: BLOCKING_STATUSES },
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
  }).select({ roomId: 1 });
}

// ✅ MAIN FUNCTION (FIXED)
async function getAvailableRooms({
  checkIn,
  checkOut,
  location,
  minPrice,
  maxPrice,
  guests,
  page = 1,
  limit = 12,
}) {
  try {
    // ✅ Validate dates
    checkIn = toDateOrThrow(checkIn, "checkIn");
    checkOut = toDateOrThrow(checkOut, "checkOut");

    if (checkIn >= checkOut) {
      throw new Error("checkOut must be after checkIn");
    }

    // ✅ Build query safely
    const query = { isActive: true };

    if (location) {
      query.location = { $regex: new RegExp(location, "i") };
    }

    // ✅ FIXED price filters (no NaN issues)
    if (minPrice !== undefined) {
      const min = Number(minPrice);
      if (!isNaN(min)) {
        query.basePricePerNight = {
          ...(query.basePricePerNight || {}),
          $gte: min,
        };
      }
    }

    if (maxPrice !== undefined) {
      const max = Number(maxPrice);
      if (!isNaN(max)) {
        query.basePricePerNight = {
          ...(query.basePricePerNight || {}),
          $lte: max,
        };
      }
    }

    // ✅ Guests filter
    if (guests) {
      const g = Number(guests);
      if (!isNaN(g)) {
        query.maxGuests = { $gte: g };
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    // ✅ Get candidate rooms
    const candidatesAll = await Room.find(query)
      .select("_id")
      .lean();

    if (!candidatesAll.length) {
      return {
        rooms: [],
        total: 0,
        page: Number(page),
        limit: Number(limit),
      };
    }

    const candidateIds = candidatesAll.map((r) => r._id);

    // ✅ Find overlapping bookings
    const overlapping = await findOverlappingBookings({
      roomIds: candidateIds,
      checkIn,
      checkOut,
    });

    const blocked = new Set(overlapping.map((b) => String(b.roomId)));

    // ✅ Filter available rooms
    const availableIds = candidateIds.filter(
      (id) => !blocked.has(String(id))
    );

    const total = availableIds.length;

    // ✅ Get paginated rooms
    const rooms = await Room.find({
      _id: { $in: availableIds },
    })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    return {
      rooms,
      total,
      page: Number(page),
      limit: Number(limit),
    };
  } catch (error) {
    console.error("❌ Availability Service Error:", error);
    throw error;
  }
}

// ✅ Price calculation
function computePrice({ nightlyPrice, checkIn, checkOut }) {
  checkIn = toDateOrThrow(checkIn, "checkIn");
  checkOut = toDateOrThrow(checkOut, "checkOut");

  if (checkIn >= checkOut) {
    throw new Error("checkOut must be after checkIn");
  }

  const nights = nightsBetween(checkIn, checkOut);

  if (nights < 1) {
    throw new Error("Invalid date range");
  }

  const nightlyPriceNum = Number(nightlyPrice);

  return {
    nights,
    total: nightlyPriceNum * nights,
    nightlyPrice: nightlyPriceNum,
  };
}

module.exports = {
  getAvailableRooms,
  computePrice,
  findOverlappingBookings,
  BLOCKING_STATUSES,
};