import { useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import { differenceInCalendarDays, format } from "date-fns";
import { Helmet } from "react-helmet-async";
import { useParams, useNavigate } from "react-router-dom";
import { Elements, CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import toast from "react-hot-toast";

import { api } from "../services/api";
import RequireAuth from "../components/RequireAuth";
import { createBookingIntent, confirmPayment } from "../services/bookingService";

import "react-datepicker/dist/react-datepicker.css";

function CheckoutForm({ room, checkIn, checkOut, guests, onDone }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  async function handlePay() {
    if (!stripe || !elements) {
      toast.error("Stripe is still loading");
      return;
    }

    const card = elements.getElement(CardElement);
    if (!card) {
      toast.error("Card input missing");
      return;
    }

    setProcessing(true);
    try {
      const { bookingId, clientSecret } = (await createBookingIntent({
        roomId: room._id,
        checkIn,
        checkOut,
        guests,
      })) || {};

      if (!bookingId || !clientSecret) throw new Error("Failed to create booking intent");

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card },
      });

      if (result.error) {
        throw new Error(result.error.message || "Payment failed");
      }

      const paymentIntentId = result?.paymentIntent?.id;
      if (paymentIntentId) {
        await confirmPayment({ bookingId, paymentIntentId });
      }

      toast.success("Booking confirmed!");
      onDone?.(bookingId);
    } catch (e) {
      toast.error(e.message || "Payment failed");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <button
      onClick={handlePay}
      disabled={processing || !checkIn || !checkOut}
      className="w-full rounded-md bg-indigo-700 px-4 py-2 text-white hover:bg-indigo-800 disabled:opacity-60"
    >
      {processing ? "Processing..." : `Pay & Confirm`}
    </button>
  );
}

function BookingPageInner() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [error, setError] = useState("");

  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [guests, setGuests] = useState(2);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        setLoadingRoom(true);
        setError("");
        const res = await api.get(`/api/rooms/${id}`);
        if (!alive) return;
        setRoom(res.data.room);
      } catch (e) {
        if (!alive) return;
        setError(e.message || "Failed to load room");
      } finally {
        if (!alive) return;
        setLoadingRoom(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [id]);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const diff = differenceInCalendarDays(checkOut, checkIn);
    return diff > 0 ? diff : 0;
  }, [checkIn, checkOut]);

  const total = useMemo(() => {
    if (!room || nights <= 0) return 0;
    return Number(room.basePricePerNight) * nights;
  }, [room, nights]);

  const stripePromise = useMemo(() => {
    const pk = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!pk) return null;
    return loadStripe(pk);
  }, []);

  if (loadingRoom) return <div className="py-6">Loading...</div>;
  if (error) return <div className="py-6 text-sm text-red-700">{error}</div>;
  if (!room) return <div className="py-6 text-sm text-gray-600">Room not found</div>;

  if (!stripePromise) {
    return (
      <div className="card p-6 text-sm text-gray-700">
        Stripe publishable key is missing from frontend env (`VITE_STRIPE_PUBLISHABLE_KEY`).
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Book {room.hotelName} | StayBook</title>
        <meta name="description" content={`Book ${room.hotelName}`} />
      </Helmet>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 card p-4">
          <h1 className="text-xl font-bold text-gray-900">{room.hotelName}</h1>
          <p className="mt-1 text-sm text-gray-600">{room.location}</p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="label mb-1">Check-in</label>
              <DatePicker
                selected={checkIn}
                onChange={(d) => {
                  setCheckIn(d);
                  setCheckOut(null);
                }}
                minDate={new Date()}
                dateFormat="yyyy-MM-dd"
                className="input"
              />
            </div>
            <div>
              <label className="label mb-1">Check-out</label>
              <DatePicker
                selected={checkOut}
                onChange={(d) => setCheckOut(d)}
                minDate={checkIn || new Date()}
                dateFormat="yyyy-MM-dd"
                className="input"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="label mb-1">Guests</label>
            <input
              type="number"
              min={1}
              max={room.maxGuests}
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="input"
            />
            <div className="mt-1 text-xs text-gray-500">Max {room.maxGuests} guests</div>
          </div>

          <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="flex items-center justify-between text-sm">
              <span>
                {checkIn ? format(checkIn, "yyyy-MM-dd") : "—"} to {checkOut ? format(checkOut, "yyyy-MM-dd") : "—"}
              </span>
              <span>{nights ? `${nights} nights` : "Select dates"}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm font-semibold">
              <span>Total</span>
              <span className="text-indigo-700">${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-5">
            <h2 className="text-sm font-semibold">Payment</h2>
            <div className="mt-2 rounded-md border border-gray-200 bg-white p-3">
              <CardElement options={{ hidePostalCode: true }} />
            </div>
            <div className="mt-3 text-xs text-gray-500">
              Payment is processed securely via Stripe. Booking is confirmed after payment success.
            </div>
          </div>

          <div className="mt-4">
            <Elements stripe={stripePromise}>
              <CheckoutForm
                room={room}
                checkIn={checkIn ? format(checkIn, "yyyy-MM-dd") : null}
                checkOut={checkOut ? format(checkOut, "yyyy-MM-dd") : null}
                guests={guests}
                onDone={() => navigate("/dashboard")}
              />
            </Elements>
          </div>
        </section>

        <aside className="card p-4">
          <div className="text-sm font-semibold text-gray-800">What you get</div>
          <ul className="mt-2 space-y-2 text-sm text-gray-700">
            <li>• {room.maxGuests} guest capacity</li>
            <li>• Flexible booking cancellation (up to you)</li>
            <li>• Email confirmation after payment</li>
          </ul>
          <div className="mt-4 text-xs text-gray-500">
            Note: Availability is re-checked on the server to prevent double booking.
          </div>
        </aside>
      </div>
    </>
  );
}

export default function BookingPage() {
  return (
    <RequireAuth>
      <BookingPageInner />
    </RequireAuth>
  );
}

