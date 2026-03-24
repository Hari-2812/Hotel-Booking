import { useContext, useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import { format } from "date-fns";
import { Helmet } from "react-helmet-async";
import toast from "react-hot-toast";
import { AuthContext } from "../context/auth-context";
import ErrorBanner from "../components/ErrorBanner";
import { RoomCardSkeleton } from "../components/LoadingSkeleton";
import Pagination from "../components/Pagination";
import RoomCard from "../components/RoomCard";
import VoiceSearchButton from "../components/VoiceSearchButton";
import { api } from "../services/api";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/home.css";

function toYmd(date) {
  return date ? format(date, "yyyy-MM-dd") : undefined;
}

const defaultFilters = {
  location: "",
  minPrice: "",
  maxPrice: "",
  guests: 2,
  amenities: [],
  rating: "",
  sort: "featured",
};

const amenityOptions = ['pool', 'spa', 'wifi', 'parking', 'breakfast', 'gym'];
const destinations = [
  { name: 'Beachfront escapes', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80' },
  { name: 'City luxury stays', image: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=900&q=80' },
  { name: 'Wellness retreats', image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80' },
];

export default function HomePage() {
  const { token } = useContext(AuthContext);

  const [filters, setFilters] = useState(defaultFilters);
  const [smartQuery, setSmartQuery] = useState("");
  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [page, setPage] = useState(1);
  const limit = 9;

  const [rooms, setRooms] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [smartResults, setSmartResults] = useState([]);
  const [smartLoading, setSmartLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadRooms() {
      setLoading(true);
      setError("");
      try {
        const response = await api.get("/api/rooms", {
          params: {
            ...filters,
            amenities: filters.amenities.join(","),
            checkIn: toYmd(checkIn),
            checkOut: toYmd(checkOut),
            page,
            limit,
          },
        });
        if (!active) return;
        setRooms(response.data.rooms || []);
        setTotal(response.data.total || 0);
      } catch (err) {
        if (!active) return;
        setError(err.message || "Failed to load hotels");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadRooms();
    return () => (active = false);
  }, [filters, checkIn, checkOut, page]);

  useEffect(() => {
    let active = true;
    async function loadRecommendations() {
      try {
        const res = await api.get("/api/ai/recommendations", {
          params: {
            location: filters.location || undefined,
            maxBudget: filters.maxPrice || undefined,
            guests: filters.guests,
            amenities: filters.amenities.join(","),
            minRating: filters.rating || undefined,
            query: smartQuery || undefined,
            limit: 4,
          },
        });
        if (active) setRecommendations(res.data.rooms || []);
      } catch {
        if (active) setRecommendations([]);
      }
    }

    loadRecommendations();
    return () => {
      active = false;
    };
  }, [filters, smartQuery, token]);

  const stats = useMemo(
    () => [
      { label: 'Luxury properties', value: `${total || 120}+` },
      { label: 'Real-time inventory', value: '24/7' },
      { label: 'Average response time', value: '< 2 min' },
    ],
    [total]
  );

  async function runSmartSearch(e) {
    e?.preventDefault();
    if (!smartQuery.trim()) return;

    setSmartLoading(true);
    setError("");

    try {
      const [resultsResponse] = await Promise.all([
        api.get("/api/ai/search", {
          params: { query: smartQuery, guests: filters.guests, limit: 6 },
        }),
        token
          ? api.post("/api/users/me/searches", { query: smartQuery })
          : Promise.resolve(),
      ]);
      setSmartResults(resultsResponse.data.rooms || []);
      toast.success('Smart search ready');
    } catch (searchError) {
      setError(searchError.message || 'Smart search failed');
    } finally {
      setSmartLoading(false);
    }
  }

  function updateFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }

  return (
    <>
      <Helmet>
        <title>StayBook | Professional hotel booking platform</title>
        <meta name="description" content="Professional hotel booking with premium UI, AI discovery, flexible reservations, and secure checkout flows." />
      </Helmet>

      <div className="space-y-10">
        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="overflow-hidden rounded-[36px] border border-white/70 bg-white shadow-premium">
            <div className="relative min-h-[520px] overflow-hidden px-8 py-10 md:px-12 md:py-12">
              <img
                src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=80"
                alt="Luxury hotel lobby"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(2,6,23,0.88),rgba(15,23,42,0.62),rgba(15,23,42,0.15))]" />
              <div className="relative z-10 max-w-3xl text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-200">Professional booking experience</p>
                <h1 className="mt-5 text-5xl font-semibold leading-tight md:text-6xl">Luxury stays, modern search, and booking that actually works.</h1>
                <p className="mt-5 max-w-2xl text-base leading-8 text-slate-200 md:text-lg">
                  Discover premium stays with smart search, polished design, real-time availability checks, and flexible checkout options including pay-now and reserve-now flows.
                </p>

                <form onSubmit={runSmartSearch} className="mt-8 grid gap-3 rounded-[28px] border border-white/10 bg-white/10 p-4 backdrop-blur md:grid-cols-[1fr_auto]">
                  <input
                    value={smartQuery}
                    onChange={(event) => setSmartQuery(event.target.value)}
                    className="input h-14 border-white/20 bg-white/90 text-base text-slate-900"
                    placeholder="Try: luxury hotel in Goa with spa and pool under $200"
                  />
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button type="submit" className="btn-primary h-14 px-6" disabled={smartLoading}>
                      {smartLoading ? 'Searching...' : 'Smart search'}
                    </button>
                    <VoiceSearchButton onResult={(spokenQuery) => setSmartQuery(spokenQuery)} disabled={smartLoading} />
                  </div>
                </form>

                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  {stats.map((item) => (
                    <div key={item.label} className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                      <p className="text-3xl font-semibold">{item.value}</p>
                      <p className="mt-2 text-sm text-slate-200">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="elevated-panel p-6 md:p-8">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="eyebrow">Trip planner</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">Refine your stay</h2>
                </div>
                <button className="btn-secondary" onClick={() => { setFilters(defaultFilters); setCheckIn(null); setCheckOut(null); setPage(1); }}>
                  Reset
                </button>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="label">Destination</label>
                  <input className="input mt-2" value={filters.location} onChange={(e) => updateFilter('location', e.target.value)} placeholder="Dubai, Goa, Bali, Maldives..." />
                </div>
                <div>
                  <label className="label">Check-in</label>
                  <DatePicker selected={checkIn} onChange={(date) => { setCheckIn(date); setCheckOut(null); setPage(1); }} minDate={new Date()} className="input mt-2" dateFormat="yyyy-MM-dd" />
                </div>
                <div>
                  <label className="label">Check-out</label>
                  <DatePicker selected={checkOut} onChange={(date) => { setCheckOut(date); setPage(1); }} minDate={checkIn || new Date()} className="input mt-2" dateFormat="yyyy-MM-dd" />
                </div>
                <div>
                  <label className="label">Budget from</label>
                  <input className="input mt-2" type="number" value={filters.minPrice} onChange={(e) => updateFilter('minPrice', e.target.value)} placeholder="80" />
                </div>
                <div>
                  <label className="label">Budget to</label>
                  <input className="input mt-2" type="number" value={filters.maxPrice} onChange={(e) => updateFilter('maxPrice', e.target.value)} placeholder="250" />
                </div>
                <div>
                  <label className="label">Guests</label>
                  <input className="input mt-2" type="number" min="1" max="20" value={filters.guests} onChange={(e) => updateFilter('guests', Number(e.target.value))} />
                </div>
                <div>
                  <label className="label">Minimum rating</label>
                  <select className="input mt-2" value={filters.rating} onChange={(e) => updateFilter('rating', e.target.value)}>
                    <option value="">Any rating</option>
                    <option value="4">4★ and above</option>
                    <option value="4.5">4.5★ and above</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="label">Sort by</label>
                  <select className="input mt-2" value={filters.sort} onChange={(e) => updateFilter('sort', e.target.value)}>
                    <option value="featured">Featured</option>
                    <option value="priceAsc">Price: Low to high</option>
                    <option value="priceDesc">Price: High to low</option>
                    <option value="rating">Best rated</option>
                    <option value="newest">Newest</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="label">Amenities</label>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {amenityOptions.map((amenity) => {
                      const active = filters.amenities.includes(amenity);
                      return (
                        <button
                          key={amenity}
                          type="button"
                          onClick={() => updateFilter('amenities', active ? filters.amenities.filter((item) => item !== amenity) : [...filters.amenities, amenity])}
                          className={`badge transition ${active ? 'border-sky-200 bg-sky-50 text-sky-700' : ''}`}
                        >
                          {amenity}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
              {destinations.map((destination) => (
                <div key={destination.name} className="overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-premium">
                  <div className="relative h-36 overflow-hidden">
                    <img src={destination.image} alt={destination.name} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
                    <p className="absolute bottom-4 left-4 text-lg font-semibold text-white">{destination.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FILTER */}
        <section className="filter-card">
          <input
            placeholder="Location"
            value={filters.location}
            onChange={(e) => updateFilter("location", e.target.value)}
          />

          <DatePicker
            selected={checkIn}
            onChange={(d) => setCheckIn(d)}
            placeholderText="Check-in"
          />

          <DatePicker
            selected={checkOut}
            onChange={(d) => setCheckOut(d)}
            placeholderText="Check-out"
          />
        </section>

        {error && <ErrorBanner message={error} />}

        {smartResults.length > 0 && (
          <section className="space-y-5">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="eyebrow">AI smart search</p>
                <h2 className="text-3xl font-semibold text-slate-950">Results from your prompt</h2>
              </div>
              <p className="text-sm text-slate-500">Prompt: “{smartQuery}”</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {smartResults.map((room) => <RoomCard key={`smart-${room._id}`} room={room} />)}
            </div>
          </section>
        )}

        <section className="space-y-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow">AI recommendations</p>
              <h2 className="text-3xl font-semibold text-slate-950">Professionally curated matches</h2>
            </div>
            <p className="text-sm text-slate-500">Ranked by budget fit, capacity, amenities, and guest signals.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {recommendations.length === 0
              ? Array.from({ length: 4 }).map((_, index) => <RoomCardSkeleton key={`recommendation-${index}`} />)
              : recommendations.map((room) => <RoomCard key={`recommendation-${room._id}`} room={room} />)}
          </div>
        </section>

        <section className="space-y-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow">Available stays</p>
              <h2 className="text-3xl font-semibold text-slate-950">Ready to book right now</h2>
            </div>
            <p className="text-sm text-slate-500">Live filtered inventory with better visuals and booking-ready property cards.</p>
          </div>

          {loading ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => <RoomCardSkeleton key={index} />)}
            </div>
          ) : rooms.length === 0 ? (
            <div className="elevated-panel p-10 text-center text-slate-600">No stays matched your filters. Try adjusting dates, budget, or amenities.</div>
          ) : (
            <>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {rooms.map((room) => <RoomCard key={room._id} room={room} />)}
              </div>
              <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
            </>
          )}
        </section>
      </div>
    </>
  );
}