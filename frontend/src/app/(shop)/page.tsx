import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { CategoryCard } from "@/components/catalog/category-card";
import { CatalogError } from "@/components/catalog/catalog-error";
import { ProductGrid } from "@/components/product/product-grid";
import { ButtonLink } from "@/components/ui/button-link";
import { EmptyState } from "@/components/ui/empty-state";
import { categoriesApi } from "@/lib/api/categories";
import { productsApi } from "@/lib/api/products";
import {
  getActiveCategories,
  getCatalogErrorMessage,
  getProductImage
} from "@/lib/catalog/product-utils";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "IE213 Eyewear",
  description: "Browse IE213 sunglasses and eyeglasses with real variants, prices, and ratings.",
  alternates: {
    canonical: "/"
  }
};

async function loadHomeCatalog() {
  const [categoriesResult, latestResult, topRatedResult] = await Promise.allSettled([
    categoriesApi.list(),
    productsApi.list({ page: 1, limit: 8, sort: "newest" }),
    productsApi.list({ page: 1, limit: 4, sort: "topRated" })
  ]);

  return {
    categories: categoriesResult.status === "fulfilled" ? getActiveCategories(categoriesResult.value) : [],
    latestProducts: latestResult.status === "fulfilled" ? latestResult.value.data ?? [] : [],
    topRatedProducts: topRatedResult.status === "fulfilled" ? topRatedResult.value.data ?? [] : [],
    didLoadCategories: categoriesResult.status === "fulfilled",
    didLoadLatestProducts: latestResult.status === "fulfilled",
    didLoadTopRatedProducts: topRatedResult.status === "fulfilled",
    errors: [categoriesResult, latestResult, topRatedResult]
      .flatMap((result) =>
        result.status === "rejected" ? [getCatalogErrorMessage(result.reason)] : []
      )
  };
}

function StorefrontSectionHeader({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold text-brand-700">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-ink">{title}</h2>
        {description ? <p className="mt-2 text-sm leading-6 text-muted">{description}</p> : null}
      </div>
      {action ? <div className="flex shrink-0">{action}</div> : null}
    </div>
  );
}

export default async function HomePage() {
  const {
    categories,
    latestProducts,
    topRatedProducts,
    didLoadCategories,
    didLoadLatestProducts,
    didLoadTopRatedProducts,
    errors
  } = await loadHomeCatalog();
  const heroProduct = latestProducts[0] ?? topRatedProducts[0];
  const heroImage = heroProduct ? getProductImage(heroProduct) : categories[0]?.image;

  return (
    <main>
      <section className="relative overflow-hidden bg-ink text-white">
        {heroImage ? (
          <Image
            src={heroImage}
            alt={heroProduct?.name ?? "IE213 eyewear collection"}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-60"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/20" />
        <div className="container-page relative grid min-h-[520px] items-end gap-8 py-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="max-w-2xl pb-2">
            <p className="text-sm font-semibold text-white/80">IE213 Eyewear</p>
            <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
              Clearer frames for everyday focus
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/80">
              Shop sunglasses and optical frames with clear pricing, visible variants, and customer
              ratings before checkout.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/products" className="bg-white text-ink hover:bg-surface">
                Browse products
              </ButtonLink>
              <ButtonLink href="/products?type=Sunglasses" variant="secondary">
                Sunglasses
              </ButtonLink>
            </div>
          </div>

          {heroProduct ? (
            <div className="hidden max-w-xs justify-self-start pb-4 text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.45)] lg:block">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/65">Featured frame</p>
              <p className="mt-2 line-clamp-2 text-lg font-semibold">{heroProduct.name}</p>
              <p className="mt-1 text-sm text-white/70">{heroProduct.brand}</p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="container-page py-10">
        {errors.length ? <CatalogError message={errors[0]} /> : null}

        <StorefrontSectionHeader
          eyebrow="Collections"
          title="Shop by frame style"
          description="Start with the shape, lens, or daily use that fits your routine."
          action={
            <Link href="/products" className="focus-ring hidden rounded-md px-2 py-1 text-sm font-semibold text-brand-700 hover:bg-brand-50 sm:inline-flex">
              View all
            </Link>
          }
        />

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.slice(0, 4).map((category) => (
            <CategoryCard key={category._id} category={category} />
          ))}
        </div>
        {didLoadCategories && !categories.length ? (
          <EmptyState
            title="No active categories yet"
            description="Collections will appear here when category data is available."
            className="mt-5"
          />
        ) : null}
      </section>

      <section className="container-page py-10">
        <StorefrontSectionHeader
          eyebrow="New arrivals"
          title="Fresh frames"
          description="Recent additions with product images, pricing, and ratings kept close to the card."
          action={
            <Link href="/products?sort=newest" className="focus-ring inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold text-brand-700 hover:bg-brand-50">
              Browse all
              <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
        {didLoadLatestProducts ? (
          <ProductGrid products={latestProducts} emptyDescription="Products will appear here after catalog data is added." />
        ) : null}
      </section>

      <section className="border-t border-line bg-surface">
        <div className="container-page py-10">
          <StorefrontSectionHeader
            eyebrow="Top rated"
            title="Customer favorites"
            description="Highly rated frames surfaced for faster comparison."
            action={
              <Link href="/products?sort=topRated" className="focus-ring rounded-md px-2 py-1 text-sm font-semibold text-brand-700 hover:bg-brand-50">
                See top rated
              </Link>
            }
          />
          {didLoadTopRatedProducts ? (
            <ProductGrid products={topRatedProducts} emptyDescription="Top rated products will show after reviews are available." />
          ) : null}
        </div>
      </section>
    </main>
  );
}
