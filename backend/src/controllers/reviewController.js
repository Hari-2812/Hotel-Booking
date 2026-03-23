const { asyncHandler } = require("../utils/asyncHandler");
const Review = require("../models/Review");
const Room = require("../models/Room");

const getReviewsForRoom = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);

  const skip = (page - 1) * limit;
  const [reviews, total] = await Promise.all([
    Review.find({ roomId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("rating comment userId createdAt"),
    Review.countDocuments({ roomId }),
  ]);

  res.json({ success: true, reviews, total, page, limit });
});

const createReview = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const { rating, comment } = req.body;

  // Basic existence check (and to avoid orphan reviews)
  const room = await Room.findById(roomId).lean();
  if (!room) return res.status(404).json({ success: false, error: "Room not found" });

  try {
    const review = await Review.create({
      userId: req.user.id,
      roomId,
      rating,
      comment,
    });

    // Update cached rating summary
    const agg = await Review.aggregate([
      { $match: { roomId: room._id } },
      { $group: { _id: "$roomId", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);
    const summary = agg[0] || { avg: 0, count: 0 };
    await Room.findByIdAndUpdate(room._id, { avgRating: summary.avg, ratingCount: summary.count });

    res.status(201).json({ success: true, review });
  } catch (e) {
    // Unique index violation -> duplicate review
    if (e && e.code === 11000) {
      return res.status(409).json({ success: false, error: "You already reviewed this room" });
    }
    throw e;
  }
});

module.exports = { getReviewsForRoom, createReview };

