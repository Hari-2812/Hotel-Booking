export function RoomCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/70 shadow-soft backdrop-blur">
      <div className="h-52 w-full animate-pulse bg-slate-200/80" />
      <div className="space-y-3 p-5">
        <div className="h-4 w-2/3 animate-pulse rounded-full bg-slate-200" />
        <div className="h-3 w-1/2 animate-pulse rounded-full bg-slate-200" />
        <div className="h-3 w-full animate-pulse rounded-full bg-slate-200" />
        <div className="flex gap-2 pt-2">
          <div className="h-8 w-20 animate-pulse rounded-full bg-slate-200" />
          <div className="h-8 w-24 animate-pulse rounded-full bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="glass-panel h-40 animate-pulse" />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <RoomCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
