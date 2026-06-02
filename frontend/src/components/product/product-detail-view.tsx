"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { Product, ProductVariant } from "@/types/models";
import {
  addCartItem,
  checkInventory,
  getLocalCartErrorMessage,
  LocalCartError
} from "@/lib/api/local-cart";
import {
  getCategoryName,
  getCategorySlug,
  getDefaultVariant,
  getProductImages,
  getProductOriginalPrice,
  getProductPrice
} from "@/lib/catalog/product-utils";
import { cartQueryKey } from "@/lib/hooks/use-cart";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { cn, formatCurrency } from "@/lib/utils";
import { StatusAlert } from "@/components/ui/status-alert";
import {
  fieldClassName,
  getButtonClassName
} from "@/components/ui/style-primitives";
import { ProductCard } from "./product-card";
import { ProductReviews } from "./product-reviews";

type ProductDetailViewProps = {
  product: Product;
  relatedProducts?: Product[];
};

function variantLabel(variant: ProductVariant, index: number) {
  return variant.color || `Option ${index + 1}`;
}

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

function getVariantSwatchStyle(color?: string): CSSProperties {
  const normalized = (color ?? "").toLowerCase().replace(/[-_]/g, " ");

  if (normalized.includes("havana")) {
    return {
      background:
        "linear-gradient(135deg, #3b2418 0%, #7a4a2e 45%, #b58155 65%, #2c1a12 100%)"
    };
  }
  if (normalized.includes("transparent") || normalized.includes("crystal")) return { background: "#f4f5f2" };
  if (normalized.includes("faded ash")) return { background: "#757b6b" };
  if (normalized.includes("olive")) return { background: "#59624d" };
  if (normalized.includes("green")) return { background: "#58634f" };
  if (normalized.includes("denim") || normalized.includes("blue")) return { background: "#425a72" };
  if (normalized.includes("purple")) return { background: "#6f5a82" };
  if (normalized.includes("brown")) return { background: "#573a2e" };
  if (normalized.includes("beige")) return { background: "#c9b79e" };
  if (normalized.includes("black")) return { background: "#111315" };
  if (normalized.includes("gunmetal")) return { background: "#565b5f" };
  if (normalized.includes("silver")) return { background: "#c7c9ca" };
  if (normalized.includes("grey") || normalized.includes("gray") || normalized.includes("ash")) {
    return { background: "#76787a" };
  }

  return { background: "#7b7d7f" };
}

function specifications(product: Product) {
  const spec = product.specifications ?? {};
  const size = spec.size ?? {};

  return [
    ["Material", spec.material],
    ["Lens", spec.lensMaterial],
    ["Origin", spec.origin],
    ["Gender", spec.gender],
    ["Dimensions", size.dimensions],
    ["Frame width", size.totalWidth ? `${size.totalWidth} mm` : undefined],
    ["Bridge", size.bridge ? `${size.bridge} mm` : undefined],
    ["Lens width", size.width ? `${size.width} mm` : undefined]
  ].filter((item): item is [string, string] => Boolean(item[1]));
}

