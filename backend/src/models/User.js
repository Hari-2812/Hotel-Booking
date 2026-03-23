const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    avatar: { type: String, trim: true },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }],
    recentSearches: [{ type: String, trim: true, maxlength: 140 }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
