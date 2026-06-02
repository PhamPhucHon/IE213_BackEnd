import type { Product } from "@/types/models";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductCard } from "./product-card";

type ProductGridProps = {
  products: Product[];
  emptyTitle?: string;
  emptyDescription?: string;
};

export function ProductGrid({
  products,
  emptyTitle = "No products found",
  emptyDescription = "Try adjusting search, filters, or sorting."
}: ProductGridProps) {
  if (!products.length) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        className="bg-surface/60"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 min-[390px]:grid-cols-2 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
}
