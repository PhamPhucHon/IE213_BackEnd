import { ProductCardSkeleton } from "@/components/product/product-card-skeleton";

export default function ShopLoading() {
  return (
    <main>
      <div className="h-[460px] bg-surface" />
      <section className="container-page py-10">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </section>
    </main>
  );
}
