const express = require("express");
const { body } = require("express-validator");

const { authMiddleware } = require("../middleware/authMiddleware");
const { validateRequest } = require("../middleware/validateRequest");
const { createStripeIntent, confirmStripePayment, stripeWebhook } = require("../controllers/paymentController");

const router = express.Router();

router.post(
  "/stripe/create-intent",
  authMiddleware,
  [
    body("roomId").isMongoId(),
    body("checkIn").isISO8601(),
    body("checkOut").isISO8601(),
    body("guests").isInt({ min: 1, max: 20 }).toInt(),
  ],
  validateRequest(),
  createStripeIntent
);

router.post(
  "/stripe/confirm",
  authMiddleware,
  [body("bookingId").isMongoId(), body("paymentIntentId").isString().trim().notEmpty()],
  validateRequest(),
  confirmStripePayment
);

// Stripe requires the raw request body to verify the signature.
router.post(
  "/stripe/webhook",
  stripeWebhook
);

module.exports = router;

