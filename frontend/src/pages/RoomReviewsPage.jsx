import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../services/api";
import RequireAuth from "../components/RequireAuth";
import { AuthContext } from "../context/AuthContext";

import ErrorBanner from "../components/ErrorBanner";

function ReviewsList({ roomId, reviews, loading, error, onRefresh }) {
  return (
    <div className="card p-4">
      <h2 className="text-sm font-semibold text-gray-800">Reviews</h2>
      {error && <div className="mt-3"><ErrorBanner message={error} /></div>}
      {loading ? (
        <div className="mt-3 text-sm text-gray-600">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="mt-3 text-sm text-gray-600">No reviews yet.</div>
      ) : (
        <div className="mt-3 space-y-3">
          {reviews.map((r) => (
            <div key={r._id} className="rounded-lg border bg-white p-3">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <div className="font-semibold text-gray-800">{r.rating}★</div>
                <div>{new Date(r.createdAt).toLocaleDateString()}</div>
              </div>
              <div className="mt-1 text-sm text-gray-700">{r.comment}</div>
              <div className="mt-2 text-xs text-gray-500">By {r.userId?.email}</div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 text-xs text-gray-500">
        Tip: add a review below.
      </div>
    </div>
  );
}

export default function RoomReviewsPage() {
  const { roomId } = useParams();
  const { token } = useContext(AuthContext);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [reviews, setReviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchReviews() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/api/reviews/${roomId}`, { params: { page, limit } });
      setReviews(res.data.reviews || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      setError(e.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, page]);

  async function submitReview({ rating, comment }) {
    await api.post(
      `/api/reviews/${roomId}`,
      { rating: Number(rating), comment },
      { headers: token ? undefined : undefined }
    );
    toast.success("Review submitted");
    setPage(1);
    // refresh
    const res = await api.get(`/api/reviews/${roomId}`, { params: { page: 1, limit } });
    setReviews(res.data.reviews || []);
    setTotal(res.data.total || 0);
  }

  return (
    <div className="space-y-6">
      <ReviewsList roomId={roomId} reviews={reviews} loading={loading} error={error} />

      <RequireAuth>
        <ReviewForm onSubmit={submitReview} />
      </RequireAuth>

      <div className="flex items-center justify-center gap-2">
        <button
          className="rounded-md border px-3 py-1 text-sm disabled:opacity-40"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Prev
        </button>
        <div className="text-sm text-gray-600">
          Page {page} / {Math.max(1, Math.ceil(total / limit))}
        </div>
        <button
          className="rounded-md border px-3 py-1 text-sm disabled:opacity-40"
          disabled={page >= Math.ceil(total / limit)}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

function ReviewForm({ onSubmit }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handle(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await onSubmit({ rating, comment });
      setComment("");
    } catch (err) {
      setError(err.message || "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card p-4">
      <h2 className="text-sm font-semibold text-gray-800">Add your review</h2>
      {error && <div className="mt-3"><ErrorBanner message={error} /></div>}
      <form onSubmit={handle} className="mt-3 space-y-3 text-sm">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Rating</label>
          <select className="input" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
            {[5,4,3,2,1].map((r) => (
              <option key={r} value={r}>{r} stars</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Comment</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="h-24 w-full resize-none input"
            placeholder="Share your experience..."
            maxLength={1000}
            required
          />
        </div>
        <button type="submit" disabled={submitting} className="w-full btn-primary px-3 py-2">
          {submitting ? "Submitting..." : "Submit review"}
        </button>
      </form>
    </div>
  );
}

