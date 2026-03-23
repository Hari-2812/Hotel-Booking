const express = require("express");
const { body, query } = require("express-validator");

const { authMiddleware } = require("../middleware/authMiddleware");
const { validateRequest } = require("../middleware/validateRequest");
const { sendMessage, getMessages } = require("../controllers/chatController");

const router = express.Router();

router.get(
  "/messages",
  [query("conversationId").optional().isString(), query("page").optional().isInt({ min: 1 }), query("limit").optional().isInt({ min: 1, max: 100 })],
  validateRequest(),
  getMessages
);

router.post(
  "/messages",
  authMiddleware,
  [body("message").isString().trim().isLength({ min: 1, max: 1200 }), body("conversationId").optional().isString()],
  validateRequest(),
  sendMessage
);

module.exports = router;

