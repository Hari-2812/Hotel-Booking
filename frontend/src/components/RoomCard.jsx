import { Link } from "react-router-dom";

export default function RoomCard({ room }) {
  const img = room.images?.[0];
  return (
    <Link to={`/rooms/${room._id}`} className="group block overflow-hidden rounded-xl border bg-white hover:shadow-sm">
      <div className="relative h-48 w-full overflow-hidden bg-gray-100">
        {img ? (
          <img src={img} alt={room.hotelName} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">No image</div>
        )}
        <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-indigo-700">
          {room.location}
        </div>
      </div>

      <div className="p-4">
        <h3 className="truncate text-base font-semibold text-gray-900">{room.hotelName}</h3>
        <p className="mt-1 truncate text-sm text-gray-600">{room.description ? room.description.slice(0, 80) : "—"}</p>

        <div className="mt-3 flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-900">
            ${room.basePricePerNight} <span className="font-normal text-gray-600">/ night</span>
          </div>
          <div className="text-xs text-gray-600">Up to {room.maxGuests} guests</div>
        </div>

        {typeof room.avgRating === "number" && room.ratingCount > 0 && (
          <div className="mt-2 text-xs text-gray-700">
            {room.avgRating.toFixed(1)} ({room.ratingCount})
          </div>
        )}
      </div>
    </Link>
  );
}

