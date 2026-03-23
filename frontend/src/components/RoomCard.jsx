import { Link } from 'react-router-dom';

export default function RoomCard({ room }) {
  const image = room.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80';

  return (
    <Link
      to={`/rooms/${room._id}`}
      className="group block overflow-hidden rounded-[30px] border border-white/70 bg-white shadow-premium transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_70px_rgba(15,23,42,0.16)]"
    >
      <div className="relative h-64 overflow-hidden">
        <img src={image} alt={room.hotelName} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-slate-900/15 to-transparent" />
        <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-2">
          <span className="badge badge-primary">{room.location}</span>
          {room.ratingCount > 0 && <span className="badge bg-white/90 text-slate-700">★ {Number(room.avgRating || 0).toFixed(1)}</span>}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-200">{room.category || 'Luxury stay'}</p>
          <h3 className="mt-2 text-xl font-semibold">{room.hotelName}</h3>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <p className="line-clamp-2 text-sm leading-6 text-slate-600">
          {room.description || 'Sophisticated accommodations with curated comfort, premium service, and a seamless booking experience.'}
        </p>

        <div className="flex flex-wrap gap-2">
          {(room.amenities || []).slice(0, 3).map((amenity) => (
            <span key={amenity} className="badge">{amenity}</span>
          ))}
          <span className="badge">Up to {room.maxGuests} guests</span>
        </div>

        {room.recommendationReasons?.length > 0 && (
          <div className="rounded-2xl bg-sky-50 px-3 py-2 text-xs text-sky-700">
            AI match: {room.recommendationReasons.join(' • ')}
          </div>
        )}

        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">From</p>
            <p className="text-2xl font-semibold text-slate-950">${room.basePricePerNight}</p>
          </div>
          <span className="text-sm font-semibold text-sky-700 transition group-hover:translate-x-1">View details →</span>
        </div>
      </div>
    </Link>
  );
}
