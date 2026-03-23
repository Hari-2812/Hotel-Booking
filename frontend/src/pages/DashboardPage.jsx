import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { cancelMyBooking, getMyBookings } from "../services/bookingService";
import ErrorBanner from "../components/ErrorBanner";

export default function DashboardPage() {
  const { user } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await getMyBookings({ page, limit });
        if (!alive) return;
        setBookings(res.bookings || []);
        setTotal(res.total || 0);
      } catch (e) {
        if (!alive) return;
        setError(e.message || "Failed to load bookings");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [page, limit]);

  async function onCancel(bookingId) {
    try {
      await cancelMyBooking(bookingId);
      await toastlessUpdate();
    } catch (e) {
      setError(e.message || "Cancel failed");
    }
  }

  async function toastlessUpdate() {
    // Simple refresh without toast dependency on success.
    const res = await getMyBookings({ page, limit });
    setBookings(res.bookings || []);
    setTotal(res.total || 0);
  }

  return (
    <div className="space-y-6">
      <div className="card p-4">
        <h1 className="text-xl font-bold text-indigo-700">My Dashboard</h1>
        <div className="mt-2 text-sm text-gray-700">
          Signed in as <span className="font-semibold">{user?.name}</span> ({user?.email})
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      <div className="card p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">My bookings</h2>
          <div className="text-xs text-gray-500">{total} total</div>
        </div>

        {loading ? (
          <div className="mt-4 text-sm text-gray-600">Loading bookings...</div>
        ) : bookings.length === 0 ? (
          <div className="mt-4 text-sm text-gray-600">No bookings yet.</div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-600">
                  <th className="px-3 py-2">Room</th>
                  <th className="px-3 py-2">Dates</th>
                  <th className="px-3 py-2">Guests</th>
                  <th className="px-3 py-2">Total</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b._id} className="border-t">
                    <td className="px-3 py-3">
                      <div className="font-semibold text-gray-900">{b.roomId?.hotelName}</div>
                      <div className="text-xs text-gray-500">{b.roomId?.location}</div>
                    </td>
                    <td className="px-3 py-3">
                      {new Date(b.checkIn).toLocaleDateString()} - {new Date(b.checkOut).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-3">{b.guests}</td>
                    <td className="px-3 py-3 font-semibold text-indigo-700">${Number(b.totalPrice).toFixed(2)}</td>
                    <td className="px-3 py-3">
                      <span className="rounded-full border bg-white px-2 py-0.5 text-xs">{b.status}</span>
                    </td>
                    <td className="px-3 py-3">
                      {b.status !== "cancelled" ? (
                        <button
                          onClick={() => onCancel(b._id)}
                            className="btn-ghost px-3 py-1 text-xs"
                        >
                          Cancel
                        </button>
                      ) : (
                        <span className="text-xs text-gray-500">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

