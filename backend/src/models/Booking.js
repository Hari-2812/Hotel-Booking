const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
    checkIn: { type: Date, required: true, index: true },
    checkOut: { type: Date, required: true, index: true },
    guests: { type: Number, required: true, min: 1 },
    nightlyPrice: { type: Number, required: true, min: 0 },
    nights: { type: Number, required: true, min: 1 },
    totalPrice: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'usd' },
    paymentIntentId: { type: String, index: true, sparse: true },
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'modified'], default: 'pending', index: true },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'processing', 'succeeded', 'failed', 'refunded'],
      default: 'unpaid',
    },
    cancelledAt: { type: Date },
    modificationHistory: [
      {
        checkIn: Date,
        checkOut: Date,
        guests: Number,
        totalPrice: Number,
        modifiedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

bookingSchema.index(
  { roomId: 1, status: 1, checkIn: 1, checkOut: 1 },
  { name: 'room_status_date_overlap_idx' }
);

module.exports = mongoose.model('Booking', bookingSchema);
