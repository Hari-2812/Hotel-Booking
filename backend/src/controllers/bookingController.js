const Booking = require('../models/Booking');
const Room = require('../models/Room');
const { asyncHandler } = require('../utils/asyncHandler');
const { computePrice, findOverlappingBookings } = require('../services/availability');
const { sendBookingConfirmation } = require('../services/email');

async function buildBookingDraft({ userId, roomId, checkIn, checkOut, guests }) {
  const room = await Room.findById(roomId).lean();
  if (!room || !room.isActive) {
    return { error: { status: 404, message: 'Room not found' } };
  }

  const guestsNum = Number(guests);
  if (!Number.isFinite(guestsNum) || guestsNum < 1 || guestsNum > room.maxGuests) {
    return { error: { status: 400, message: 'Invalid guests count' } };
  }

  const overlapping = await findOverlappingBookings({
    roomIds: [room._id],
    checkIn: new Date(checkIn),
    checkOut: new Date(checkOut),
  });

  if (overlapping.length > 0) {
    return { error: { status: 409, message: 'Room is not available for selected dates' } };
  }

  const pricing = computePrice({
    nightlyPrice: room.basePricePerNight,
    checkIn,
    checkOut,
  });

  return {
    room,
    guestsNum,
    pricing,
    bookingPayload: {
      userId,
      roomId: room._id,
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      guests: guestsNum,
      nightlyPrice: pricing.nightlyPrice,
      nights: pricing.nights,
      totalPrice: pricing.total,
      currency: room.currency,
    },
  };
}

const createManualBooking = asyncHandler(async (req, res) => {
  const { roomId, checkIn, checkOut, guests } = req.body;
  const draft = await buildBookingDraft({ userId: req.user.id, roomId, checkIn, checkOut, guests });
  if (draft.error) {
    return res.status(draft.error.status).json({ success: false, error: draft.error.message });
  }

  const booking = await Booking.create({
    ...draft.bookingPayload,
    status: 'confirmed',
    paymentStatus: 'unpaid',
  });

  await sendBookingConfirmation({
    toEmail: req.user.email,
    subject: 'Your stay has been reserved',
    text: `Your reservation at ${draft.room.hotelName} is booked from ${new Date(checkIn).toDateString()} to ${new Date(checkOut).toDateString()}.`,
  });

  res.status(201).json({
    success: true,
    booking,
    room: {
      id: draft.room._id,
      hotelName: draft.room.hotelName,
      location: draft.room.location,
    },
    paymentMode: 'pay_at_hotel',
  });
});

const getMyBookings = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    Booking.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('roomId', 'hotelName location images maxGuests basePricePerNight avgRating ratingCount amenities')
      .lean(),
    Booking.countDocuments({ userId: req.user.id }),
  ]);

  res.json({ success: true, bookings, total, page, limit });
});

const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ success: false, error: 'Booking not found' });
  if (booking.userId.toString() !== req.user.id) return res.status(403).json({ success: false, error: 'Forbidden' });
  if (booking.status === 'cancelled') return res.status(400).json({ success: false, error: 'Already cancelled' });

  booking.status = 'cancelled';
  booking.paymentStatus = booking.paymentStatus === 'succeeded' ? 'refunded' : 'failed';
  booking.cancelledAt = new Date();
  await booking.save();

  res.json({ success: true, booking });
});

const modifyBooking = asyncHandler(async (req, res) => {
  const { checkIn, checkOut, guests } = req.body;
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ success: false, error: 'Booking not found' });
  if (booking.userId.toString() !== req.user.id) return res.status(403).json({ success: false, error: 'Forbidden' });
  if (booking.status === 'cancelled') return res.status(400).json({ success: false, error: 'Cancelled bookings cannot be modified' });

  const room = await Room.findById(booking.roomId).lean();
  if (!room) return res.status(404).json({ success: false, error: 'Room not found' });
  if (Number(guests) > Number(room.maxGuests)) {
    return res.status(400).json({ success: false, error: 'Guest count exceeds room capacity' });
  }

  const overlapping = await findOverlappingBookings({
    roomIds: [booking.roomId],
    checkIn: new Date(checkIn),
    checkOut: new Date(checkOut),
    excludeBookingId: booking._id,
  });
  if (overlapping.length > 0) {
    return res.status(409).json({ success: false, error: 'Selected dates are no longer available' });
  }

  booking.modificationHistory.push({
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    guests: booking.guests,
    totalPrice: booking.totalPrice,
  });

  const pricing = computePrice({ nightlyPrice: room.basePricePerNight, checkIn, checkOut });
  booking.checkIn = new Date(checkIn);
  booking.checkOut = new Date(checkOut);
  booking.guests = Number(guests);
  booking.nights = pricing.nights;
  booking.nightlyPrice = pricing.nightlyPrice;
  booking.totalPrice = pricing.total;
  booking.status = 'modified';
  await booking.save();

  res.json({ success: true, booking });
});

const adminCancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ success: false, error: 'Booking not found' });

  booking.status = 'cancelled';
  booking.cancelledAt = new Date();
  if (booking.paymentStatus !== 'succeeded') booking.paymentStatus = 'failed';
  await booking.save();

  res.json({ success: true, booking });
});

module.exports = { adminCancelBooking, cancelBooking, createManualBooking, getMyBookings, modifyBooking, buildBookingDraft };
