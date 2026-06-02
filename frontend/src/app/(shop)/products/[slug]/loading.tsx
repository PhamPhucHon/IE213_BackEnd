import { Skeleton } from "@/components/ui/skeleton";

export default function ProductDetailLoading() {
  return (
    <main className="container-page py-8 sm:py-10">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <div className="grid gap-3">
          <Skeleton className="aspect-[4/3] rounded-lg" />
          <div className="grid grid-cols-4 gap-2 min-[390px]:grid-cols-5 sm:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="aspect-square" />
            ))}
          </div>
        </div>
        <Skeleton className="h-[520px] rounded-lg" />
      </div>
    </main>
  );
}
