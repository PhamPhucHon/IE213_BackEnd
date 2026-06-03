import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogError } from "@/components/catalog/catalog-error";
import { ProductFiltersPanel } from "@/components/product/product-filters";
import { ProductGrid } from "@/components/product/product-grid";
import { ProductPagination } from "@/components/product/product-pagination";
import { ApiError } from "@/lib/api/http";
import { categoriesApi } from "@/lib/api/categories";
import { productsApi } from "@/lib/api/products";
import { getCatalogErrorMessage, getPagination } from "@/lib/catalog/product-utils";
import { parseCatalogSearchParams, toProductListQuery, type SearchParamsInput } from "@/lib/catalog/query";

export const revalidate = 60;

type CategoryDetailPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParamsInput>;
};

export async function generateMetadata({
  params
}: Pick<CategoryDetailPageProps, "params">): Promise<Metadata> {
  const { slug } = await params;

  try {
    const category = await categoriesApi.getBySlug(slug);
    const description =
      category.description || `Shop ${category.name} frames from the IE213 eyewear catalog.`;

    return {
      title: category.name,
      description,
      alternates: {
        canonical: `/categories/${category.slug}`
      },
      openGraph: {
        title: `${category.name} | IE213 Eyewear`,
        description,
        images: category.image ? [{ url: category.image, alt: category.name }] : undefined
      }
    };
  } catch {
    return {
      title: "Category",
      description: "Browse IE213 eyewear by category."
    };
  }
}

export default async function CategoryDetailPage({ params, searchParams }: CategoryDetailPageProps) {
  const { slug } = await params;
  const query = parseCatalogSearchParams(await searchParams, { limit: 12 });

  try {
    const category = await categoriesApi.getBySlug(slug);
    const categoryQuery = { ...query, categoryId: category._id };
    const [categoriesResult, productsResult] = await Promise.allSettled([
      categoriesApi.list(),
      productsApi.list(toProductListQuery(categoryQuery))
    ]);
    const categories = categoriesResult.status === "fulfilled" ? categoriesResult.value : [category];
    const products = productsResult.status === "fulfilled" ? productsResult.value.data ?? [] : [];
    const didLoadProducts = productsResult.status === "fulfilled";
    const pagination =
      productsResult.status === "fulfilled"
        ? getPagination(productsResult.value.meta)
        : { totalProducts: 0, currentPage: query.page, totalPages: 1, limit: query.limit };
    const errors = [categoriesResult, productsResult]
      .flatMap((result) =>
        result.status === "rejected" ? [getCatalogErrorMessage(result.reason)] : []
      );

    return (
      <main>
        <section className="relative overflow-hidden bg-ink text-white">
          {category.image ? (
            <Image
              src={category.image}
              alt={category.name}
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-55"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/20" />
          <div className="container-page relative grid min-h-[340px] content-end py-10">
            <p className="text-sm font-semibold text-white/80">Category</p>
            <h1 className="mt-2 max-w-2xl text-4xl font-semibold tracking-tight">{category.name}</h1>
            {category.description ? (
              <p className="mt-3 max-w-2xl text-base leading-7 text-white/80">{category.description}</p>
            ) : null}
          </div>
        </section>

        <section className="container-page py-8 sm:py-10">
          <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            <ProductFiltersPanel
              categories={categories}
              query={categoryQuery}
              basePath={`/categories/${slug}`}
              clearHref={`/categories/${slug}`}
              lockedCategoryId={category._id}
            />

            <section className="grid content-start gap-5 self-start">
              <div className="rounded-lg border border-line bg-white p-4 shadow-subtle">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-medium text-ink">
                    {pagination.totalProducts || products.length} products in {category.name}
                  </p>
                  <p className="rounded-md bg-surface px-2.5 py-1 text-xs font-semibold text-muted">
                    Sorted by {query.sort ?? "newest"}
                  </p>
                </div>
              </div>

              {errors.length ? <CatalogError message={errors[0]} /> : null}
              {didLoadProducts ? (
                <>
                  <ProductGrid products={products} emptyDescription="No active products are currently assigned to this category." />
                  <ProductPagination basePath={`/categories/${slug}`} pagination={pagination} query={categoryQuery} />
                </>
              ) : null}
            </section>
          </div>
        </section>
      </main>
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }

    return (
      <main className="container-page py-8 sm:py-10">
        <CatalogError message={getCatalogErrorMessage(error)} />
      </main>
    );
  }
}