export function ProductDetailView({ product, relatedProducts = [] }: ProductDetailViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { data: user, isLoading: isLoadingUser } = useCurrentUser();
  const defaultVariant = getDefaultVariant(product);
  const [selectedSku, setSelectedSku] = useState(defaultVariant?.sku ?? "");
  const [quantity, setQuantity] = useState(1);
  const [cartMessage, setCartMessage] = useState<string | null>(null);
  const [cartError, setCartError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const selectedVariant = useMemo(
    () => product.variants.find((variant) => variant.sku === selectedSku) ?? defaultVariant,
    [defaultVariant, product.variants, selectedSku]
  );
  const images = useMemo(() => getProductImages(product, selectedVariant), [product, selectedVariant]);
  const [activeImage, setActiveImage] = useState(images[0] ?? "");
  const price = getProductPrice(product, selectedVariant);
  const originalPrice = getProductOriginalPrice(product, selectedVariant);
  const categoryName = getCategoryName(product.categoryId);
  const categorySlug = getCategorySlug(product.categoryId);
  const specItems = specifications(product);
  const selectedVariantIndex = Math.max(
    product.variants.findIndex((variant) => variant.sku === selectedVariant?.sku),
    0
  );
  const selectedVariantLabel = selectedVariant
    ? variantLabel(selectedVariant, selectedVariantIndex)
    : "Color";
  const activeImageIndex = Math.max(
    images.findIndex((image) => image === activeImage),
    0
  );
  const hasImageCarousel = images.length > 1;

  useEffect(() => {
    setActiveImage(images[0] ?? "");
  }, [images]);

  function showAdjacentImage(direction: -1 | 1) {
    if (!images.length) return;

    const nextIndex = (activeImageIndex + direction + images.length) % images.length;
    setActiveImage(images[nextIndex] ?? "");
  }

  async function handleAddToCart() {
    setCartError(null);
    setCartMessage(null);

    if (!selectedVariant?.sku) {
      setCartError("Please choose a variant before adding to cart.");
      return;
    }

    if (!user) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    setIsAdding(true);

    try {
      const inventory = await checkInventory(selectedVariant.sku, quantity);

      if (!inventory.available) {
        setCartError(`Only ${inventory.availableStock} item(s) available.`);
        return;
      }

      const cart = await addCartItem(selectedVariant.sku, quantity);
      queryClient.setQueryData(cartQueryKey, cart);
      await queryClient.invalidateQueries({ queryKey: cartQueryKey });
      setCartMessage("Added to cart.");
    } catch (error) {
      if (error instanceof LocalCartError && error.status === 401) {
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      setCartError(getLocalCartErrorMessage(error));
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <div className="container-page py-8 sm:py-10">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] lg:gap-8">
        <section className="grid gap-3">
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-line bg-white shadow-subtle">
            {activeImage ? (
              <Image
                src={activeImage}
                alt={product.name}
                fill
                priority
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="object-contain p-5 sm:p-8"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm font-medium text-muted">
                No product image
              </div>
            )}
            {images.length ? (
              <span className="absolute left-3 top-3 rounded-md bg-white/90 px-2.5 py-1 text-xs font-semibold text-ink shadow-subtle">
                {activeImageIndex + 1} / {images.length}
              </span>
            ) : null}
            {hasImageCarousel ? (
              <>
                <button
                  type="button"
                  aria-label="Previous product image"
                  title="Previous image"
                  className="focus-ring absolute left-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md border border-line bg-white/90 text-ink shadow-soft transition hover:bg-white"
                  onClick={() => showAdjacentImage(-1)}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  aria-label="Next product image"
                  title="Next image"
                  className="focus-ring absolute right-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md border border-line bg-white/90 text-ink shadow-soft transition hover:bg-white"
                  onClick={() => showAdjacentImage(1)}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            ) : null}
          </div>

          {images.length > 1 ? (
            <div className="grid grid-cols-4 gap-2 min-[390px]:grid-cols-5 sm:grid-cols-6">
              {images.slice(0, 12).map((image, index) => (
                <button
                  key={image}
                  type="button"
                  className={cn(
                    "focus-ring relative aspect-square overflow-hidden rounded-md border bg-white transition hover:border-line-strong",
                    image === activeImage ? "border-ink ring-2 ring-ink" : "border-line"
                  )}
                  onClick={() => setActiveImage(image)}
                  aria-label={`View image ${index + 1} of ${images.length} for ${product.name}`}
                  aria-current={image === activeImage ? "true" : undefined}
                >
                  <Image src={image} alt="" fill sizes="96px" className="object-contain p-1.5" />
                </button>
              ))}
            </div>
          ) : null}
        </section>

        <section className="self-start rounded-lg border border-line bg-white p-4 shadow-subtle sm:p-5 lg:sticky lg:top-24">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted">
            {categorySlug ? (
              <Link href={`/categories/${categorySlug}`} className="focus-ring rounded-md bg-brand-50 px-2.5 py-1 text-brand-700 hover:bg-brand-100">
                {categoryName}
              </Link>
            ) : (
              <span>{categoryName}</span>
            )}
            {product.type ? <span className="rounded-md bg-surface px-2.5 py-1">{product.type}</span> : null}
            {product.availability ? (
              <span className={cn("rounded-md px-2.5 py-1", availabilityClassNames[product.availability])}>
                {availabilityLabels[product.availability]}
              </span>
            ) : null}
          </div>

          <h1 className="mt-4 break-words text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{product.name}</h1>
          <p className="mt-2 break-words text-sm font-semibold text-brand-700">{product.brand}</p>

          <div className="mt-4 inline-flex items-center gap-2 rounded-md bg-surface px-2.5 py-1.5 text-sm text-muted">
            <Star className="h-4 w-4 fill-brand-500 text-brand-500" />
            <span>{product.rating?.avg?.toFixed(1) ?? "0.0"}</span>
            <span>({product.rating?.count ?? 0} reviews)</span>
          </div>

          <div className="mt-5 rounded-lg bg-surface p-4">
            <p className="text-3xl font-semibold tracking-tight text-ink">{formatCurrency(price)}</p>
            {originalPrice && originalPrice > price ? (
              <p className="mt-1 text-sm text-muted line-through">{formatCurrency(originalPrice)}</p>
            ) : null}
          </div>

          {product.variants.length ? (
            <div className="mt-6">
              <h2 className="text-sm font-semibold text-ink">Color</h2>
              <div className="mt-3 grid gap-3">
                <p className="min-w-0 break-words text-sm text-muted">Selected: {selectedVariantLabel}</p>
                <div className="flex flex-wrap gap-2.5">
                  {product.variants.map((variant, index) => (
                    <button
                      key={variant.sku}
                      type="button"
                      className={cn(
                        "focus-ring inline-flex min-h-10 items-center gap-2 rounded-md border px-2.5 py-2 text-sm font-medium transition",
                        variant.sku === selectedVariant?.sku
                          ? "border-ink bg-ink text-white"
                          : "border-line bg-white text-ink hover:bg-surface"
                      )}
                      onClick={() => setSelectedSku(variant.sku)}
                      aria-label={`Choose ${variantLabel(variant, index)}`}
                      title={variantLabel(variant, index)}
                    >
                      <span
                        className={`h-5 w-5 rounded-full ${
                          variant.sku === selectedVariant?.sku
                            ? "border border-white shadow-[0_0_0_1px_rgba(17,24,39,0.9)]"
                            : "border border-black/10"
                        }`}
                        style={getVariantSwatchStyle(variant.color)}
                      />
                      <span className="max-w-[10rem] truncate">{variantLabel(variant, index)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-6 border-t border-line pt-6">
            <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
              <label className="grid gap-1 text-sm font-semibold text-ink">
                Quantity
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={quantity}
                  className={fieldClassName}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setQuantity(Number.isFinite(value) && value > 0 ? Math.min(value, 99) : 1);
                  }}
                />
              </label>

              <div className="grid content-end">
                <button
                  type="button"
                  className={getButtonClassName("primary", "h-11 w-full")}
                  onClick={handleAddToCart}
                  disabled={isAdding || isLoadingUser || !selectedVariant}
                >
                  {isAdding ? "Checking stock..." : "Add to cart"}
                </button>
              </div>
            </div>

            {cartError ? (
              <StatusAlert tone="error" className="mt-3">
                {cartError}
              </StatusAlert>
            ) : null}
            {cartMessage ? (
              <StatusAlert tone="success" className="mt-3">
                <span>{cartMessage}</span>{" "}
                <Link href="/cart" className="font-semibold underline underline-offset-2">
                  View cart
                </Link>
              </StatusAlert>
            ) : null}
          </div>

          <div className="mt-6 border-t border-line pt-6">
            <h2 className="text-sm font-semibold text-ink">Description</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{product.description}</p>
          </div>

          {specItems.length ? (
            <div className="mt-6 border-t border-line pt-6">
              <h2 className="text-sm font-semibold text-ink">Specifications</h2>
              <dl className="mt-3 grid gap-2 text-sm">
                {specItems.map(([label, value]) => (
                  <div key={label} className="grid gap-1 rounded-md bg-surface px-3 py-2 min-[390px]:grid-cols-[120px_1fr] min-[390px]:gap-3">
                    <dt className="text-muted">{label}</dt>
                    <dd className="min-w-0 break-words font-medium text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
        </section>
      </div>

      {relatedProducts.length ? (
        <section className="mt-12 border-t border-line pt-8">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-brand-700">
                You may also like
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-ink">Explore similar frames</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                Compare nearby styles, colors, and price points before deciding.
              </p>
            </div>
            <Link
              href={categorySlug ? `/categories/${categorySlug}` : "/products"}
              className="focus-ring hidden rounded-md px-2 py-1 text-sm font-semibold text-brand-700 hover:bg-brand-50 sm:inline-flex"
            >
              View more
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3 min-[390px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard key={relatedProduct._id} product={relatedProduct} />
            ))}
          </div>
        </section>
      ) : null}

      <ProductReviews product={product} />
    </div>
  );
}
