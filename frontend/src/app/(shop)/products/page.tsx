import { CatalogError } from "@/components/catalog/catalog-error";
import { PageHeader } from "@/components/layout/page-header";
import { ProductFiltersPanel } from "@/components/product/product-filters";
import { ProductGrid } from "@/components/product/product-grid";
import { ProductPagination } from "@/components/product/product-pagination";
import { categoriesApi } from "@/lib/api/categories";
import { productsApi } from "@/lib/api/products";
import { getCatalogErrorMessage, getPagination } from "@/lib/catalog/product-utils";
import {
  parseCatalogSearchParams,
  toProductListQuery,
  type SearchParamsInput
} from "@/lib/catalog/query";

export const revalidate = 60;

type ProductsPageProps = {
  searchParams: Promise<SearchParamsInput>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const query = parseCatalogSearchParams(params, { limit: 12 });
  const [categoriesResult, productsResult] = await Promise.allSettled([
    categoriesApi.list(),
    productsApi.list(toProductListQuery(query))
  ]);
  const categories = categoriesResult.status === "fulfilled" ? categoriesResult.value : [];
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
    <main className="container-page py-8 sm:py-10">
      <PageHeader
        eyebrow="Catalog"
        title="Products"
        description="Search, filter, sort, and browse the IE213 eyewear catalog."
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <ProductFiltersPanel categories={categories} query={query} />

        <section className="grid gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">
              {pagination.totalProducts || products.length} products
              {query.keyword ? ` for "${query.keyword}"` : ""}
            </p>
            <p className="text-sm text-muted">Sorted by {query.sort ?? "newest"}</p>
          </div>

          {errors.length ? <CatalogError message={errors[0]} /> : null}

          {didLoadProducts ? (
            <>
              <ProductGrid products={products} />
              <ProductPagination basePath="/products" pagination={pagination} query={query} />
            </>
          ) : null}
        </section>
      </div>
    </main>
  );
}
