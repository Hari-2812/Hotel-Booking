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
import { confirmPayment, createBookingIntent, createRazorpayOrder, reserveBooking, verifyRazorpayPayment } from '../services/bookingService';

function StripeReservationSection({ room, checkIn, checkOut, guests, canSubmit, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  async function handlePayment() {
    if (!stripe || !elements) {
      toast.error('Stripe is still loading.');
      return;
    }
    setProcessing(true);
    try {
      const booking = await createBookingIntent({ roomId: room._id, checkIn, checkOut, guests });
      const card = elements.getElement(CardElement);
      const result = await stripe.confirmCardPayment(booking.clientSecret, { payment_method: { card } });
      if (result.error) throw new Error(result.error.message || 'Payment failed');
      await confirmPayment({ bookingId: booking.bookingId, paymentIntentId: result.paymentIntent.id });
      toast.success('Payment complete. Your booking is confirmed.');
      onSuccess({ id: booking.bookingId });
    } catch (error) {
      toast.error(error.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="mt-5 rounded-[28px] border border-slate-200 bg-slate-50 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Online payment</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Pay now with Stripe</h2>
        </div>
        <div className="badge badge-primary">Secure</div>
      </div>
      <div className="mt-5 rounded-3xl border border-slate-200 bg-white px-4 py-5 shadow-sm">
        <CardElement options={{ hidePostalCode: true }} />
      </div>
      <p className="mt-3 text-xs leading-6 text-slate-500">Your reservation is confirmed immediately after successful payment.</p>
      <button className="btn-primary mt-5 w-full" onClick={handlePayment} disabled={!canSubmit || processing}>
        {processing ? 'Processing payment...' : 'Pay now with Stripe'}
      </button>
    </div>
  );
}


function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
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
  const [reserveLoading, setReserveLoading] = useState(false);

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
  const canSubmit = Boolean(checkIn && checkOut && guests > 0 && nights > 0);
  const stripePromise = useMemo(() => {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    return publishableKey ? loadStripe(publishableKey) : null;
  }, []);
  const heroImage = room?.images?.[0] || 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80';


  async function handleRazorpayCheckout() {
    if (!canSubmit) {
      toast.error('Please select valid dates and guest count first.');
      return;
    }

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      toast.error('Razorpay SDK failed to load.');
      return;
    }

    try {
      const payload = { roomId: room._id, checkIn, checkOut, guests };
      const orderResponse = await createRazorpayOrder(payload);
      const options = {
        key: orderResponse.keyId,
        amount: orderResponse.order.amount,
        currency: orderResponse.order.currency,
        name: 'StayBook AI',
        description: `${room.hotelName} booking`,
        order_id: orderResponse.order.id,
        handler: async (payment) => {
          await verifyRazorpayPayment({ bookingId: orderResponse.bookingId, ...payment });
          toast.success('Razorpay payment complete. Booking confirmed.');
          navigate('/booking/confirmation', { state: { booking: { id: orderResponse.bookingId } } });
        },
      };
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (checkoutError) {
      toast.error(checkoutError.message || 'Failed to initialize Razorpay checkout');
    }
  }

  async function handleReservePayLater() {
    if (!canSubmit) {
      toast.error('Please select valid dates and guest count first.');
      return;
    }

    setReserveLoading(true);
    setError('');
    try {
      const response = await reserveBooking({ roomId: room._id, checkIn, checkOut, guests });
      toast.success('Reservation created successfully. You can pay at the hotel.');
      navigate('/booking/confirmation', { state: { booking: response?.booking } });
    } catch (reserveError) {
      setError(reserveError.message || 'Failed to reserve room');
    } finally {
      setReserveLoading(false);
    }
  }

  if (loading) return <div className="elevated-panel p-8 text-slate-500">Loading booking details...</div>;
  if (error) return <ErrorBanner message={error} />;
  if (!room) return <div className="elevated-panel p-8 text-slate-500">Room not found.</div>;

  return (
    <>
      <Helmet>
        <title>Book {room.hotelName} | StayBook AI</title>
      </Helmet>
      <div className="space-y-8">
        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="overflow-hidden rounded-[32px] border border-white/70 bg-white shadow-premium">
            <div className="relative h-[320px] overflow-hidden">
              <img src={heroImage} alt={room.hotelName} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-200">Premium stay</p>
                <h1 className="mt-3 text-4xl font-semibold">Book {room.hotelName}</h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-200">Finalize your dates below. We’ll re-check availability before the reservation is created.</p>
              </div>
            </div>

            <div className="grid gap-6 p-8 lg:grid-cols-[1fr_0.95fr]">
              <div>
                <h2 className="text-2xl font-semibold text-slate-950">Trip details</h2>
                <p className="mt-2 text-sm text-slate-500">Choose dates, guest count, and your preferred checkout flow.</p>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="label">Check-in</label>
                    <input className="input mt-2" type="date" min={format(new Date(), 'yyyy-MM-dd')} value={checkIn} onChange={(e) => { setCheckIn(e.target.value); if (checkOut && e.target.value >= checkOut) setCheckOut(''); }} />
                  </div>
                  <div>
                    <label className="label">Check-out</label>
                    <input className="input mt-2" type="date" min={checkIn || format(new Date(), 'yyyy-MM-dd')} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="label">Guests</label>
                    <input className="input mt-2" type="number" min="1" max={room.maxGuests} value={guests} onChange={(e) => setGuests(Number(e.target.value))} />
                    <p className="mt-2 text-xs text-slate-400">This room supports up to {room.maxGuests} guests.</p>
                  </div>
                </div>
                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  {[
                    { label: 'Flexible changes', text: 'Modify bookings from your dashboard.' },
                    { label: 'Live inventory', text: 'Availability is validated in real time.' },
                    { label: 'Guest-ready support', text: 'Reserve now or pay online instantly.' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-950">{item.label}</p>
                      <p className="mt-2 text-xs leading-6 text-slate-500">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Checkout options</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">Choose how to confirm</h2>
                <div className="mt-5 space-y-3 text-sm text-slate-600">
                  <div className="rounded-3xl bg-white p-4 shadow-sm">
                    <p className="font-semibold text-slate-950">Option 1 — Pay online</p>
                    <p className="mt-2 text-xs leading-6">Best for instant confirmation with card payment through Stripe.</p>
                  </div>
                  <div className="rounded-3xl bg-white p-4 shadow-sm">
                    <p className="font-semibold text-slate-950">Option 2 — Reserve now, pay later</p>
                    <p className="mt-2 text-xs leading-6">Ideal when Stripe is not configured or when you want payment at the hotel.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="elevated-panel p-8">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Reservation summary</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-950">{room.hotelName}</h2>
              <p className="mt-2 text-sm text-slate-500">{room.location}</p>
              <div className="mt-6 space-y-4 text-sm text-slate-600">
                <div className="flex items-center justify-between"><span>Nightly rate</span><span className="font-semibold text-slate-950">${room.basePricePerNight}</span></div>
                <div className="flex items-center justify-between"><span>Nights</span><span className="font-semibold text-slate-950">{nights}</span></div>
                <div className="flex items-center justify-between"><span>Guests</span><span className="font-semibold text-slate-950">{guests}</span></div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-950 px-4 py-4 text-white"><span>Total stay</span><span className="text-xl font-semibold">${Number(total || 0).toFixed(2)}</span></div>
              </div>

              {stripePromise ? (
                <Elements stripe={stripePromise}>
                  <StripeReservationSection room={room} checkIn={checkIn} checkOut={checkOut} guests={guests} canSubmit={canSubmit} onSuccess={(booking) => navigate('/booking/confirmation', { state: { booking } })} />
                </Elements>
              ) : (
                <div className="mt-5 rounded-3xl border border-dashed border-amber-300 bg-amber-50 px-4 py-4 text-sm text-amber-700">
                  Stripe is not configured right now, but guests can still complete reservations using the pay-later option below.
                </div>
              )}

              <button className="btn-primary mt-4 w-full" onClick={handleRazorpayCheckout} disabled={!canSubmit}>Pay with Razorpay</button>
              <button className="btn-secondary mt-4 w-full" onClick={handleReservePayLater} disabled={!canSubmit || reserveLoading}>
                {reserveLoading ? 'Creating reservation...' : 'Reserve now & pay at hotel'}
              </button>
              <p className="mt-4 text-xs leading-6 text-slate-400">You can cancel or modify active bookings from your dashboard after the reservation is created.</p>
            </div>

            <div className="elevated-panel p-6">
              <h3 className="text-lg font-semibold text-slate-950">Included at this stay</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {(room.amenities || []).length > 0
                  ? room.amenities.map((amenity) => <span key={amenity} className="badge">{amenity}</span>)
                  : <span className="text-sm text-slate-500">Amenities will be shared on confirmation.</span>}
              </div>
            </div>
          </aside>
        </section>
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
