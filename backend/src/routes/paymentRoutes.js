const express = require("express");
const { body } = require("express-validator");

const { authMiddleware } = require("../middleware/authMiddleware");
const { validateRequest } = require("../middleware/validateRequest");
const {
  createStripeIntent,
  confirmStripePayment,
  stripeWebhook,
  createRazorpayOrder,
  verifyRazorpayPayment,
} = require("../controllers/paymentController");

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

router.post(
  "/razorpay/create-order",
  authMiddleware,
  [
    body("roomId").isMongoId(),
    body("checkIn").isISO8601(),
    body("checkOut").isISO8601(),
    body("guests").isInt({ min: 1, max: 20 }).toInt(),
  ],
  validateRequest(),
  createRazorpayOrder
);

router.post(
  "/razorpay/verify",
  authMiddleware,
  [
    body("bookingId").isMongoId(),
    body("razorpay_order_id").isString().trim().notEmpty(),
    body("razorpay_payment_id").isString().trim().notEmpty(),
    body("razorpay_signature").isString().trim().notEmpty(),
  ],
  validateRequest(),
  verifyRazorpayPayment
);

router.post("/stripe/webhook", stripeWebhook);

module.exports = router;
