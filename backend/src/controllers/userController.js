const User = require("../models/User");
const Room = require("../models/Room");
const { asyncHandler } = require("../utils/asyncHandler");

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).lean();
  res.json({ success: true, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
});

const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("wishlist").lean();
  const rooms = await Room.find({ _id: { $in: user.wishlist }, isActive: true })
    .select("hotelName location images basePricePerNight maxGuests avgRating ratingCount")
    .lean();

  res.json({ success: true, wishlist: rooms });
});

const addToWishlist = asyncHandler(async (req, res) => {
  const { roomId } = req.body;
  const room = await Room.findById(roomId).lean();
  if (!room || !room.isActive) return res.status(404).json({ success: false, error: "Room not found" });

  const user = await User.findById(req.user.id);
  if (!user.wishlist.some((id) => id.toString() === roomId)) {
    user.wishlist.push(roomId);
    await user.save();
  }

  res.json({ success: true });
});

const removeFromWishlist = asyncHandler(async (req, res) => {
  const { roomId } = req.body;
  const user = await User.findById(req.user.id);
  user.wishlist = user.wishlist.filter((id) => id.toString() !== roomId);
  await user.save();
  res.json({ success: true });
});

module.exports = { getMe, getWishlist, addToWishlist, removeFromWishlist };

