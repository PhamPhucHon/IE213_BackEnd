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
import { formatCurrency } from "@/lib/utils";
import { ProductCard } from "./product-card";
import { ProductReviews } from "./product-reviews";

type ProductDetailViewProps = {
  product: Product;
  relatedProducts?: Product[];
};

function variantLabel(variant: ProductVariant, index: number) {
  return variant.color || `Option ${index + 1}`;
}

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
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <section className="grid gap-3">
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-line bg-surface">
            {activeImage ? (
              <Image
                src={activeImage}
                alt={product.name}
                fill
                priority
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm font-medium text-muted">
                No product image
              </div>
            )}
            {hasImageCarousel ? (
              <>
                <button
                  type="button"
                  aria-label="Previous product image"
                  title="Previous image"
                  className="focus-ring absolute inset-y-0 left-0 flex w-1/4 items-center justify-start px-4 text-ink opacity-0 transition hover:opacity-100 focus-visible:opacity-100"
                  onClick={() => showAdjacentImage(-1)}
                >
                  <ChevronLeft className="h-9 w-9 drop-shadow-[0_1px_2px_rgba(255,255,255,0.95)]" />
                </button>
                <button
                  type="button"
                  aria-label="Next product image"
                  title="Next image"
                  className="focus-ring absolute inset-y-0 right-0 flex w-1/4 items-center justify-end px-4 text-ink opacity-0 transition hover:opacity-100 focus-visible:opacity-100"
                  onClick={() => showAdjacentImage(1)}
                >
                  <ChevronRight className="h-9 w-9 drop-shadow-[0_1px_2px_rgba(255,255,255,0.95)]" />
                </button>
              </>
            ) : null}
          </div>

          {images.length > 1 ? (
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
              {images.slice(0, 12).map((image) => (
                <button
                  key={image}
                  type="button"
                  className={`focus-ring relative aspect-square overflow-hidden rounded-md border bg-white ${
                    image === activeImage ? "border-brand-600 ring-2 ring-brand-600" : "border-line"
                  }`}
                  onClick={() => setActiveImage(image)}
                  aria-label={`View ${product.name} image`}
                >
                  <Image src={image} alt="" fill sizes="96px" className="object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </section>

        <section className="self-start rounded-lg border border-line bg-white p-5">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
            {categorySlug ? (
              <Link href={`/categories/${categorySlug}`} className="font-medium text-brand-600">
                {categoryName}
              </Link>
            ) : (
              <span>{categoryName}</span>
            )}
            {product.type ? <span>{product.type}</span> : null}
            {product.availability ? <span>{product.availability.replaceAll("_", " ")}</span> : null}
          </div>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink">{product.name}</h1>
          <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-brand-600">{product.brand}</p>

          <div className="mt-4 flex items-center gap-2 text-sm text-muted">
            <Star className="h-4 w-4 fill-brand-500 text-brand-500" />
            <span>{product.rating?.avg?.toFixed(1) ?? "0.0"}</span>
            <span>({product.rating?.count ?? 0} reviews)</span>
          </div>

          <div className="mt-5">
            <p className="text-2xl font-semibold text-ink">{formatCurrency(price)}</p>
            {originalPrice && originalPrice > price ? (
              <p className="mt-1 text-sm text-muted line-through">{formatCurrency(originalPrice)}</p>
            ) : null}
          </div>

          {product.variants.length ? (
            <div className="mt-6">
              <h2 className="text-sm font-semibold text-ink">Color</h2>
              <div className="mt-3 flex min-h-8 items-center justify-between gap-4">
                <p className="min-w-0 truncate text-sm text-muted">{selectedVariantLabel}</p>
                <div className="flex shrink-0 flex-wrap justify-end gap-2.5">
                  {product.variants.map((variant, index) => (
                    <button
                      key={variant.sku}
                      type="button"
                      className={`focus-ring inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border p-1 transition ${
                        variant.sku === selectedVariant?.sku
                          ? "border-ink"
                          : "border-transparent hover:border-line"
                      }`}
                      onClick={() => setSelectedSku(variant.sku)}
                      aria-label={`Choose ${variantLabel(variant, index)}`}
                      title={variantLabel(variant, index)}
                    >
                      <span
                        className={`h-full w-full rounded-full ${
                          variant.sku === selectedVariant?.sku
                            ? "border border-white shadow-[0_0_0_1px_rgba(17,24,39,0.9)]"
                            : "border border-black/10"
                        }`}
                        style={getVariantSwatchStyle(variant.color)}
                      />
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
                  className="focus-ring rounded-md border border-line px-3 py-2 text-sm"
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setQuantity(Number.isFinite(value) && value > 0 ? Math.min(value, 99) : 1);
                  }}
                />
              </label>

              <div className="grid content-end">
                <button
                  type="button"
                  className="focus-ring h-10 rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={handleAddToCart}
                  disabled={isAdding || isLoadingUser || !selectedVariant}
                >
                  {isAdding ? "Checking stock..." : "Add to cart"}
                </button>
              </div>
            </div>

            {cartError ? (
              <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {cartError}
              </p>
            ) : null}
            {cartMessage ? (
              <p className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {cartMessage}
              </p>
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
                  <div key={label} className="grid grid-cols-[120px_1fr] gap-3">
                    <dt className="text-muted">{label}</dt>
                    <dd className="font-medium text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
        </section>
      </div>

      {relatedProducts.length ? (
        <section className="mt-12 border-t border-line pt-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
                You may also like
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-ink">Explore similar frames</h2>
            </div>
            <Link
              href={categorySlug ? `/categories/${categorySlug}` : "/products"}
              className="focus-ring hidden rounded-md px-2 py-1 text-sm font-semibold text-brand-600 hover:text-brand-700 sm:inline-flex"
            >
              View more
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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
