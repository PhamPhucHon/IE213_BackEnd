import { ProductCardSkeleton } from "@/components/product/product-card-skeleton";

export default function ProductsLoading() {
  return (
    <main className="container-page py-8 sm:py-10">
      <div className="h-24 rounded-md bg-surface" />
      <div className="mt-8 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="hidden h-[560px] rounded-lg bg-surface lg:block" />
        <div className="grid gap-5">
          <div className="h-8 rounded-md bg-surface" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
