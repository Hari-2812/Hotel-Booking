const ChatMessage = require("../models/ChatMessage");
const Booking = require("../models/Booking");
const Room = require("../models/Room");
const Review = require("../models/Review");

const STOP_WORDS = new Set(["hotel", "hotels", "room", "rooms", "stay", "with", "near", "in", "the", "a", "an", "for", "and"]);

function normalizeText(value = "") {
  return String(value).toLowerCase().trim();
}

function tokenize(value = "") {
  return normalizeText(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token && !STOP_WORDS.has(token));
}

function computeRelevance(room, keywords = []) {
  const haystack = [room.hotelName, room.location, ...(room.amenities || []), room.description || ""].join(" ").toLowerCase();
  return keywords.reduce((score, keyword) => (haystack.includes(keyword) ? score + 1 : score), 0);
}

async function getRecommendations({ userId, preferences = {}, limit = 6 }) {
  const rooms = await Room.find({ isActive: true }).lean();
  let bookings = [];

  if (userId) {
    bookings = await Booking.find({ userId, status: { $in: ["confirmed", "pending", "modified"] } }).populate("roomId").lean();
  }

  const historyKeywords = bookings
    .map((booking) => booking.roomId)
    .filter((room) => room && room.location)
    .flatMap((room) => [room.location, ...(room.amenities || [])]);

  const keywords = [...(preferences.keywords || []), ...historyKeywords].flatMap(tokenize);
  const maxBudget = Number(preferences.maxBudget || Infinity);
  const guests = Number(preferences.guests || 1);
  const minRating = Number(preferences.minRating || 0);
  const preferredAmenities = (preferences.amenities || []).map(normalizeText);

  return rooms
    .map((room) => {
      let score = 1;
      const reasons = [];

      if (room.basePricePerNight <= maxBudget) {
        score += 2;
        reasons.push("Within budget");
      }
      if (room.maxGuests >= guests) {
        score += 1.5;
        reasons.push("Guest capacity match");
      }
      if (Number(room.avgRating || 0) >= minRating) {
        score += 1;
        reasons.push("High guest rating");
      }

      const amenityMatches = preferredAmenities.filter((amenity) => (room.amenities || []).map(normalizeText).includes(amenity)).length;
      score += amenityMatches;
      if (amenityMatches > 0) reasons.push(`Amenity fit (${amenityMatches})`);

      const relevance = computeRelevance(room, keywords);
      score += relevance;
      if (relevance > 0) reasons.push("Matched your intent");

      return {
        ...room,
        recommendationScore: Number(score.toFixed(2)),
        recommendationReasons: reasons.length ? reasons : ["Recommended for you"],
      };
    })
    .sort((a, b) => b.recommendationScore - a.recommendationScore)
    .slice(0, Number(limit));
}

async function smartSearch({ query = "", guests, limit = 12 }) {
  const keywords = tokenize(query);
  const safeGuests = Number(guests || 1);
  const rooms = await Room.find({ isActive: true, maxGuests: { $gte: safeGuests } }).lean();

  return rooms
    .map((room) => ({ ...room, relevance: computeRelevance(room, keywords) }))
    .sort((a, b) => b.relevance - a.relevance || Number(b.avgRating || 0) - Number(a.avgRating || 0))
    .slice(0, Number(limit));
}

function buildPricingInsight(room, marketRooms = []) {
  const market = marketRooms.filter((item) => item._id.toString() !== room._id.toString());
  const avgMarketPrice = market.length
    ? market.reduce((sum, item) => sum + Number(item.basePricePerNight || 0), 0) / market.length
    : Number(room.basePricePerNight || 0);
  const delta = Number(room.basePricePerNight || 0) - avgMarketPrice;

  return {
    roomPrice: Number(room.basePricePerNight || 0),
    marketAverage: Number(avgMarketPrice.toFixed(2)),
    delta: Number(delta.toFixed(2)),
    recommendation: delta > 20 ? "Consider reducing price for higher occupancy." : delta < -20 ? "Price is competitive. Opportunity to increase slightly." : "Price is balanced with market.",
  };
}

async function summarizeReviews(roomId) {
  const reviews = await Review.find({ roomId }).sort({ createdAt: -1 }).limit(120).lean();
  const total = reviews.length;

  if (total === 0) {
    return {
      summary: "No guest reviews yet.",
      total,
      averageRating: 0,
      positives: [],
      concerns: [],
    };
  }

  const positives = ["clean", "friendly", "great", "excellent", "comfortable", "amazing", "location", "service"];
  const concerns = ["noise", "slow", "small", "dirty", "delay", "expensive", "crowded", "issue"];

  const corpus = reviews.map((review) => normalizeText(review.comment || ""));
  const countTokens = (tokens) =>
    tokens
      .map((token) => ({ token, count: corpus.reduce((sum, line) => (line.includes(token) ? sum + 1 : sum), 0) }))
      .filter((entry) => entry.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map((entry) => entry.token);

  const averageRating = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / total;
  const topPositives = countTokens(positives);
  const topConcerns = countTokens(concerns);

  return {
    summary: `Guests rate this stay ${averageRating.toFixed(1)}/5 based on ${total} reviews. Top positives: ${topPositives.join(", ") || "not enough data"}. Top concerns: ${topConcerns.join(", ") || "none reported"}.`,
    total,
    averageRating: Number(averageRating.toFixed(2)),
    positives: topPositives,
    concerns: topConcerns,
  };
}

async function buildDashboard({ userId }) {
  const [recentBookings, recentMessages, recentSearchBookings] = await Promise.all([
    Booking.find({ userId }).limit(5).populate("roomId").sort({ createdAt: -1 }).lean(),
    ChatMessage.find({ fromUserId: userId }).limit(5).sort({ createdAt: -1 }).lean(),
    Booking.find({ userId }).populate("roomId").sort({ createdAt: -1 }).limit(10).lean(),
  ]);

  const preferenceHints = recentSearchBookings.flatMap((booking) => [booking.roomId?.location, ...(booking.roomId?.amenities || [])].filter(Boolean));
  const recommended = await getRecommendations({ userId, preferences: { keywords: preferenceHints }, limit: 6 });

  return {
    recentBookings,
    recentMessages,
    recentSearches: preferenceHints.slice(0, 8),
    recommended,
  };
}

module.exports = {
  getRecommendations,
  smartSearch,
  buildPricingInsight,
  summarizeReviews,
  buildDashboard,
};
