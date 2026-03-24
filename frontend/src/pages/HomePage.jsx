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

const amenityOptions = [
  "pool",
  "spa",
  "wifi",
  "parking",
  "breakfast",
  "gym",
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
    return () => (active = false);
  }, [filters, smartQuery, token]);

  const stats = useMemo(
    () => [
      { label: "AI-curated stays", value: `${recommendations.length || 4}+` },
      { label: "Live availability", value: "24/7" },
      { label: "Booking confidence", value: "99.9%" },
    ],
    [recommendations.length]
  );

  async function runSmartSearch(e) {
    e?.preventDefault();
    if (!smartQuery.trim()) return;

    setSmartLoading(true);
    setError("");

    try {
      const [res] = await Promise.all([
        api.get("/api/ai/search", {
          params: { query: smartQuery, guests: filters.guests, limit: 6 },
        }),
        token
          ? api.post("/api/users/me/searches", { query: smartQuery })
          : Promise.resolve(),
      ]);

      setSmartResults(res.data.rooms || []);
      toast.success("Smart search updated");
    } catch (err) {
      setError(err.message || "Smart search failed");
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
        <title>StayBook AI</title>
      </Helmet>

      <div className="home-container">
        {/* HERO */}
        <section className="hero">
          <h1>
            AI-powered hotel booking that understands your intent ✨
          </h1>

          <form onSubmit={runSmartSearch} className="smart-search">
            <input
              value={smartQuery}
              onChange={(e) => setSmartQuery(e.target.value)}
              placeholder="Try: beach hotel with pool under $180"
            />
            <button disabled={smartLoading}>
              {smartLoading ? "Analyzing..." : "Search"}
            </button>
          </form>

          <div className="stats">
            {stats.map((s) => (
              <div key={s.label} className="stat-card">
                <h3>{s.value}</h3>
                <p>{s.label}</p>
              </div>
            ))}
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

        {/* ROOMS */}
        {loading ? (
          <RoomCardSkeleton />
        ) : (
          <div className="grid">
            {rooms.map((r) => (
              <RoomCard key={r._id} room={r} />
            ))}
          </div>
        )}

        <Pagination
          page={page}
          total={total}
          limit={limit}
          onPageChange={setPage}
        />
      </div>
    </>
  );
}