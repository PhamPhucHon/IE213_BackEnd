import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogError } from "@/components/catalog/catalog-error";
import { ProductGrid } from "@/components/product/product-grid";
import { ProductPagination } from "@/components/product/product-pagination";
import { ApiError } from "@/lib/api/http";
import { categoriesApi } from "@/lib/api/categories";
import { productsApi } from "@/lib/api/products";
import { getCatalogErrorMessage, getPagination } from "@/lib/catalog/product-utils";
import { parseCatalogSearchParams, type SearchParamsInput } from "@/lib/catalog/query";

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
  const categoryQuery = {
    page: query.page,
    limit: query.limit,
    sort: query.sort
  };

  try {
    const category = await categoriesApi.getBySlug(slug);
    const productsResult = await productsApi
      .listByCategory(category._id, categoryQuery)
      .then((result) => ({ result, error: null }))
      .catch((error: unknown) => ({ result: null, error }));

    const products = productsResult.result?.data ?? [];
    const pagination = productsResult.result
      ? getPagination(productsResult.result.meta)
      : { totalProducts: 0, currentPage: query.page, totalPages: 1, limit: query.limit };

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
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />
          <div className="container-page relative grid min-h-[320px] content-end py-10">
            <p className="text-sm font-semibold uppercase tracking-wide text-white/80">Category</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">{category.name}</h1>
            {category.description ? (
              <p className="mt-3 max-w-2xl text-base leading-7 text-white/80">{category.description}</p>
            ) : null}
          </div>
        </section>

        <section className="container-page grid gap-5 py-8 sm:py-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">
              {pagination.totalProducts || products.length} products in {category.name}
            </p>
            <form className="flex items-center gap-2" action={`/categories/${slug}`}>
              <input type="hidden" name="page" value="1" />
              <input type="hidden" name="limit" value={query.limit} />
              <label className="text-sm font-medium text-ink" htmlFor="category-sort">
                Sort
              </label>
              <select
                id="category-sort"
                name="sort"
                defaultValue={query.sort ?? "newest"}
                className="focus-ring rounded-md border border-line bg-white px-3 py-2 text-sm"
              >
                <option value="newest">Newest</option>
                <option value="topRated">Top rated</option>
                <option value="priceAsc">Price low to high</option>
                <option value="priceDesc">Price high to low</option>
              </select>
              <button
                type="submit"
                className="focus-ring rounded-md bg-ink px-3 py-2 text-sm font-medium text-white"
              >
                Apply
              </button>
            </form>
          </div>

          {productsResult.error ? <CatalogError message={getCatalogErrorMessage(productsResult.error)} /> : null}
          <ProductGrid products={products} emptyDescription="No active products are currently assigned to this category." />
          <ProductPagination basePath={`/categories/${slug}`} pagination={pagination} query={categoryQuery} />
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
