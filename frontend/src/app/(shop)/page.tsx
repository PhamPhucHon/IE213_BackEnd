import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { CategoryCard } from "@/components/catalog/category-card";
import { CatalogError } from "@/components/catalog/catalog-error";
import { ProductGrid } from "@/components/product/product-grid";
import { ButtonLink } from "@/components/ui/button-link";
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
    errors: [categoriesResult, latestResult, topRatedResult]
      .flatMap((result) =>
        result.status === "rejected" ? [getCatalogErrorMessage(result.reason)] : []
      )
  };
}

export default async function HomePage() {
  const { categories, latestProducts, topRatedProducts, errors } = await loadHomeCatalog();
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
            className="object-cover opacity-55"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />
        <div className="container-page relative grid min-h-[460px] content-center gap-6 py-16">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-white/80">IE213 Eyewear</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              Frames for daily focus and sunny weekends
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/80">
              Browse sunglasses and eyeglasses with real product images, variants, prices, and ratings
              from the IE213 backend.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/products">Browse products</ButtonLink>
              <ButtonLink href="/products?type=Sunglasses" variant="secondary">
                Sunglasses
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-10">
        {errors.length ? <CatalogError message={errors[0]} /> : null}

        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">Categories</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">Shop by collection</h2>
          </div>
          <Link href="/products" className="hidden text-sm font-medium text-brand-600 sm:inline-flex">
            View all
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.slice(0, 4).map((category) => (
            <CategoryCard key={category._id} category={category} />
          ))}
        </div>
        {!categories.length ? (
          <div className="mt-5 rounded-lg border border-dashed border-line bg-white p-8 text-center">
            <h3 className="text-lg font-semibold text-ink">No active categories yet</h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              Collections will appear here after the backend returns category data.
            </p>
          </div>
        ) : null}
      </section>

      <section className="container-page py-10">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">New arrivals</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">Fresh frames</h2>
          </div>
          <Link href="/products?sort=newest" className="inline-flex items-center gap-1 text-sm font-medium text-brand-600">
            Browse all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <ProductGrid products={latestProducts} emptyDescription="Products will appear here once the backend returns catalog data." />
      </section>

      <section className="border-t border-line bg-surface">
        <div className="container-page py-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">Top rated</p>
              <h2 className="mt-2 text-2xl font-semibold text-ink">Customer favorites</h2>
            </div>
            <Link href="/products?sort=topRated" className="text-sm font-medium text-brand-600">
              See top rated
            </Link>
          </div>
          <ProductGrid products={topRatedProducts} emptyDescription="Top rated products will show after reviews are available." />
        </div>
      </section>
    </main>
  );
}
