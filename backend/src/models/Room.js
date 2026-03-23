const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    hotelName: { type: String, required: true, trim: true, maxlength: 120 },
    location: { type: String, required: true, trim: true, maxlength: 120 }, // e.g. "Goa" or "Indore"
    address: { type: String, trim: true, maxlength: 200 },
    description: { type: String, trim: true },

    images: [{ type: String }], // URLs
    amenities: [{ type: String }],

    basePricePerNight: { type: Number, required: true, min: 0 }, // in Stripe currency minor units conversion handled in payment
    currency: { type: String, default: "usd" },

    maxGuests: { type: Number, required: true, min: 1 },

    isActive: { type: Boolean, default: true },

    // Optional cached rating computed from Reviews
    avgRating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Speed up location searching
roomSchema.index({ location: "text" });

module.exports = mongoose.model("Room", roomSchema);

