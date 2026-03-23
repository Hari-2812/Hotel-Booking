const Booking = require("../models/Booking");
const Room = require("../models/Room");
const { asyncHandler } = require("../utils/asyncHandler");

const getMyBookings = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    Booking.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("roomId", "hotelName location images maxGuests basePricePerNight avgRating ratingCount")
      .lean(),
    Booking.countDocuments({ userId: req.user.id }),
  ]);

  res.json({ success: true, bookings, total, page, limit });
});

const cancelBooking = asyncHandler(async (req, res) => {
  const bookingId = req.params.id;

  const booking = await Booking.findById(bookingId);
  if (!booking) return res.status(404).json({ success: false, error: "Booking not found" });
  if (booking.userId.toString() !== req.user.id) return res.status(403).json({ success: false, error: "Forbidden" });
  if (booking.status === "cancelled") return res.status(400).json({ success: false, error: "Already cancelled" });

  booking.status = "cancelled";
  booking.paymentStatus = booking.paymentStatus === "succeeded" ? "succeeded" : "failed";
  booking.cancelledAt = new Date();
  await booking.save();

  res.json({ success: true, booking });
});

// Admin can cancel bookings (and potentially trigger refunds later)
const adminCancelBooking = asyncHandler(async (req, res) => {
  const bookingId = req.params.id;
  const booking = await Booking.findById(bookingId);
  if (!booking) return res.status(404).json({ success: false, error: "Booking not found" });

  booking.status = "cancelled";
  booking.cancelledAt = new Date();
  if (booking.paymentStatus !== "succeeded") booking.paymentStatus = "failed";
  await booking.save();

  res.json({ success: true, booking });
});

module.exports = { getMyBookings, cancelBooking, adminCancelBooking };

