const ChatMessage = require('../models/ChatMessage');
const { buildChatReply } = require('../services/aiService');
const { asyncHandler } = require('../utils/asyncHandler');

const sendMessage = asyncHandler(async (req, res) => {
  const { message, conversationId = 'support' } = req.body;

  const saved = await ChatMessage.create({
    conversationId,
    fromUserId: req.user.id,
    fromRole: req.user.role,
    message,
  });

  const aiReplyText = buildChatReply(message);
  const aiReply = await ChatMessage.create({
    conversationId,
    message: aiReplyText,
    fromRole: 'ai',
  });

  res.status(201).json({ success: true, message: saved, reply: aiReply });
});

const getMessages = asyncHandler(async (req, res) => {
  const conversationId = req.query.conversationId || 'support';
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 50);
  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    ChatMessage.find({ conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('fromUserId', 'name email role avatar')
      .lean(),
    ChatMessage.countDocuments({ conversationId }),
  ]);

  res.json({ success: true, messages: messages.reverse(), total, page, limit });
});

module.exports = { getMessages, sendMessage };
