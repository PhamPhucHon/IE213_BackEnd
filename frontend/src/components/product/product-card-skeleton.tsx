export function ProductCardSkeleton() {
  return (
    <div className="rounded-lg border border-line bg-white p-3">
      <div className="aspect-[4/3] rounded-md bg-surface" />
      <div className="mt-4 h-4 w-3/4 rounded bg-surface" />
      <div className="mt-2 h-4 w-1/2 rounded bg-surface" />
      <div className="mt-4 h-9 rounded bg-surface" />
    </div>
  );
}
