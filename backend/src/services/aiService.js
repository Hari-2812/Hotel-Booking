const ChatMessage = require('../models/ChatMessage');
const Booking = require('../models/Booking');
const Room = require('../models/Room');

const STOP_WORDS = new Set(['hotel', 'hotels', 'room', 'rooms', 'stay', 'with', 'near', 'in', 'the', 'a', 'an', 'for', 'and']);

function normalizeText(value = '') {
  return String(value).toLowerCase().trim();
}

function extractBudget(query) {
  const match = normalizeText(query).match(/(under|below|less than|max)\s*\$?(\d+)/i);
  return match ? Number(match[2]) : undefined;
}

function extractAmenities(query) {
  const text = normalizeText(query);
  const knownAmenities = ['pool', 'spa', 'wifi', 'parking', 'breakfast', 'gym', 'beach', 'pet friendly', 'workspace', 'ocean view'];
  return knownAmenities.filter((item) => text.includes(item));
}

function extractKeywords(query) {
  return normalizeText(query)
    .split(/[^a-z0-9]+/)
    .filter((token) => token && token.length > 2 && !STOP_WORDS.has(token));
}

function scoreRoom(room, preferences = {}) {
  let score = 0;
  const reasons = [];
  const location = normalizeText(room.location);
  const description = normalizeText(room.description);
  const amenities = (room.amenities || []).map(normalizeText);

  if (preferences.location && location.includes(normalizeText(preferences.location))) {
    score += 22;
    reasons.push(`Great match for ${preferences.location}`);
  }

  if (preferences.maxBudget && Number(room.basePricePerNight) <= Number(preferences.maxBudget)) {
    score += 20;
    reasons.push('Within your budget');
  }

  if (preferences.guests && Number(room.maxGuests) >= Number(preferences.guests)) {
    score += 14;
    reasons.push('Comfortably fits your group');
  }

  if (preferences.minRating && Number(room.avgRating || 0) >= Number(preferences.minRating)) {
    score += 10;
    reasons.push('Strong guest ratings');
  }

  const desiredAmenities = (preferences.amenities || []).map(normalizeText);
  desiredAmenities.forEach((item) => {
    if (amenities.some((amenity) => amenity.includes(item))) {
      score += 8;
      reasons.push(`Includes ${item}`);
    }
  });

  const keywords = (preferences.keywords || []).map(normalizeText);
  keywords.forEach((keyword) => {
    if (location.includes(keyword) || description.includes(keyword) || amenities.some((amenity) => amenity.includes(keyword))) {
      score += 5;
    }
  });

  score += Math.min(Number(room.avgRating || 0) * 5, 25);
  score += Math.min(Number(room.ratingCount || 0), 10);

  return {
    score,
    reasons: [...new Set(reasons)].slice(0, 3),
  };
}

function buildPricingInsight(room, marketRooms = []) {
  const currentPrice = Number(room.basePricePerNight || 0);
  const nearby = marketRooms.filter((item) => String(item._id) !== String(room._id));
  const avgNearby = nearby.length
    ? nearby.reduce((sum, item) => sum + Number(item.basePricePerNight || 0), 0) / nearby.length
    : currentPrice;

  const delta = avgNearby ? ((currentPrice - avgNearby) / avgNearby) * 100 : 0;
  const demandLevel = room.ratingCount > 15 ? 'high' : room.ratingCount > 5 ? 'medium' : 'emerging';
  const suggestion =
    delta > 8
      ? 'Prices are currently above nearby alternatives. Booking mid-week could provide better value.'
      : delta < -8
        ? 'This rate is lower than comparable stays nearby. It is a strong time to book.'
        : 'Pricing is aligned with the local market. Book soon if your dates are fixed.';

  return {
    currentPrice,
    marketAverage: Number(avgNearby.toFixed(2)),
    priceDeltaPercentage: Number(delta.toFixed(1)),
    demandLevel,
    bestBookingWindow: delta > 8 ? '3-4 weeks before check-in' : '1-2 weeks before check-in',
    suggestion,
  };
}

