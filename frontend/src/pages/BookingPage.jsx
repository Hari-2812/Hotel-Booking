import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams } from 'react-router-dom';
import { differenceInCalendarDays, format } from 'date-fns';
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import toast from 'react-hot-toast';
import RequireAuth from '../components/RequireAuth';
import ErrorBanner from '../components/ErrorBanner';
import { api } from '../services/api';
import { confirmPayment, createBookingIntent } from '../services/bookingService';

function CheckoutPanel({ room, checkIn, checkOut, guests, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  async function handlePayment() {
    if (!stripe || !elements) return;
    setProcessing(true);
    try {
      const booking = await createBookingIntent({ roomId: room._id, checkIn, checkOut, guests });
      const card = elements.getElement(CardElement);
      const result = await stripe.confirmCardPayment(booking.clientSecret, { payment_method: { card } });
      if (result.error) {
        throw new Error(result.error.message || 'Payment failed');
      }
      await confirmPayment({ bookingId: booking.bookingId, paymentIntentId: result.paymentIntent.id });
      toast.success('Booking confirmed');
      onSuccess();
    } catch (error) {
      toast.error(error.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <button className="btn-primary w-full" onClick={handlePayment} disabled={processing || !checkIn || !checkOut}>
      {processing ? 'Processing payment...' : 'Secure checkout'}
    </button>
  );
}

function BookingPageInner() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadRoom() {
      try {
        const response = await api.get(`/api/rooms/${id}`);
        if (!active) return;
        setRoom(response.data.room);
        setGuests(Math.min(response.data.room.maxGuests, 2));
      } catch (loadError) {
        if (active) setError(loadError.message || 'Failed to load room');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadRoom();
    return () => {
      active = false;
    };
  }, [id]);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const diff = differenceInCalendarDays(new Date(checkOut), new Date(checkIn));
    return diff > 0 ? diff : 0;
  }, [checkIn, checkOut]);

  const total = useMemo(() => Number(room?.basePricePerNight || 0) * nights, [room, nights]);
  const stripePromise = useMemo(() => {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    return publishableKey ? loadStripe(publishableKey) : null;
  }, []);

  if (loading) return <div className="glass-panel p-8 text-slate-500">Loading booking details...</div>;
  if (error) return <ErrorBanner message={error} />;
  if (!room) return <div className="glass-panel p-8 text-slate-500">Room not found.</div>;

  return (
    <>
      <Helmet>
        <title>Book {room.hotelName} | StayBook AI</title>
      </Helmet>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="glass-panel p-8">
          <p className="eyebrow">Secure checkout</p>
          <h1 className="mt-3 text-4xl font-semibold text-slate-950">Complete your stay at {room.hotelName}</h1>
          <p className="mt-3 text-sm text-slate-600">Availability is revalidated server-side before payment to prevent double-booking.</p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div>
              <label className="label">Check-in</label>
              <input className="input mt-2" type="date" min={format(new Date(), 'yyyy-MM-dd')} value={checkIn} onChange={(e) => { setCheckIn(e.target.value); if (checkOut && e.target.value >= checkOut) setCheckOut(''); }} />
            </div>
            <div>
              <label className="label">Check-out</label>
              <input className="input mt-2" type="date" min={checkIn || format(new Date(), 'yyyy-MM-dd')} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
            </div>
            <div>
              <label className="label">Guests</label>
              <input className="input mt-2" type="number" min="1" max={room.maxGuests} value={guests} onChange={(e) => setGuests(Number(e.target.value))} />
            </div>
          </div>

          <div className="mt-8 rounded-[28px] border border-white/60 bg-white/70 p-5 shadow-soft">
            <p className="text-sm font-semibold text-slate-900">Card details</p>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-5 shadow-inner">
              <CardElement options={{ hidePostalCode: true }} />
            </div>
          </div>
        </section>

        <aside className="glass-panel p-8">
          <div className="rounded-3xl bg-slate-950 p-6 text-white">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Booking summary</p>
            <h2 className="mt-3 text-2xl font-semibold">{room.hotelName}</h2>
            <p className="mt-2 text-sm text-slate-300">{room.location}</p>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between"><span>Nightly rate</span><span>${room.basePricePerNight}</span></div>
              <div className="flex items-center justify-between"><span>Nights</span><span>{nights}</span></div>
              <div className="flex items-center justify-between"><span>Guests</span><span>{guests}</span></div>
              <div className="flex items-center justify-between text-lg font-semibold"><span>Total</span><span>${Number(total || 0).toFixed(2)}</span></div>
            </div>
          </div>

          {!stripePromise ? (
            <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Set <code>VITE_STRIPE_PUBLISHABLE_KEY</code> to enable checkout.
            </div>
          ) : (
            <div className="mt-6">
              <Elements stripe={stripePromise}>
                <CheckoutPanel room={room} checkIn={checkIn} checkOut={checkOut} guests={guests} onSuccess={() => navigate('/dashboard')} />
              </Elements>
            </div>
          )}
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
