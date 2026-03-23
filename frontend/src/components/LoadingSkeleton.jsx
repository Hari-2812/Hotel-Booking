export function RoomCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="h-40 w-full animate-pulse bg-gray-100" />
      <div className="p-4">
        <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
        <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-gray-100" />
        <div className="mt-4 h-10 w-full animate-pulse rounded bg-gray-100" />
      </div>
    </div>
  );
}

