import { useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import { AuthContext } from '../context/auth-context';
import ErrorBanner from '../components/ErrorBanner';
import { PageSkeleton } from '../components/LoadingSkeleton';
import RoomCard from '../components/RoomCard';
import { api } from '../services/api';
import { cancelMyBooking, getMyBookings, modifyMyBooking } from '../services/bookingService';

function BookingCard({ booking, onCancel, onModify }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    checkIn: booking.checkIn.slice(0, 10),
    checkOut: booking.checkOut.slice(0, 10),
    guests: booking.guests,
  });

  return (
    <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-soft">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-lg font-semibold text-slate-900">{booking.roomId?.hotelName || 'Booked stay'}</p>
          <p className="mt-1 text-sm text-slate-500">{booking.roomId?.location}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
            <span className="badge">{new Date(booking.checkIn).toLocaleDateString()} → {new Date(booking.checkOut).toLocaleDateString()}</span>
            <span className="badge">{booking.guests} guests</span>
            <span className="badge">Payment: {booking.paymentStatus}</span>
            <span className="badge">Status: {booking.status}</span>
          </div>
        </div>
        <div className="text-left lg:text-right">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Total</p>
          <p className="text-3xl font-semibold text-slate-950">${Number(booking.totalPrice || 0).toFixed(2)}</p>
        </div>
      </div>

      {editing && (
        <div className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-3">
          <input className="input" type="date" value={form.checkIn} onChange={(e) => setForm((current) => ({ ...current, checkIn: e.target.value }))} />
          <input className="input" type="date" value={form.checkOut} onChange={(e) => setForm((current) => ({ ...current, checkOut: e.target.value }))} />
          <input className="input" type="number" min="1" max={booking.roomId?.maxGuests || 20} value={form.guests} onChange={(e) => setForm((current) => ({ ...current, guests: Number(e.target.value) }))} />
          <div className="md:col-span-3 flex flex-wrap gap-3">
            <button className="btn-primary" onClick={() => onModify(booking._id, form).then(() => setEditing(false))}>Save changes</button>
            <button className="btn-secondary" onClick={() => setEditing(false)}>Close</button>
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        {booking.status !== 'cancelled' && (
          <button className="btn-secondary" onClick={() => setEditing((value) => !value)}>
            {editing ? 'Hide editor' : 'Modify booking'}
          </button>
        )}
        {booking.status !== 'cancelled' && (
          <button className="btn-danger" onClick={() => onCancel(booking._id)}>
            Cancel booking
          </button>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useContext(AuthContext);
  const [dashboard, setDashboard] = useState({ recentBookings: [], recentSearches: [], recommended: [] });
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadDashboard() {
    setLoading(true);
    setError('');
    try {
      const [dashboardResponse, bookingsResponse] = await Promise.all([
        api.get('/api/users/me/dashboard'),
        getMyBookings({ page: 1, limit: 10 }),
      ]);
      setDashboard(dashboardResponse.data);
      setBookings(bookingsResponse.bookings || []);
    } catch (loadError) {
      setError(loadError.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function handleCancel(bookingId) {
    try {
      await cancelMyBooking(bookingId);
      toast.success('Booking cancelled');
      await loadDashboard();
    } catch (cancelError) {
      setError(cancelError.message || 'Failed to cancel booking');
    }
  }

  async function handleModify(bookingId, payload) {
    try {
      await modifyMyBooking(bookingId, payload);
      toast.success('Booking updated');
      await loadDashboard();
    } catch (modifyError) {
      setError(modifyError.message || 'Failed to update booking');
    }
  }

  const metrics = useMemo(
    () => [
      { label: 'Active bookings', value: bookings.filter((booking) => booking.status !== 'cancelled').length },
      { label: 'Saved searches', value: dashboard.recentSearches?.length || 0 },
      { label: 'Recommendations', value: dashboard.recommended?.length || 0 },
    ],
    [bookings, dashboard]
  );

  if (loading) return <PageSkeleton />;

  return (
    <>
      <Helmet>
        <title>Dashboard | StayBook AI</title>
      </Helmet>
      <div className="space-y-8">
        <section className="glass-panel p-8 md:p-10">
          <p className="eyebrow">Personalized dashboard</p>
          <div className="mt-3 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-semibold text-slate-950">Welcome back, {user?.name}.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                Review your booking activity, revisit recent search intent, and explore AI-selected hotels aligned with your history.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {metrics.map((metric) => (
                <div key={metric.label} className="rounded-3xl border border-white/60 bg-white/70 px-5 py-4 text-center shadow-soft">
                  <p className="text-3xl font-semibold text-slate-950">{metric.value}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-400">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {error && <ErrorBanner message={error} />}

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <div className="glass-panel p-6">
              <p className="eyebrow">Recent search intent</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">What you searched for recently</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {(dashboard.recentSearches || []).length === 0 ? (
                  <p className="text-sm text-slate-500">Search activity will appear here after you use Smart Search.</p>
                ) : (
                  dashboard.recentSearches.map((item) => <span key={item} className="badge">{item}</span>)
                )}
              </div>
            </div>

            <div className="glass-panel p-6">
              <p className="eyebrow">AI recommendations</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">Suggested stays</h2>
              <div className="mt-5 grid gap-4">
                {(dashboard.recommended || []).length === 0 ? (
                  <p className="text-sm text-slate-500">Recommendations will update after you interact with rooms, bookings, or search prompts.</p>
                ) : (
                  dashboard.recommended.map((room) => <RoomCard key={room._id} room={room} />)
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <p className="eyebrow">Bookings</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">Manage reservations</h2>
            </div>
            {bookings.length === 0 ? (
              <div className="glass-panel p-8 text-center text-slate-600">You do not have any bookings yet. Start by exploring the discover page.</div>
            ) : (
              bookings.map((booking) => (
                <BookingCard key={booking._id} booking={booking} onCancel={handleCancel} onModify={handleModify} />
              ))
            )}
          </div>
        </section>
      </div>
    </>
  );
}
