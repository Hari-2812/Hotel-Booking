import { useContext, useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import toast from "react-hot-toast";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

import { api } from "../services/api";
import ErrorBanner from "../components/ErrorBanner";
import { AuthContext } from "../context/AuthContext";

export default function RoomDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useContext(AuthContext);

  const [room, setRoom] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeImage, setActiveImage] = useState(0);
  const images = useMemo(() => room?.images || [], [room]);

  const [wishlistIds, setWishlistIds] = useState([]);

  const googleKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: googleKey || "",
    libraries: [],
  });
  const [mapCenter, setMapCenter] = useState(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await api.get(`/api/rooms/${id}`);
        if (!alive) return;
        setRoom(res.data.room);
        setReviews(res.data.reviews || []);
      } catch (e) {
        if (!alive) return;
        setError(e.message || "Failed to load room details");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    let alive = true;
    async function loadWishlist() {
      if (!token) return;
      try {
        const res = await api.get("/api/users/me/wishlist");
        if (!alive) return;
        setWishlistIds((res.data.wishlist || []).map((r) => String(r._id)));
      } catch {
        if (!alive) return;
        setWishlistIds([]);
      }
    }
    loadWishlist();
    return () => {
      alive = false;
    };
  }, [token]);

  useEffect(() => {
    if (!googleKey || !room || !isLoaded) return;
    const geocoder = new window.google.maps.Geocoder();
    const addr = room.address || room.location;
    geocoder.geocode({ address: addr }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        const loc = results[0].geometry.location;
        setMapCenter({ lat: loc.lat(), lng: loc.lng() });
      }
    });
  }, [googleKey, room, isLoaded]);

  const isWishlisted = room && wishlistIds.includes(String(room._id));

  async function toggleWishlist() {
    if (!user) {
      toast.error("Please login to save favorites");
      navigate("/login");
      return;
    }
    try {
      if (isWishlisted) {
        await api.delete(`/api/users/me/wishlist/${room._id}`);
        toast.success("Removed from wishlist");
      } else {
        await api.post(`/api/users/me/wishlist`, { roomId: room._id });
        toast.success("Saved to wishlist");
      }
      const res = await api.get("/api/users/me/wishlist");
      setWishlistIds((res.data.wishlist || []).map((r) => String(r._id)));
    } catch (e) {
      toast.error(e.message || "Wishlist update failed");
    }
  }

  if (loading) return <div>Loading...</div>;
  if (error) return <ErrorBanner message={error} />;
  if (!room) return <div className="card p-6 text-sm text-gray-600">Room not found.</div>;

  return (
    <>
      <Helmet>
        <title>{room.hotelName} | StayBook</title>
        <meta name="description" content={room.description || room.hotelName} />
      </Helmet>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="relative h-72 w-full overflow-hidden bg-gray-100">
              {images[activeImage] ? (
                <img
                  src={images[activeImage]}
                  alt={room.hotelName}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-400">No image</div>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto p-3">
                {images.map((img, idx) => (
                  <button
                    key={img}
                    type="button"
                    className={`h-16 w-24 overflow-hidden rounded-lg border ${
                      idx === activeImage ? "border-indigo-500" : "border-gray-200"
                    }`}
                    onClick={() => setActiveImage(idx)}
                  >
                    <img src={img} alt={`${room.hotelName} ${idx + 1}`} className="h-full w-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 card p-4">
            <h1 className="text-2xl font-bold text-gray-900">{room.hotelName}</h1>
            <p className="mt-2 text-gray-700 leading-relaxed">{room.description}</p>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-700">
              <span className="badge badge-primary">{room.location}</span>
              <span>Up to {room.maxGuests} guests</span>
              {room.ratingCount > 0 && (
                <span>
                  {room.avgRating.toFixed(1)} ({room.ratingCount} reviews)
                </span>
              )}
            </div>

            {room.amenities?.length > 0 && (
              <div className="mt-4">
                <h2 className="text-sm font-semibold text-gray-800">Amenities</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {room.amenities.map((a) => (
                    <span key={a} className="badge">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="lg:col-span-1">
          <div className="sticky top-20 card p-4">
            <div className="text-sm text-gray-600">From</div>
            <div className="mt-1 text-3xl font-bold text-indigo-700">${room.basePricePerNight}</div>
            <div className="mt-1 text-sm text-gray-600">per night</div>

            <button
              onClick={() => navigate(`/rooms/${room._id}/book`)}
              className="mt-4 w-full rounded-md bg-indigo-700 px-4 py-2 text-white hover:bg-indigo-800"
            >
              Book this room
            </button>

            <button
              onClick={toggleWishlist}
              className={`mt-3 w-full rounded-md border px-4 py-2 text-sm font-semibold ${
                isWishlisted ? "border-indigo-200 bg-indigo-50 text-indigo-700" : "border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
              }`}
            >
              {isWishlisted ? "Saved to wishlist" : "Add to wishlist"}
            </button>

            <div className="mt-4 text-xs text-gray-500">
              Price shown is nightly. Total is calculated using your check-in/out dates.
            </div>
          </div>

          {googleKey && (
            <div className="mt-4 card p-4">
              <h2 className="text-sm font-semibold text-gray-800">Location</h2>
              <div className="mt-1 text-xs text-gray-500">Google Map (geocoded from address/location)</div>
              <div className="mt-3 h-56 w-full overflow-hidden rounded-lg bg-gray-50">
                {mapCenter && isLoaded ? (
                  <GoogleMap
                    mapContainerStyle={{ width: "100%", height: "100%" }}
                    center={mapCenter}
                    zoom={12}
                  >
                    <Marker position={mapCenter} />
                  </GoogleMap>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-gray-500 p-2">
                    Map loading...
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-4 card p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Reviews</h2>
              <Link to={`/rooms/${room._id}/reviews`} className="text-xs text-indigo-700 hover:underline">
                View more
              </Link>
            </div>

            {reviews.length === 0 ? (
              <div className="mt-3 text-sm text-gray-600">No reviews yet.</div>
            ) : (
              <div className="mt-3 space-y-3">
                {reviews.slice(0, 4).map((r) => (
                  <div key={r._id} className="rounded-lg border bg-white p-3">
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <div className="font-semibold text-gray-800">{r.rating}★</div>
                      <div>{new Date(r.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div className="mt-1 text-sm text-gray-700">{r.comment}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}

