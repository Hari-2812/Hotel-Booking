import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import ErrorBanner from '../components/ErrorBanner';
import { api } from '../services/api';

function StatTile({ label, value }) {
  return (
    <div className="rounded-3xl border border-white/60 bg-white/75 p-5 shadow-soft">
      <p className="text-3xl font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-400">{label}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState({ metrics: {}, series: [] });
  const [error, setError] = useState('');
  const [form, setForm] = useState({ hotelName: '', location: '', address: '', description: '', amenities: '', images: '', tags: '', basePricePerNight: 120, maxGuests: 2, isFeatured: true });

  async function loadAdminData() {
    setError('');
    try {
      const [roomsResponse, bookingsResponse, usersResponse, analyticsResponse] = await Promise.all([
        api.get('/api/admin/rooms', { params: { page: 1, limit: 50 } }),
        api.get('/api/admin/bookings', { params: { page: 1, limit: 50 } }),
        api.get('/api/admin/users', { params: { page: 1, limit: 50 } }),
        api.get('/api/admin/analytics'),
      ]);
      setRooms(roomsResponse.data.rooms || []);
      setBookings(bookingsResponse.data.bookings || []);
      setUsers(usersResponse.data.users || []);
      setAnalytics(analyticsResponse.data);
    } catch (loadError) {
      setError(loadError.message || 'Failed to load admin data');
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAdminData();
  }, []);

  async function createRoom(event) {
    event.preventDefault();
    try {
      await api.post('/api/rooms', form);
      toast.success('Room created');
      setForm({ hotelName: '', location: '', address: '', description: '', amenities: '', images: '', tags: '', basePricePerNight: 120, maxGuests: 2, isFeatured: true });
      await loadAdminData();
    } catch (createError) {
      setError(createError.message || 'Failed to create room');
    }
  }

  async function updateUserRole(userId, role) {
    try {
      await api.put(`/api/admin/users/${userId}/role`, { role });
      toast.success('User role updated');
      await loadAdminData();
    } catch (updateError) {
      setError(updateError.message || 'Failed to update role');
    }
  }

  const topMetrics = useMemo(() => analytics.metrics || {}, [analytics.metrics]);

  return (
    <>
      <Helmet>
        <title>Admin dashboard | StayBook AI</title>
      </Helmet>
      <div className="space-y-8">
        <section className="glass-panel p-8 md:p-10">
          <p className="eyebrow">Admin control center</p>
          <h1 className="mt-3 text-4xl font-semibold text-slate-950">Manage rooms, bookings, users, and revenue insights.</h1>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <StatTile label="Revenue" value={`$${Number(topMetrics.revenue || 0).toFixed(0)}`} />
            <StatTile label="Confirmed" value={topMetrics.confirmedBookings || 0} />
            <StatTile label="Pending" value={topMetrics.pendingBookings || 0} />
            <StatTile label="Rooms" value={topMetrics.roomsCount || 0} />
            <StatTile label="Users" value={topMetrics.usersCount || 0} />
          </div>
        </section>

        {error && <ErrorBanner message={error} />}

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <form className="glass-panel p-6" onSubmit={createRoom}>
            <p className="eyebrow">Inventory</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Add a new room</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {[
                ['hotelName', 'Hotel name'],
                ['location', 'Location'],
                ['address', 'Address'],
                ['description', 'Description'],
                ['amenities', 'Amenities (comma separated)'],
                ['images', 'Images (comma separated URLs)'],
                ['tags', 'Tags (comma separated)'],
              ].map(([key, label]) => (
                <div key={key} className={key === 'description' || key === 'images' ? 'md:col-span-2' : ''}>
                  <label className="label">{label}</label>
                  {key === 'description' ? (
                    <textarea className="input mt-2 min-h-28 resize-none" value={form[key]} onChange={(e) => setForm((current) => ({ ...current, [key]: e.target.value }))} />
                  ) : (
                    <input className="input mt-2" value={form[key]} onChange={(e) => setForm((current) => ({ ...current, [key]: e.target.value }))} />
                  )}
                </div>
              ))}
              <div>
                <label className="label">Base price</label>
                <input className="input mt-2" type="number" value={form.basePricePerNight} onChange={(e) => setForm((current) => ({ ...current, basePricePerNight: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="label">Max guests</label>
                <input className="input mt-2" type="number" value={form.maxGuests} onChange={(e) => setForm((current) => ({ ...current, maxGuests: Number(e.target.value) }))} />
              </div>
            </div>
            <button className="btn-primary mt-5">Create room</button>
          </form>

          <div className="glass-panel p-6">
            <p className="eyebrow">Revenue trend</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Bookings over time</h2>
            <div className="mt-6 space-y-3">
              {(analytics.series || []).length === 0 ? (
                <p className="text-sm text-slate-500">Booking trend data will populate as confirmed reservations come in.</p>
              ) : (
                analytics.series.map((point) => {
                  const width = Math.max(8, Math.min(100, (point.revenue / Math.max(...analytics.series.map((entry) => entry.revenue || 1))) * 100));
                  return (
                    <div key={point.date}>
                      <div className="mb-1 flex items-center justify-between text-sm text-slate-500">
                        <span>{point.date}</span>
                        <span>${Number(point.revenue || 0).toFixed(0)} • {point.count} bookings</span>
                      </div>
                      <div className="h-3 rounded-full bg-slate-100">
                        <div className="h-3 rounded-full bg-[linear-gradient(90deg,#0f172a,#6366f1)]" style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <div className="glass-panel p-6 xl:col-span-1">
            <h2 className="text-xl font-semibold text-slate-950">Users</h2>
            <div className="mt-5 space-y-3">
              {users.map((user) => (
                <div key={user._id} className="rounded-3xl border border-slate-100 bg-white/70 p-4 shadow-soft">
                  <p className="font-semibold text-slate-900">{user.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{user.email}</p>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="badge">{user.authProvider || 'local'}</span>
                    <select className="input max-w-32" value={user.role} onChange={(e) => updateUserRole(user._id, e.target.value)}>
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-panel p-6 xl:col-span-1">
            <h2 className="text-xl font-semibold text-slate-950">Bookings</h2>
            <div className="mt-5 space-y-3">
              {bookings.slice(0, 8).map((booking) => (
                <div key={booking._id} className="rounded-3xl border border-slate-100 bg-white/70 p-4 shadow-soft text-sm">
                  <p className="font-semibold text-slate-900">{booking.roomId?.hotelName}</p>
                  <p className="mt-1 text-slate-500">{booking.userId?.email}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="badge">{booking.status}</span>
                    <span className="badge">${Number(booking.totalPrice || 0).toFixed(0)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-panel p-6 xl:col-span-1">
            <h2 className="text-xl font-semibold text-slate-950">Rooms</h2>
            <div className="mt-5 space-y-3">
              {rooms.slice(0, 8).map((room) => (
                <div key={room._id} className="rounded-3xl border border-slate-100 bg-white/70 p-4 shadow-soft text-sm">
                  <p className="font-semibold text-slate-900">{room.hotelName}</p>
                  <p className="mt-1 text-slate-500">{room.location}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="badge">${room.basePricePerNight}/night</span>
                    <span className="badge">{room.maxGuests} guests</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