async function getRecommendations({ userId, preferences = {}, limit = 6 }) {
  const [rooms, bookings] = await Promise.all([
    Room.find({ isActive: true }).lean(),
    userId ? Booking.find({ userId, status: { $in: ['confirmed', 'pending'] } }).populate('roomId').lean() : Promise.resolve([]),
  ]);

  const historyKeywords = bookings
    .map((booking) => booking.roomId)
    .filter(Boolean)
    .flatMap((room) => [room.location, ...(room.amenities || [])])
    .filter(Boolean);

  const mergedPreferences = {
    ...preferences,
    keywords: [...(preferences.keywords || []), ...historyKeywords],
  };

  return rooms
    .map((room) => {
      const match = scoreRoom(room, mergedPreferences);
      return {
        ...room,
        recommendationScore: match.score,
        recommendationReasons: match.reasons,
      };
    })
    .sort((a, b) => b.recommendationScore - a.recommendationScore)
    .slice(0, Number(limit));
}

async function smartSearch({ query, guests, limit = 12 }) {
  const location = /beach|coast|ocean/.test(normalizeText(query)) ? 'beach' : undefined;
  const maxBudget = extractBudget(query);
  const amenities = extractAmenities(query);
  const keywords = extractKeywords(query);

  const baseFilter = { isActive: true };
  if (guests) {
    baseFilter.maxGuests = { $gte: Number(guests) };
  }
  if (maxBudget) {
    baseFilter.basePricePerNight = { $lte: maxBudget };
  }

  const rooms = await Room.find(baseFilter).lean();
  const preferences = { location, maxBudget, guests, amenities, keywords };

  return rooms
    .map((room) => {
      const match = scoreRoom(room, preferences);
      return {
        ...room,
        recommendationScore: match.score,
        recommendationReasons: match.reasons,
      };
    })
    .filter((room) => room.recommendationScore > 0)
    .sort((a, b) => b.recommendationScore - a.recommendationScore)
    .slice(0, Number(limit));
}

async function buildDashboard({ userId }) {
  const [recentBookings, recentMessages] = await Promise.all([
    Booking.find({ userId }).sort({ createdAt: -1 }).limit(5).populate('roomId').lean(),
    ChatMessage.find({ fromUserId: userId }).sort({ createdAt: -1 }).limit(5).lean(),
  ]);

  const recentSearches = recentMessages
    .map((message) => message.message)
    .filter((message) => message && message.length < 120)
    .slice(0, 4);

  const recommended = await getRecommendations({
    userId,
    preferences: {
      keywords: recentSearches,
      location: recentBookings[0]?.roomId?.location,
    },
    limit: 4,
  });

  return {
    recentBookings,
    recentSearches,
    recommended,
  };
}

function buildChatReply(message) {
  const text = normalizeText(message);
  if (text.includes('cancel')) {
    return 'You can cancel an active booking from your dashboard. Open your booking card and choose cancel or modify to manage the reservation.';
  }
  if (text.includes('price') || text.includes('cheap') || text.includes('budget')) {
    return 'Try Smart Search with phrases like “cheap beach hotel with pool under $180”. I can also suggest budget-friendly stays based on your dates.';
  }
  if (text.includes('check in') || text.includes('check-in')) {
    return 'Check-in and check-out are selected during booking. Once you choose dates, the platform rechecks live availability before payment.';
  }
  if (text.includes('payment') || text.includes('stripe')) {
    return 'Payments are processed securely through Stripe. Your dashboard shows booking and payment status after checkout.';
  }

  return 'I can help with bookings, amenities, pricing, cancellations, and destination suggestions. Tell me your budget, dates, and preferred vibe.';
}

module.exports = {
  buildChatReply,
  buildDashboard,
  buildPricingInsight,
  extractAmenities,
  extractBudget,
  extractKeywords,
  getRecommendations,
  normalizeText,
  scoreRoom,
  smartSearch,
};
