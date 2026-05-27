import { ProductCardSkeleton } from "@/components/product/product-card-skeleton";

export default function CategoryLoading() {
  return (
    <main>
      <div className="h-[320px] bg-surface" />
      <section className="container-page grid gap-5 py-8 sm:py-10">
        <div className="h-8 rounded-md bg-surface" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </section>
    </main>
  );
}
