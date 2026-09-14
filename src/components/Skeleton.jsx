const shimmer =
  'relative overflow-hidden bg-soft before:absolute before:inset-0 before:bg-[linear-gradient(90deg,transparent_0%,var(--soft-strong)_50%,transparent_100%)] before:bg-[length:200%_100%] before:animate-shimmer';

export function ShimmerBlock({ className = '' }) {
  return <div className={`${shimmer} ${className}`} />;
}

export function CardSkeleton({ className = '' }) {
  return (
    <div className={`bg-surface border border-edge rounded-2xl p-4 sm:p-6 ${className}`}>
      <ShimmerBlock className="h-40 rounded-xl mb-4" />
      <ShimmerBlock className="h-4 w-3/4 rounded-lg mb-2" />
      <ShimmerBlock className="h-3 w-1/2 rounded-lg" />
    </div>
  );
}

export function DashboardSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
