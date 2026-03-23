import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../services/api";
import ErrorBanner from "../components/ErrorBanner";

function AdminTabs({ tab, setTab }) {
  const tabs = ["Rooms", "Bookings", "Users", "Analytics"];
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => setTab(t)}
          className={`rounded-md border px-3 py-1.5 text-sm ${
            tab === t ? "border-indigo-600 bg-indigo-50 font-semibold text-indigo-700" : "bg-white"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [tab, setTab] = useState("Rooms");
  const [error, setError] = useState("");

  // Rooms
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [roomForm, setRoomForm] = useState({
    hotelName: "",
    location: "",
    address: "",
    description: "",
    images: "",
    amenities: "",
    basePricePerNight: 100,
    maxGuests: 2,
  });

  // Bookings
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // Users
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Analytics
  const [metrics, setMetrics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  async function fetchRooms() {
    setRoomsLoading(true);
    setError("");
    try {
      const res = await api.get("/api/admin/rooms", { params: { page: 1, limit: 50 } });
      setRooms(res.data.rooms || []);
    } catch (e) {
      setError(e.message || "Failed to load rooms");
    } finally {
      setRoomsLoading(false);
    }
  }

  async function fetchBookings() {
    setBookingsLoading(true);
    setError("");
    try {
      const res = await api.get("/api/admin/bookings", { params: { page: 1, limit: 50 } });
      setBookings(res.data.bookings || []);
    } catch (e) {
      setError(e.message || "Failed to load bookings");
    } finally {
      setBookingsLoading(false);
    }
  }

  async function fetchUsers() {
    setUsersLoading(true);
    setError("");
    try {
      const res = await api.get("/api/admin/users", { params: { page: 1, limit: 50 } });
      setUsers(res.data.users || []);
    } catch (e) {
      setError(e.message || "Failed to load users");
    } finally {
      setUsersLoading(false);
    }
  }

  async function onUpdateUserRole(userId, role) {
    setError("");
    try {
      await api.put(`/api/admin/users/${userId}/role`, { role });
      toast.success("User role updated");
      await fetchUsers();
    } catch (e) {
      setError(e.message || "Update role failed");
    }
  }

  async function onDeleteUser(userId) {
    setError("");
    if (!confirm("Delete this user? This cannot be undone.")) return;
    try {
      await api.delete(`/api/admin/users/${userId}`);
      toast.success("User deleted");
      await fetchUsers();
    } catch (e) {
      setError(e.message || "Delete user failed");
    }
  }

  async function fetchAnalytics() {
    setAnalyticsLoading(true);
    setError("");
    try {
      const res = await api.get("/api/admin/analytics");
      setMetrics(res.data.metrics || null);
    } catch (e) {
      setError(e.message || "Failed to load analytics");
    } finally {
      setAnalyticsLoading(false);
    }
  }

  useEffect(() => {
    fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tab === "Rooms") fetchRooms();
    if (tab === "Bookings") fetchBookings();
    if (tab === "Users") fetchUsers();
    if (tab === "Analytics") fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  function parseArrayInput(str) {
    return (str || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async function onCreateOrUpdate(roomId) {
    setError("");
    const payload = {
      ...roomForm,
      images: parseArrayInput(roomForm.images),
      amenities: parseArrayInput(roomForm.amenities),
      basePricePerNight: Number(roomForm.basePricePerNight),
      maxGuests: Number(roomForm.maxGuests),
    };

    try {
      if (roomId) {
        await api.put(`/api/rooms/${roomId}`, payload);
        toast.success("Room updated");
      } else {
        await api.post("/api/rooms", payload);
        toast.success("Room created");
      }
      await fetchRooms();
      setRoomForm({
        hotelName: "",
        location: "",
        address: "",
        description: "",
        images: "",
        amenities: "",
        basePricePerNight: 100,
        maxGuests: 2,
      });
    } catch (e) {
      setError(e.message || "Save failed");
    }
  }

  async function onDelete(roomId) {
    setError("");
    if (!confirm("Delete this room?")) return;
    try {
      await api.delete(`/api/rooms/${roomId}`);
      toast.success("Room deleted");
      await fetchRooms();
    } catch (e) {
      setError(e.message || "Delete failed");
    }
  }

  const [editingRoomId, setEditingRoomId] = useState(null);
  useEffect(() => {
    if (!editingRoomId) return;
    const r = rooms.find((x) => x._id === editingRoomId);
    if (!r) return;
    setRoomForm({
      hotelName: r.hotelName || "",
      location: r.location || "",
      address: r.address || "",
      description: r.description || "",
      images: (r.images || []).join(", "),
      amenities: (r.amenities || []).join(", "),
      basePricePerNight: r.basePricePerNight || 100,
      maxGuests: r.maxGuests || 2,
    });
  }, [editingRoomId, rooms]);

  return (
    <div className="space-y-6">
      <div className="card p-4">
        <h1 className="text-xl font-bold text-indigo-700">Admin Dashboard</h1>
        <div className="mt-2 text-sm text-gray-600">Manage rooms, bookings, users and analytics.</div>
        <div className="mt-4">
          <AdminTabs tab={tab} setTab={setTab} />
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      {tab === "Rooms" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-gray-800">Rooms</h2>
            {roomsLoading ? (
              <div className="mt-3 text-sm text-gray-600">Loading...</div>
            ) : rooms.length === 0 ? (
              <div className="mt-3 text-sm text-gray-600">No rooms found.</div>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs text-gray-600">
                      <th className="px-3 py-2">Hotel</th>
                      <th className="px-3 py-2">Location</th>
                      <th className="px-3 py-2">Price</th>
                      <th className="px-3 py-2">Guests</th>
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rooms.map((r) => (
                      <tr key={r._id} className="border-t">
                        <td className="px-3 py-3 font-semibold">{r.hotelName}</td>
                        <td className="px-3 py-3 text-gray-700">{r.location}</td>
                        <td className="px-3 py-3 text-indigo-700 font-semibold">${r.basePricePerNight}</td>
                        <td className="px-3 py-3">{r.maxGuests}</td>
                        <td className="px-3 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingRoomId(r._id)}
                              className="rounded-md border px-3 py-1 text-xs hover:bg-gray-50"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => onDelete(r._id)}
                              className="rounded-md border border-red-200 px-3 py-1 text-xs text-red-700 hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card p-4">
            <h2 className="text-sm font-semibold text-gray-800">{editingRoomId ? "Edit room" : "Create room"}</h2>

            <div className="mt-3 space-y-3 text-sm">
              <input
                className="input"
                placeholder="Hotel name"
                value={roomForm.hotelName}
                onChange={(e) => setRoomForm((s) => ({ ...s, hotelName: e.target.value }))}
              />
              <input
                className="input"
                placeholder="Location (e.g. Goa)"
                value={roomForm.location}
                onChange={(e) => setRoomForm((s) => ({ ...s, location: e.target.value }))}
              />
              <input
                className="input"
                placeholder="Address"
                value={roomForm.address}
                onChange={(e) => setRoomForm((s) => ({ ...s, address: e.target.value }))}
              />
              <textarea
                className="h-20 w-full resize-none input"
                placeholder="Description"
                value={roomForm.description}
                onChange={(e) => setRoomForm((s) => ({ ...s, description: e.target.value }))}
              />
              <input
                className="input"
                placeholder="Images URLs (comma separated)"
                value={roomForm.images}
                onChange={(e) => setRoomForm((s) => ({ ...s, images: e.target.value }))}
              />
              <input
                className="input"
                placeholder="Amenities (comma separated)"
                value={roomForm.amenities}
                onChange={(e) => setRoomForm((s) => ({ ...s, amenities: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  className="input"
                  placeholder="Base price per night"
                  value={roomForm.basePricePerNight}
                  onChange={(e) => setRoomForm((s) => ({ ...s, basePricePerNight: e.target.value }))}
                />
                <input
                  type="number"
                  className="input"
                  placeholder="Max guests"
                  value={roomForm.maxGuests}
                  onChange={(e) => setRoomForm((s) => ({ ...s, maxGuests: e.target.value }))}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => onCreateOrUpdate(editingRoomId)}
                  className="flex-1 btn-primary px-3 py-2"
                >
                  {editingRoomId ? "Update" : "Create"}
                </button>
                {editingRoomId && (
                  <button
                    onClick={() => {
                      setEditingRoomId(null);
                      setRoomForm({
                        hotelName: "",
                        location: "",
                        address: "",
                        description: "",
                        images: "",
                        amenities: "",
                        basePricePerNight: 100,
                        maxGuests: 2,
                      });
                    }}
                    className="rounded-md border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "Bookings" && (
        <div className="card p-4">
          <h2 className="text-sm font-semibold text-gray-800">Bookings</h2>
          {bookingsLoading ? (
            <div className="mt-3 text-sm text-gray-600">Loading...</div>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs text-gray-600">
                    <th className="px-3 py-2">User</th>
                    <th className="px-3 py-2">Room</th>
                    <th className="px-3 py-2">Dates</th>
                    <th className="px-3 py-2">Total</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b._id} className="border-t">
                      <td className="px-3 py-3">
                        <div className="font-semibold">{b.userId?.name}</div>
                        <div className="text-xs text-gray-500">{b.userId?.email}</div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-semibold">{b.roomId?.hotelName}</div>
                        <div className="text-xs text-gray-500">{b.roomId?.location}</div>
                      </td>
                      <td className="px-3 py-3 text-gray-700">
                        {new Date(b.checkIn).toLocaleDateString()} - {new Date(b.checkOut).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-3 font-semibold text-indigo-700">${Number(b.totalPrice).toFixed(2)}</td>
                      <td className="px-3 py-3">
                        <span className="rounded-full border bg-white px-2 py-0.5 text-xs">{b.status}</span>
                      </td>
                      <td className="px-3 py-3">
                        {b.status !== "cancelled" ? (
                          <button
                            onClick={async () => {
                              try {
                                await api.delete(`/api/admin/bookings/${b._id}`);
                                toast.success("Booking cancelled");
                                await fetchBookings();
                              } catch (e) {
                                toast.error(e.message || "Cancel failed");
                              }
                            }}
                            className="rounded-md border px-3 py-1 text-xs hover:bg-gray-50"
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
      )}

      {tab === "Users" && (
        <div className="card p-4">
          <h2 className="text-sm font-semibold text-gray-800">Users</h2>
          {usersLoading ? (
            <div className="mt-3 text-sm text-gray-600">Loading...</div>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs text-gray-600">
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Role</th>
                    <th className="px-3 py-2">Wishlist</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id} className="border-t">
                      <td className="px-3 py-3 font-semibold">{u.name}</td>
                      <td className="px-3 py-3 text-gray-700">{u.email}</td>
                      <td className="px-3 py-3">
                        <span className="rounded-full border bg-white px-2 py-0.5 text-xs">{u.role}</span>
                      </td>
                      <td className="px-3 py-3">{(u.wishlist || []).length || 0}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          <select
                            value={u.role}
                            onChange={(e) => onUpdateUserRole(u._id, e.target.value)}
                            className="rounded-md border bg-white px-2 py-1 text-xs"
                          >
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                          </select>
                          <button
                            onClick={() => onDeleteUser(u._id)}
                            className="rounded-md border border-red-200 px-3 py-1 text-xs text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "Analytics" && (
        <div className="card p-4">
          <h2 className="text-sm font-semibold text-gray-800">Admin analytics</h2>
          {analyticsLoading ? (
            <div className="mt-3 text-sm text-gray-600">Loading...</div>
          ) : !metrics ? (
            <div className="mt-3 text-sm text-gray-600">No analytics yet.</div>
          ) : (
            <div className="mt-3 grid gap-4 md:grid-cols-3">
              <div className="card p-4">
                <div className="text-xs text-gray-500">Confirmed bookings</div>
                <div className="mt-1 text-2xl font-bold text-indigo-700">{metrics.confirmedBookings}</div>
              </div>
              <div className="card p-4 md:col-span-2">
                <div className="text-xs text-gray-500">Revenue</div>
                <div className="mt-1 text-2xl font-bold text-indigo-700">${Number(metrics.revenue).toFixed(2)}</div>
                <div className="mt-1 text-xs text-gray-500">
                  From {new Date(metrics.from).toLocaleDateString()} to {new Date(metrics.to).toLocaleDateString()}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

