const stripeLib = require("stripe");

const Booking = require("../models/Booking");
const { env } = require("../config/env");
const { asyncHandler } = require("../utils/asyncHandler");
const { sendBookingConfirmation } = require("../services/email");
const { buildBookingDraft } = require('./bookingController');

async function createStripePaymentIntent({ booking, amountCents }) {
  const stripe = stripeLib(env.STRIPE_SECRET_KEY);
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: env.STRIPE_CURRENCY,
    metadata: {
      bookingId: booking._id.toString(),
      userId: booking.userId.toString(),
      roomId: booking.roomId.toString(),
    },
    // For production: consider automatic_payment_methods with PaymentElement UI.
    automatic_payment_methods: { enabled: true },
  });
  return paymentIntent;
}

const createStripeIntent = asyncHandler(async (req, res) => {
  if (env.ENABLE_STRIPE === "false") {
    return res.status(501).json({ success: false, error: "Stripe disabled in server env" });
  }

  const { roomId, checkIn, checkOut, guests } = req.body;
  const draft = await buildBookingDraft({ userId: req.user.id, roomId, checkIn, checkOut, guests });
  if (draft.error) {
    return res.status(draft.error.status).json({ success: false, error: draft.error.message });
  }

  const booking = await Booking.create({
    ...draft.bookingPayload,
    status: "pending",
    paymentStatus: "processing",
  });

  const amountCents = Math.round(draft.pricing.total * 100);
  const paymentIntent = await createStripePaymentIntent({ booking, amountCents });

  booking.paymentIntentId = paymentIntent.id;
  await booking.save();

  res.json({
    success: true,
    bookingId: booking._id,
    clientSecret: paymentIntent.client_secret,
    amount: draft.pricing.total,
    currency: draft.room.currency,
  });
});

const confirmStripePayment = asyncHandler(async (req, res) => {
  if (env.ENABLE_STRIPE === "false") {
    return res.status(501).json({ success: false, error: "Stripe disabled in server env" });
  }

  const { bookingId, paymentIntentId } = req.body;
  const booking = await Booking.findById(bookingId);
  if (!booking) return res.status(404).json({ success: false, error: "Booking not found" });

  if (booking.userId.toString() !== req.user.id) return res.status(403).json({ success: false, error: "Forbidden" });

  const stripe = stripeLib(env.STRIPE_SECRET_KEY);
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (!intent || intent.status !== "succeeded") {
    return res.status(400).json({ success: false, error: "Payment not completed" });
  }

  // Idempotent update
  booking.paymentIntentId = paymentIntentId;
  booking.paymentStatus = "succeeded";
  booking.status = "confirmed";
  await booking.save();

  res.json({ success: true, booking });
});

const stripeWebhook = asyncHandler(async (req, res) => {
  if (env.ENABLE_STRIPE === "false") return res.status(501).json({ success: false });

  const sig = req.headers["stripe-signature"];
  let event;

  const stripe = stripeLib(env.STRIPE_SECRET_KEY);
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // payment_intent.succeeded is the main event we care about.
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

        const userEmail = booking.userId?.email;
        if (userEmail) {
          await sendBookingConfirmation({
            toEmail: userEmail,
            subject: "Your hotel booking is confirmed",
            text: `Hi ${booking.userId.name}, your booking for ${booking.roomId.hotelName} is confirmed from ${booking.checkIn.toDateString()} to ${booking.checkOut.toDateString()}.`,
          });
        }
      }
    }
  }

  res.json({ received: true });
});

module.exports = {
  createStripeIntent,
  confirmStripePayment,
  stripeWebhook,
};

