const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    hotelName: { type: String, required: true, trim: true, maxlength: 120 },
    location: { type: String, required: true, trim: true, maxlength: 120 },
    address: { type: String, trim: true, maxlength: 200 },
    description: { type: String, trim: true },
    images: [{ type: String }],
    amenities: [{ type: String }],
    tags: [{ type: String, trim: true }],
    category: { type: String, trim: true, default: 'Hotel' },
    basePricePerNight: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'usd' },
    maxGuests: { type: Number, required: true, min: 1 },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    avgRating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

roomSchema.index({ location: 'text', hotelName: 'text', description: 'text', amenities: 'text', tags: 'text' });

module.exports = mongoose.model('Room', roomSchema);
