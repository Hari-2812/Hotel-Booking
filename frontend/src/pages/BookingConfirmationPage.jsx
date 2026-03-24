import { Helmet } from 'react-helmet-async';
import { Link, useLocation } from 'react-router-dom';

export default function BookingConfirmationPage() {
  const location = useLocation();
  const booking = location.state?.booking;

  return (
    <>
      <Helmet>
        <title>Booking Confirmed | StayBook AI</title>
      </Helmet>
      <section className="mx-auto max-w-3xl rounded-[30px] border border-emerald-200 bg-emerald-50/80 p-10 text-center shadow-soft">
        <p className="text-5xl">✅</p>
        <h1 className="mt-4 text-4xl font-semibold text-emerald-900">Booking Confirmed</h1>
        <p className="mt-3 text-sm text-emerald-800">Your reservation has been saved. You can view and manage it from your dashboard.</p>
        {booking ? <p className="mt-4 text-xs text-emerald-700">Booking ID: {booking._id || booking.id}</p> : null}
        <div className="mt-6 flex justify-center gap-3">
          <Link className="btn-primary" to="/dashboard">Go to dashboard</Link>
          <Link className="btn-secondary" to="/">Back to home</Link>
        </div>
      </section>
    </>
  );
}
