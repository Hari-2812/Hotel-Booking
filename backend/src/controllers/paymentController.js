const crypto = require("crypto");
const stripeLib = require("stripe");
const Razorpay = require("razorpay");

const Booking = require("../models/Booking");
const { env } = require("../config/env");
const { asyncHandler } = require("../utils/asyncHandler");
const { sendBookingConfirmation } = require("../services/email");
const { buildBookingDraft } = require("./bookingController");

async function createStripePaymentIntent({ booking, amountCents }) {
  const stripe = stripeLib(env.STRIPE_SECRET_KEY);
  return stripe.paymentIntents.create({
    amount: amountCents,
    currency: env.STRIPE_CURRENCY,
    metadata: {
      bookingId: booking._id.toString(),
      userId: booking.userId.toString(),
      roomId: booking.roomId.toString(),
    },
    automatic_payment_methods: { enabled: true },
  });
}

const createStripeIntent = asyncHandler(async (req, res) => {
  if (env.ENABLE_STRIPE === "false") {
    return res.status(501).json({ success: false, error: "Stripe disabled in server env" });
  }

  const { roomId, checkIn, checkOut, guests } = req.body;
  const draft = await buildBookingDraft({ userId: req.user.id, roomId, checkIn, checkOut, guests });
  if (draft.error) return res.status(draft.error.status).json({ success: false, error: draft.error.message });

  const booking = await Booking.create({ ...draft.bookingPayload, status: "pending", paymentStatus: "processing" });
  const paymentIntent = await createStripePaymentIntent({ booking, amountCents: Math.round(draft.pricing.total * 100) });

  booking.paymentIntentId = paymentIntent.id;
  await booking.save();

  res.json({
    success: true,
    provider: "stripe",
    bookingId: booking._id,
    clientSecret: paymentIntent.client_secret,
    amount: draft.pricing.total,
    currency: draft.room.currency,
  });
});

const confirmStripePayment = asyncHandler(async (req, res) => {
  if (env.ENABLE_STRIPE === "false") return res.status(501).json({ success: false, error: "Stripe disabled in server env" });

  const { bookingId, paymentIntentId } = req.body;
  const booking = await Booking.findById(bookingId);
  if (!booking) return res.status(404).json({ success: false, error: "Booking not found" });
  if (booking.userId.toString() !== req.user.id) return res.status(403).json({ success: false, error: "Forbidden" });

  const stripe = stripeLib(env.STRIPE_SECRET_KEY);
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (!intent || intent.status !== "succeeded") return res.status(400).json({ success: false, error: "Payment not completed" });

  booking.paymentIntentId = paymentIntentId;
  booking.paymentStatus = "succeeded";
  booking.status = "confirmed";
  await booking.save();

  res.json({ success: true, booking });
});

const stripeWebhook = asyncHandler(async (req, res) => {
  if (env.ENABLE_STRIPE === "false") return res.status(501).json({ success: false });

  const sig = req.headers["stripe-signature"];
  const stripe = stripeLib(env.STRIPE_SECRET_KEY);

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object;
    const bookingId = intent.metadata?.bookingId;
    if (bookingId) {
      const booking = await Booking.findById(bookingId).populate("userId roomId");
      if (booking) {
        booking.paymentStatus = "succeeded";
        booking.status = "confirmed";
        booking.paymentIntentId = intent.id;
        await booking.save();

        if (booking.userId?.email) {
          await sendBookingConfirmation({
            toEmail: booking.userId.email,
            subject: "Your hotel booking is confirmed",
            text: `Hi ${booking.userId.name}, your booking for ${booking.roomId.hotelName} is confirmed from ${booking.checkIn.toDateString()} to ${booking.checkOut.toDateString()}.`,
          });
        }
      }
    }
  }

  res.json({ received: true });
});

function getRazorpayClient() {
  return new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET });
}

const createRazorpayOrder = asyncHandler(async (req, res) => {
  if (env.ENABLE_RAZORPAY === "false") {
    return res.status(501).json({ success: false, error: "Razorpay disabled in server env" });
  }

  const { roomId, checkIn, checkOut, guests } = req.body;
  const draft = await buildBookingDraft({ userId: req.user.id, roomId, checkIn, checkOut, guests });
  if (draft.error) return res.status(draft.error.status).json({ success: false, error: draft.error.message });

  const booking = await Booking.create({ ...draft.bookingPayload, status: "pending", paymentStatus: "processing" });
  const order = await getRazorpayClient().orders.create({
    amount: Math.round(draft.pricing.total * 100),
    currency: (draft.room.currency || "INR").toUpperCase(),
    receipt: `booking_${booking._id}`,
    notes: { bookingId: booking._id.toString(), roomId: booking.roomId.toString(), userId: req.user.id },
  });

  booking.paymentIntentId = order.id;
  await booking.save();

  res.json({
    success: true,
    provider: "razorpay",
    bookingId: booking._id,
    amount: draft.pricing.total,
    currency: draft.room.currency,
    order,
    keyId: env.RAZORPAY_KEY_ID,
  });
});

const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  if (env.ENABLE_RAZORPAY === "false") {
    return res.status(501).json({ success: false, error: "Razorpay disabled in server env" });
  }

  const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const booking = await Booking.findById(bookingId);
  if (!booking) return res.status(404).json({ success: false, error: "Booking not found" });
  if (booking.userId.toString() !== req.user.id) return res.status(403).json({ success: false, error: "Forbidden" });

  const digest = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (digest !== razorpay_signature) {
    return res.status(400).json({ success: false, error: "Invalid payment signature" });
  }

  booking.paymentIntentId = razorpay_order_id;
  booking.paymentStatus = "succeeded";
  booking.status = "confirmed";
  await booking.save();

  res.json({ success: true, booking });
});

module.exports = {
  createStripeIntent,
  confirmStripePayment,
  stripeWebhook,
  createRazorpayOrder,
  verifyRazorpayPayment,
};
