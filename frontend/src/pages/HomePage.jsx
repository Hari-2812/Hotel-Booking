import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import { format } from "date-fns";
import { io } from "socket.io-client";
import { Helmet } from "react-helmet-async";

import { api } from "../services/api";
import RoomCard from "../components/RoomCard";
import Pagination from "../components/Pagination";
import { RoomCardSkeleton } from "../components/LoadingSkeleton";
import ErrorBanner from "../components/ErrorBanner";

import "../styles/home.css";
import "react-datepicker/dist/react-datepicker.css";

function toYmd(date) {
  return format(date, "yyyy-MM-dd");
}

export default function HomePage() {
  const [location, setLocation] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [guests, setGuests] = useState(2);

  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);

  const [page, setPage] = useState(1);
  const limit = 12;

  const [rooms, setRooms] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ API FETCH (FIXED DEPENDENCY)
  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const res = await api.get("/api/rooms", {
          params: {
            page,
            limit,
            location: location || undefined,
            minPrice: minPrice ? Number(minPrice) : undefined,
            maxPrice: maxPrice ? Number(maxPrice) : undefined,
            guests,
            checkIn: checkIn ? toYmd(checkIn) : undefined,
            checkOut: checkOut ? toYmd(checkOut) : undefined,
          },
        });

        if (!alive) return;

        setRooms(res.data.rooms);
        setTotal(res.data.total);
      } catch (e) {
        if (!alive) return;
        setError(e.response?.data?.error || e.message || "Failed to load rooms");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    load();
    return () => (alive = false);
  }, [location, minPrice, maxPrice, guests, checkIn, checkOut, page]);

  // ✅ SOCKET (FIXED DEPENDENCY)
  useEffect(() => {
    if (!checkIn || !checkOut) return;

    const socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      import.meta.env.VITE_API_URL ||
      "http://localhost:5000";

    const socket = io(socketUrl, { transports: ["websocket"] });

    socket.emit(
      "availability:check",
      {
        location,
        minPrice,
        maxPrice,
        guests,
        checkIn: toYmd(checkIn),
        checkOut: toYmd(checkOut),
        page,
        limit,
      },
      (response) => {
        if (response?.success && Array.isArray(response.rooms)) {
          if (page === 1) setRooms(response.rooms);
          setTotal(response.total || response.rooms.length);
        }
      }
    );

    return () => socket.disconnect();
  }, [location, minPrice, maxPrice, guests, checkIn, checkOut, page]);

  function resetPage() {
    setPage(1);
  }

  return (
    <>
      <Helmet>
        <title>StayBook - Book Hotels</title>
      </Helmet>

      <div className="home-container">
        {/* HERO */}
        <section className="home-hero">
          <div className="flex flex-col gap-2 md:flex-row md:justify-between">
            <div>
              <h1 className="home-title">Find your next stay</h1>
              <p className="text-sm text-gray-600 mt-1">
                Search rooms by location, price, and availability.
              </p>
            </div>

            <div className="flex gap-2 flex-wrap">
              <span className="home-badge home-badge-primary">Fast checkout</span>
              <span className="home-badge">Secure payments</span>
              <span className="home-badge">Real-time availability</span>
            </div>
          </div>
        </section>

        {/* FILTER */}
        <section className="home-filter">
          <div className="grid gap-3 md:grid-cols-6">
            <div className="md:col-span-2">
              <label className="label mb-1">Location</label>
              <input
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  resetPage();
                }}
                placeholder="e.g. Goa"
                className="home-input"
              />
            </div>

            <div>
              <label className="label mb-1">Min Price</label>
              <input
                value={minPrice}
                onChange={(e) => {
                  setMinPrice(e.target.value);
                  resetPage();
                }}
                className="home-input"
              />
            </div>

            <div>
              <label className="label mb-1">Max Price</label>
              <input
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(e.target.value);
                  resetPage();
                }}
                className="home-input"
              />
            </div>

            <div>
              <label className="label mb-1">Guests</label>
              <input
                type="number"
                min={1}
                max={20}
                value={guests}
                onChange={(e) => {
                  setGuests(Number(e.target.value));
                  resetPage();
                }}
                className="home-input"
              />
            </div>

            <div className="md:col-span-3 grid gap-3 md:grid-cols-2">
              <div>
                <label className="label mb-1">Check-in</label>
                <DatePicker
                  selected={checkIn}
                  onChange={(d) => {
                    setCheckIn(d);
                    setCheckOut(null);
                    resetPage();
                  }}
                  minDate={new Date()}
                  dateFormat="yyyy-MM-dd"
                  className="home-input"
                />
              </div>

              <div>
                <label className="label mb-1">Check-out</label>
                <DatePicker
                  selected={checkOut}
                  onChange={(d) => {
                    setCheckOut(d);
                    resetPage();
                  }}
                  minDate={checkIn || new Date()}
                  dateFormat="yyyy-MM-dd"
                  className="home-input"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ERROR */}
        {error && <ErrorBanner message={error} />}

        {/* ROOMS */}
        <section>
          {loading ? (
            <div className="home-grid sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <RoomCardSkeleton key={i} />
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <div className="home-empty">
              No rooms found. Try adjusting filters.
            </div>
          ) : (
            <div className="home-grid sm:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => (
                <RoomCard key={room._id} room={room} />
              ))}
            </div>
          )}

          {!loading && rooms.length > 0 && total > limit && (
            <Pagination
              page={page}
              total={total}
              limit={limit}
              onPageChange={(p) => setPage(p)}
            />
          )}
        </section>
      </div>
    </>
  );
}