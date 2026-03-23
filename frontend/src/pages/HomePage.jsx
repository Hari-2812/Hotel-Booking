import { useContext, useEffect, useMemo, useState } from 'react';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/auth-context';
import ErrorBanner from '../components/ErrorBanner';
import { RoomCardSkeleton } from '../components/LoadingSkeleton';
import Pagination from '../components/Pagination';
import RoomCard from '../components/RoomCard';
import { api } from '../services/api';
import 'react-datepicker/dist/react-datepicker.css';

function toYmd(date) {
  return date ? format(date, 'yyyy-MM-dd') : undefined;
}

const defaultFilters = {
  location: '',
  minPrice: '',
  maxPrice: '',
  guests: 2,
  amenities: [],
  rating: '',
  sort: 'featured',
};

const amenityOptions = ['pool', 'spa', 'wifi', 'parking', 'breakfast', 'gym'];

export default function HomePage() {
  const { token } = useContext(AuthContext);
  const [filters, setFilters] = useState(defaultFilters);
  const [smartQuery, setSmartQuery] = useState('');
  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [page, setPage] = useState(1);
  const limit = 9;

  const [rooms, setRooms] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [smartResults, setSmartResults] = useState([]);
  const [smartLoading, setSmartLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadRooms() {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/api/rooms', {
          params: {
            ...filters,
            amenities: filters.amenities.join(','),
            checkIn: toYmd(checkIn),
            checkOut: toYmd(checkOut),
            page,
            limit,
          },
        });

        if (!active) return;
        setRooms(response.data.rooms || []);
        setTotal(response.data.total || 0);
      } catch (loadError) {
        if (!active) return;
        setError(loadError.message || 'Failed to load hotels');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadRooms();
    return () => {
      active = false;
    };
  }, [checkIn, checkOut, filters, page]);

  useEffect(() => {
    let active = true;
    async function loadRecommendations() {
      try {
        const response = await api.get('/api/ai/recommendations', {
          params: {
            location: filters.location || undefined,
            maxBudget: filters.maxPrice || undefined,
            guests: filters.guests,
            amenities: filters.amenities.join(','),
            minRating: filters.rating || undefined,
            query: smartQuery || undefined,
            limit: 4,
          },
          headers: token ? undefined : undefined,
        });
        if (active) setRecommendations(response.data.rooms || []);
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
      { label: 'AI-curated stays', value: `${recommendations.length || 4}+` },
      { label: 'Live availability', value: '24/7' },
      { label: 'Booking confidence', value: '99.9%' },
    ],
    [recommendations.length]
  );

  async function runSmartSearch(event) {
    event?.preventDefault();
    if (!smartQuery.trim()) return;

    setSmartLoading(true);
    setError('');
    try {
      const [resultsResponse] = await Promise.all([
        api.get('/api/ai/search', { params: { query: smartQuery, guests: filters.guests, limit: 6 } }),
        token ? api.post('/api/users/me/searches', { query: smartQuery }) : Promise.resolve(null),
      ]);
      setSmartResults(resultsResponse.data.rooms || []);
      toast.success('Smart search updated');
    } catch (searchError) {
      setError(searchError.message || 'Smart search failed');
    } finally {
      setSmartLoading(false);
    }
  }

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  }

  return (
    <>
      <Helmet>
        <title>StayBook AI | Smart hotel booking platform</title>
        <meta
          name="description"
          content="AI-powered hotel booking with natural-language search, live availability, secure payments, personalized dashboards, and admin analytics."
        />
      </Helmet>

      <div className="space-y-8">
        <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="glass-panel p-8 md:p-10">
            <p className="eyebrow">AI-powered hospitality</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl">
              Book curated stays with a concierge that understands intent, budget, and timing.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
              Discover hotels the way modern travelers search: “beachfront stay with pool under $180” — then compare live availability, pricing insights, and personalized recommendations.
            </p>

            <form onSubmit={runSmartSearch} className="mt-8 grid gap-4 rounded-[28px] border border-white/60 bg-white/80 p-4 shadow-soft md:grid-cols-[1fr_auto]">
              <input
                value={smartQuery}
                onChange={(event) => setSmartQuery(event.target.value)}
                className="input h-14 border-0 bg-transparent text-base shadow-none"
                placeholder="Try: cheap beach hotel with pool under $180"
              />
              <button type="submit" className="btn-primary h-14 px-6" disabled={smartLoading}>
                {smartLoading ? 'Analyzing...' : 'Run smart search'}
              </button>
            </form>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-3xl border border-white/60 bg-white/75 p-5 shadow-soft">
                  <p className="text-3xl font-semibold text-slate-950">{stat.value}</p>
                  <p className="mt-2 text-sm text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-6 md:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="eyebrow">Filters</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">Plan every detail</h2>
              </div>
              <button className="btn-secondary" onClick={() => { setFilters(defaultFilters); setCheckIn(null); setCheckOut(null); setPage(1); }}>
                Reset
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="label">Location</label>
                <input className="input mt-2" value={filters.location} onChange={(e) => updateFilter('location', e.target.value)} placeholder="Goa, Dubai, Bali..." />
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
                <label className="label">Min price</label>
                <input className="input mt-2" type="number" value={filters.minPrice} onChange={(e) => updateFilter('minPrice', e.target.value)} placeholder="80" />
              </div>
              <div>
                <label className="label">Max price</label>
                <input className="input mt-2" type="number" value={filters.maxPrice} onChange={(e) => updateFilter('maxPrice', e.target.value)} placeholder="240" />
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
                        onClick={() =>
                          updateFilter(
                            'amenities',
                            active ? filters.amenities.filter((item) => item !== amenity) : [...filters.amenities, amenity]
                          )
                        }
                        className={`badge transition ${active ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : ''}`}
                      >
                        {amenity}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {error && <ErrorBanner message={error} />}

        {smartResults.length > 0 && (
          <section className="space-y-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="eyebrow">Natural language search</p>
                <h2 className="text-2xl font-semibold text-slate-950">Smart search results</h2>
              </div>
              <p className="text-sm text-slate-500">Results tailored from your prompt: “{smartQuery}”.</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {smartResults.map((room) => (
                <RoomCard key={`smart-${room._id}`} room={room} />
              ))}
            </div>
          </section>
        )}

        <section className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow">AI recommendations</p>
              <h2 className="text-2xl font-semibold text-slate-950">Top matches for your trip</h2>
            </div>
            <p className="text-sm text-slate-500">Based on your filters, travel intent, and booking-ready inventory.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {recommendations.length === 0
              ? Array.from({ length: 4 }).map((_, index) => <RoomCardSkeleton key={`recommendation-${index}`} />)
              : recommendations.map((room) => <RoomCard key={`recommendation-${room._id}`} room={room} />)}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow">Live inventory</p>
              <h2 className="text-2xl font-semibold text-slate-950">Available hotels</h2>
            </div>
            <p className="text-sm text-slate-500">Updated with availability-aware search and guest-fit filtering.</p>
          </div>

          {loading ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <RoomCardSkeleton key={index} />
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <div className="glass-panel p-8 text-center text-slate-600">
              No hotels matched these filters. Try widening your budget or using Smart Search.
            </div>
          ) : (
            <>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {rooms.map((room) => (
                  <RoomCard key={room._id} room={room} />
                ))}
              </div>
              <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
            </>
          )}
        </section>
      </div>
    </>
  );
}
