import { useEffect, useState } from "react";
import { api } from "../services/api";
import { RoomCardSkeleton } from "../components/LoadingSkeleton";
import RoomCard from "../components/RoomCard";
import ErrorBanner from "../components/ErrorBanner";

export default function WishlistPage() {
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState([]);
  const [error, setError] = useState("");

  async function fetchWishlist() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/users/me/wishlist");
      setWishlist(res.data.wishlist || []);
    } catch (e) {
      setError(e.message || "Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchWishlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function remove(roomId) {
    try {
      await api.delete(`/api/users/me/wishlist/${roomId}`);
      await fetchWishlist();
    } catch (e) {
      setError(e.message || "Remove failed");
    }
  }

  return (
    <div className="space-y-6">
      {error && <ErrorBanner message={error} />}
      <div className="card p-4">
        <h1 className="text-xl font-bold text-indigo-700">Wishlist</h1>
        <div className="mt-2 text-sm text-gray-600">{wishlist.length} saved rooms</div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <RoomCardSkeleton key={i} />
          ))}
        </div>
      ) : wishlist.length === 0 ? (
        <div className="card p-6 text-sm text-gray-600">
          No wishlist items yet. Save rooms from the room details page.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {wishlist.map((room) => (
            <div key={room._id} className="relative">
              <RoomCard room={room} />
              <button
                onClick={() => remove(room._id)}
                className="absolute right-3 top-3 rounded-md border border-red-200 bg-white/90 px-2 py-1 text-xs text-red-700 shadow-sm hover:bg-red-50"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

