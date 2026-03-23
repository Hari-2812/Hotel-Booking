const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    conversationId: { type: String, default: 'support', index: true },
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    message: { type: String, required: true, maxlength: 1200, trim: true },
    fromRole: { type: String, enum: ['user', 'admin', 'ai'], default: 'user' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
