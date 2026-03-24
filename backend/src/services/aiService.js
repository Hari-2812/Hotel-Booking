const ChatMessage = require('../models/ChatMessage');
const Booking = require('../models/Booking');
const Room = require('../models/Room');

const STOP_WORDS = new Set(['hotel', 'hotels', 'room', 'rooms', 'stay', 'with', 'near', 'in', 'the', 'a', 'an', 'for', 'and']);

function normalizeText(value = '') {
  return String(value).toLowerCase().trim();
}

// ------------------ SAFE RECOMMENDATIONS ------------------ //

async function getRecommendations({ userId, preferences = {}, limit = 6 }) {
  const rooms = await Room.find({ isActive: true }).lean();

  let bookings = [];

  // ✅ SAFE USER CHECK
  if (userId) {
    bookings = await Booking.find({
      userId,
      status: { $in: ['confirmed', 'pending'] },
    })
      .populate('roomId')
      .lean();
  }

  // ✅ FIX: avoid null roomId crash
  const historyKeywords = bookings
    .map((b) => b.roomId)
    .filter((room) => room && room.location)
    .flatMap((room) => [room.location, ...(room.amenities || [])]);

  const mergedPreferences = {
    ...preferences,
    keywords: [...(preferences.keywords || []), ...historyKeywords],
  };

  return rooms
    .map((room) => ({
      ...room,
      recommendationScore: 1,
      recommendationReasons: ['Recommended for you'],
    }))
    .slice(0, Number(limit));
}

// ------------------ SIMPLE SEARCH ------------------ //

async function smartSearch({ query, guests, limit = 12 }) {
  const rooms = await Room.find({ isActive: true }).lean();
  return rooms.slice(0, Number(limit));
}

// ------------------ DASHBOARD ------------------ //

async function buildDashboard({ userId }) {
  const [recentBookings, recentMessages] = await Promise.all([
    Booking.find({ userId }).limit(5).populate('roomId').lean(),
    ChatMessage.find({ fromUserId: userId }).limit(5).lean(),
  ]);

  return {
    recentBookings,
    recentSearches: [],
    recommended: [],
  };
}

module.exports = {
  getRecommendations,
  smartSearch,
  buildDashboard,
};