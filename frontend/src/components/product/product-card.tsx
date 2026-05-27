import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import type { Product } from "@/types/models";
import { formatCurrency } from "@/lib/utils";
import {
  getCategoryName,
  getDefaultVariant,
  getProductImage,
  getProductOriginalPrice,
  getProductPrice
} from "@/lib/catalog/product-utils";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const defaultVariant = getDefaultVariant(product);
  const image = getProductImage(product, defaultVariant);
  const price = getProductPrice(product, defaultVariant);
  const originalPrice = getProductOriginalPrice(product, defaultVariant);
  const categoryName = getCategoryName(product.categoryId);

  return (
    <article className="group overflow-hidden rounded-lg border border-line bg-white transition hover:-translate-y-0.5 hover:shadow-soft">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[4/3] bg-surface">
          {image ? (
            <Image
              src={image}
              alt={product.name}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-4 text-center text-sm font-medium text-muted">
              No product image
            </div>
          )}
          {product.sale ? (
            <span className="absolute left-3 top-3 rounded-full bg-ink px-2.5 py-1 text-xs font-semibold text-white">
              Sale
            </span>
          ) : null}
        </div>

        <div className="grid gap-3 p-3">
          <div>
            <p className="truncate text-xs font-semibold uppercase tracking-wide text-brand-600">
              {product.brand}
            </p>
            <h2 className="mt-1 line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-ink">
              {product.name}
            </h2>
            {categoryName ? <p className="mt-1 truncate text-xs text-muted">{categoryName}</p> : null}
          </div>

          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">{formatCurrency(price)}</p>
              {originalPrice && originalPrice > price ? (
                <p className="text-xs text-muted line-through">{formatCurrency(originalPrice)}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-1 text-xs text-muted">
              <Star className="h-3.5 w-3.5 fill-brand-500 text-brand-500" />
              <span>{product.rating?.avg?.toFixed(1) ?? "0.0"}</span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
