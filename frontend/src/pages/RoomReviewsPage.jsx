import { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import ErrorBanner from '../components/ErrorBanner';
import RequireAuth from '../components/RequireAuth';
import { api } from '../services/api';

function ReviewComposer({ onSubmit }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await onSubmit({ rating, comment });
      setComment('');
      toast.success('Review submitted');
    } catch (submitError) {
      setError(submitError.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="glass-panel p-6">
      <h2 className="text-xl font-semibold text-slate-950">Share your experience</h2>
      {error && <div className="mt-4"><ErrorBanner message={error} /></div>}
      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        <select className="input" value={rating} onChange={(event) => setRating(Number(event.target.value))}>
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>{value} stars</option>
          ))}
        </select>
        <textarea className="input min-h-32 resize-none" value={comment} onChange={(event) => setComment(event.target.value)} maxLength={1000} placeholder="Tell future guests what stood out." required />
        <button className="btn-primary w-full" type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit review'}</button>
      </form>
    </div>
  );
}

export default function RoomReviewsPage() {
  const { roomId } = useParams();
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/api/reviews/${roomId}`, { params: { page: 1, limit: 20 } });
      setReviews(response.data.reviews || []);
    } catch (loadError) {
      setError(loadError.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  async function submitReview(payload) {
    await api.post(`/api/reviews/${roomId}`, payload);
    await loadReviews();
  }

  return (
    <>
      <Helmet>
        <title>Reviews | StayBook AI</title>
      </Helmet>
      <div className="space-y-6">
        <section className="glass-panel p-8">
          <p className="eyebrow">Guest voice</p>
          <h1 className="mt-3 text-4xl font-semibold text-slate-950">Reviews and ratings</h1>
        </section>
        {error && <ErrorBanner message={error} />}
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="glass-panel p-6">
            {loading ? (
              <p className="text-sm text-slate-500">Loading reviews...</p>
            ) : reviews.length === 0 ? (
              <p className="text-sm text-slate-500">No reviews yet for this stay.</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review._id} className="rounded-3xl border border-slate-100 bg-white/70 p-5 shadow-soft">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-900">★ {review.rating}</span>
                      <span className="text-slate-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{review.comment}</p>
                    <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-400">{review.userId?.email || 'Guest'}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
          <RequireAuth>
            <ReviewComposer onSubmit={submitReview} />
          </RequireAuth>
        </div>
      </div>
    </>
  );
}
