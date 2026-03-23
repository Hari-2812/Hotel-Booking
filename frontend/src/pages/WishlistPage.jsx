import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import ErrorBanner from '../components/ErrorBanner';
import { RoomCardSkeleton } from '../components/LoadingSkeleton';
import RoomCard from '../components/RoomCard';
import { api } from '../services/api';

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadWishlist() {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/users/me/wishlist');
      setWishlist(response.data.wishlist || []);
    } catch (loadError) {
      setError(loadError.message || 'Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWishlist();
  }, []);

  async function removeWishlistItem(roomId) {
    try {
      await api.delete(`/api/users/me/wishlist/${roomId}`);
      await loadWishlist();
    } catch (removeError) {
      setError(removeError.message || 'Failed to remove item');
    }
  }

  return (
    <>
      <Helmet>
        <title>Wishlist | StayBook AI</title>
      </Helmet>
      <div className="space-y-6">
        <section className="glass-panel p-8">
          <p className="eyebrow">Favorites</p>
          <h1 className="mt-3 text-4xl font-semibold text-slate-950">Your saved hotels</h1>
          <p className="mt-3 text-sm text-slate-600">Keep high-intent stays handy while you compare pricing, amenities, and availability.</p>
        </section>

        {error && <ErrorBanner message={error} />}

        {loading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => <RoomCardSkeleton key={index} />)}
          </div>
        ) : wishlist.length === 0 ? (
          <div className="glass-panel p-8 text-center text-slate-600">You have not saved any hotels yet.</div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {wishlist.map((room) => (
              <div key={room._id} className="relative">
                <RoomCard room={room} />
                <button className="absolute right-4 top-4 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 shadow-soft" onClick={() => removeWishlistItem(room._id)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
