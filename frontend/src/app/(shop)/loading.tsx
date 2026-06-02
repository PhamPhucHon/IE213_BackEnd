import { ProductCardSkeleton } from "@/components/product/product-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function ShopLoading() {
  return (
    <main>
      <Skeleton className="h-[460px] rounded-none" />
      <section className="container-page py-10">
        <div className="grid grid-cols-1 gap-3 min-[390px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </section>
    </main>
  );
}
