import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import type { Product } from "@/types/models";
import { cn, formatCurrency } from "@/lib/utils";
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

const availabilityLabels = {
  in_stock: "In stock",
  out_of_stock: "Out of stock",
  pre_order: "Pre-order"
} as const;

const availabilityClassNames = {
  in_stock: "bg-success-50 text-success-700",
  out_of_stock: "bg-danger-50 text-danger-700",
  pre_order: "bg-warning-50 text-warning-700"
} as const;

export function ProductCard({ product }: ProductCardProps) {
  const defaultVariant = getDefaultVariant(product);
  const image = getProductImage(product, defaultVariant);
  const price = getProductPrice(product, defaultVariant);
  const originalPrice = getProductOriginalPrice(product, defaultVariant);
  const categoryName = getCategoryName(product.categoryId);
  const discountedFromPrice = originalPrice && originalPrice > price ? originalPrice : null;

  return (
    <article className="group h-full min-w-0 overflow-hidden rounded-lg border border-line bg-white shadow-subtle transition duration-200 ease-ui hover:-translate-y-0.5 hover:border-line-strong hover:shadow-soft">
      <Link href={`/products/${product.slug}`} className="focus-ring block h-full min-w-0">
        <div className="relative aspect-[5/3] overflow-hidden bg-surface">
          {image ? (
            <Image
              src={image}
              alt={product.name}
              fill
              sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, (min-width: 390px) 50vw, 100vw"
              className="object-cover transition duration-300 ease-ui group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-4 text-center text-sm font-medium text-muted">
              No product image
            </div>
          )}
          {product.sale ? (
            <span className="absolute left-3 top-3 rounded-md bg-ink px-2.5 py-1 text-xs font-semibold text-white shadow-subtle">
              Sale
            </span>
          ) : null}
          {product.availability ? (
            <span
              className={cn(
                "absolute right-3 top-3 rounded-md px-2.5 py-1 text-xs font-semibold shadow-subtle",
                availabilityClassNames[product.availability]
              )}
            >
              {availabilityLabels[product.availability]}
            </span>
          ) : null}
        </div>

        <div className="grid min-h-[164px] content-between gap-4 p-3.5 sm:p-4">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-wide text-brand-700">
              {product.brand}
            </p>
            <h2 className="mt-1 line-clamp-2 min-h-10 break-words text-sm font-semibold leading-5 text-ink">
              {product.name}
            </h2>
            {categoryName ? <p className="mt-1 truncate text-xs text-muted">{categoryName}</p> : null}
          </div>

          <div className="flex min-w-0 items-end justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-ink">{formatCurrency(price)}</p>
              {discountedFromPrice ? (
                <p className="mt-0.5 text-xs text-muted line-through">{formatCurrency(discountedFromPrice)}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-1 rounded-md bg-surface px-2 py-1 text-xs font-medium text-muted">
              <Star className="h-3.5 w-3.5 fill-brand-500 text-brand-500" />
              <span>{product.rating?.avg?.toFixed(1) ?? "0.0"}</span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
