const Room = require("../models/Room");
const { asyncHandler } = require("../utils/asyncHandler");
const {
  buildDashboard,
  buildPricingInsight,
  getRecommendations,
  smartSearch,
} = require("../services/aiService");

// ✅ RECOMMENDATIONS
const recommendations = asyncHandler(async (req, res) => {
  const rooms = await getRecommendations({
    userId: req.user?.id,
    preferences: {
      location: req.query.location,
      maxBudget: req.query.maxBudget,
      guests: req.query.guests,
      amenities: req.query.amenities
        ? String(req.query.amenities).split(",")
        : [],
      minRating: req.query.minRating,
      keywords: req.query.query ? [req.query.query] : [],
    },
    limit: req.query.limit || 6,
  });

  res.json({ success: true, rooms });
});

// ✅ SMART SEARCH
const search = asyncHandler(async (req, res) => {
  const rooms = await smartSearch({
    query: req.query.query || "",
    guests: req.query.guests,
    limit: req.query.limit || 12,
  });

  res.json({ success: true, rooms });
});

// ✅ PRICING
const pricingInsights = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.roomId).lean();

  if (!room) {
    return res.status(404).json({
      success: false,
      error: "Room not found",
    });
  }

  const marketRooms = await Room.find({
    location: room.location,
    isActive: true,
  })
    .limit(10)
    .lean();

  const insight = buildPricingInsight(room, marketRooms);

  res.json({ success: true, insight });
});

// ✅ DASHBOARD
const dashboard = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
    });
  }

  const data = await buildDashboard({ userId: req.user.id });

  res.json({ success: true, ...data });
});

// ✅ EXPORT ALL (VERY IMPORTANT 🔥)
module.exports = {
  recommendations,
  search,
  pricingInsights,
  dashboard,
};