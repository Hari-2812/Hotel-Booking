import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import ErrorBanner from '../components/ErrorBanner';
import { PageSkeleton } from '../components/LoadingSkeleton';
import RoomCard from '../components/RoomCard';
import { AuthContext } from '../context/auth-context';
import { api } from '../services/api';

export default function RoomDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [room, setRoom] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [insight, setInsight] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [wishlistIds, setWishlistIds] = useState([]);
  const [activeImage, setActiveImage] = useState(0);

  const loadDetails = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const roomResponse = await api.get(`/api/rooms/${id}`);
      const roomData = roomResponse.data.room;
      const [insightResponse, recommendationResponse] = await Promise.all([
        api.get(`/api/ai/pricing/${id}`),
        api.get('/api/ai/recommendations', { params: { location: roomData.location, maxBudget: roomData.basePricePerNight * 1.4, limit: 3 } }),
      ]);
      setRoom(roomData);
      setReviews(roomResponse.data.reviews || []);
      setInsight(insightResponse.data.insight);
      setRecommendations((recommendationResponse.data.rooms || []).filter((item) => item._id !== id));
    } catch (loadError) {
      setError(loadError.message || 'Failed to load room details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  useEffect(() => {
    let active = true;
    async function loadWishlist() {
      if (!user) return;
      try {
        const response = await api.get('/api/users/me/wishlist');
        if (active) setWishlistIds((response.data.wishlist || []).map((item) => String(item._id)));
      } catch {
        if (active) setWishlistIds([]);
      }
    }
    loadWishlist();
    return () => {
      active = false;
    };
  }, [user]);

  const gallery = useMemo(() => room?.images?.length ? room.images : ['https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80'], [room]);
  const isWishlisted = room && wishlistIds.includes(String(room._id));

  async function toggleWishlist() {
    if (!user) {
      toast.error('Please sign in to save favorites');
      navigate('/login');
      return;
    }

    try {
      if (isWishlisted) {
        await api.delete(`/api/users/me/wishlist/${room._id}`);
        toast.success('Removed from wishlist');
      } else {
        await api.post('/api/users/me/wishlist', { roomId: room._id });
        toast.success('Saved to wishlist');
      }
      const response = await api.get('/api/users/me/wishlist');
      setWishlistIds((response.data.wishlist || []).map((item) => String(item._id)));
    } catch (wishlistError) {
      toast.error(wishlistError.message || 'Wishlist update failed');
    }
  }

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorBanner message={error} />;
  if (!room) return <div className="glass-panel p-8 text-center text-slate-600">Hotel not found.</div>;

  return (
    <>
      <Helmet>
        <title>{room.hotelName} | StayBook AI</title>
      </Helmet>
      <div className="space-y-8">
        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div className="glass-panel overflow-hidden p-0">
              <div className="relative h-[420px] overflow-hidden bg-slate-100">
                <img src={gallery[activeImage]} alt={room.hotelName} className="h-full w-full object-cover" loading="lazy" />
              </div>
              <div className="grid grid-cols-4 gap-3 p-4">
                {gallery.slice(0, 4).map((image, index) => (
                  <button key={`${image}-${index}`} className={`overflow-hidden rounded-2xl border ${index === activeImage ? 'border-indigo-500' : 'border-transparent'}`} onClick={() => setActiveImage(index)}>
                    <img src={image} alt={`${room.hotelName} ${index + 1}`} className="h-24 w-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-panel p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">{room.category || 'Hotel'}</p>
                  <h1 className="mt-2 text-4xl font-semibold text-slate-950">{room.hotelName}</h1>
                  <p className="mt-3 text-sm text-slate-500">{room.location}{room.address ? ` • ${room.address}` : ''}</p>
                </div>
                {room.ratingCount > 0 && <div className="rounded-3xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">★ {Number(room.avgRating || 0).toFixed(1)} ({room.ratingCount} reviews)</div>}
              </div>
              <p className="mt-6 text-sm leading-7 text-slate-600">{room.description}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {(room.amenities || []).map((amenity) => <span key={amenity} className="badge">{amenity}</span>)}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-panel sticky top-24 p-8">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Starting at</p>
              <h2 className="mt-2 text-5xl font-semibold text-slate-950">${room.basePricePerNight}</h2>
              <p className="mt-2 text-sm text-slate-500">per night • accommodates up to {room.maxGuests} guests</p>

              <div className="mt-6 space-y-3">
                <button className="btn-primary w-full" onClick={() => navigate(`/rooms/${room._id}/book`)}>Book this stay</button>
                <button className="btn-secondary w-full" onClick={toggleWishlist}>{isWishlisted ? 'Saved to wishlist' : 'Add to wishlist'}</button>
              </div>

              {insight && (
                <div className="mt-6 rounded-3xl bg-slate-950 p-5 text-sm text-slate-100">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Dynamic pricing insight</p>
                  <p className="mt-3 leading-7">{insight.suggestion}</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white/10 p-3">
                      <p className="text-xs text-slate-400">Market average</p>
                      <p className="mt-1 text-xl font-semibold">${insight.marketAverage}</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-3">
                      <p className="text-xs text-slate-400">Best booking window</p>
                      <p className="mt-1 text-xl font-semibold">{insight.bestBookingWindow}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="glass-panel p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-950">Latest reviews</h2>
                <Link to={`/rooms/${room._id}/reviews`} className="text-sm font-semibold text-indigo-600">View all</Link>
              </div>
              <div className="mt-5 space-y-4">
                {reviews.length === 0 ? (
                  <p className="text-sm text-slate-500">No reviews yet.</p>
                ) : (
                  reviews.slice(0, 3).map((review) => (
                    <div key={review._id} className="rounded-3xl border border-slate-100 bg-white/70 p-4 shadow-soft">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-slate-900">★ {review.rating}</span>
                        <span className="text-slate-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-slate-600">{review.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        {recommendations.length > 0 && (
          <section className="space-y-4">
            <div>
              <p className="eyebrow">Similar stays</p>
              <h2 className="text-2xl font-semibold text-slate-950">AI-selected alternatives nearby</h2>
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {recommendations.map((item) => <RoomCard key={item._id} room={item} />)}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
