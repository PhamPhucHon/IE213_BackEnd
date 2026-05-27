import type { Product } from "@/types/models";
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
      <div className="rounded-lg border border-dashed border-line bg-white p-8 text-center">
        <h2 className="text-lg font-semibold text-ink">{emptyTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-muted">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
}
