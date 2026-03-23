import { Link } from 'react-router-dom';

export default function RoomCard({ room }) {
  const image = room.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80';

  return (
    <Link
      to={`/rooms/${room._id}`}
      className="group block overflow-hidden rounded-3xl border border-white/70 bg-white/80 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-glow"
    >
      <div className="relative h-56 overflow-hidden bg-slate-100">
        <img
          src={image}
          alt={room.hotelName}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-2">
          <span className="badge badge-primary">{room.location}</span>
          <span className="badge bg-white/85 text-slate-700">{room.category || 'Stay'}</span>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-lg font-semibold text-slate-900">{room.hotelName}</h3>
            {room.ratingCount > 0 && (
              <div className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                ★ {Number(room.avgRating || 0).toFixed(1)}
              </div>
            )}
          </div>
          <p className="mt-2 line-clamp-2 text-sm text-slate-600">
            {room.description || 'Premium stay with curated amenities and fast booking.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(room.amenities || []).slice(0, 3).map((amenity) => (
            <span key={amenity} className="badge">
              {amenity}
            </span>
          ))}
          {room.maxGuests && <span className="badge">Up to {room.maxGuests} guests</span>}
        </div>

        {room.recommendationReasons?.length > 0 && (
          <div className="rounded-2xl bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
            AI match: {room.recommendationReasons.join(' • ')}
          </div>
        )}

        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">From</p>
            <p className="text-2xl font-bold text-slate-900">${room.basePricePerNight}</p>
          </div>
          <span className="text-sm font-medium text-indigo-600 transition group-hover:translate-x-1">
            Explore stay →
          </span>
        </div>
      </div>
    </Link>
  );
}
