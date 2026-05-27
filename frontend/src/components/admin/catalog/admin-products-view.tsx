"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import type { Category, Product } from "@/types/models";
import { getPagination } from "@/lib/catalog/product-utils";
import {
  getCategoryName,
  getProductImage,
  getProductPrice
} from "@/lib/catalog/product-utils";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  getLocalAdminCatalogErrorMessage,
  hideAdminProduct
} from "@/lib/api/local-admin-catalog";
import {
  adminInventoryQueryKey,
  adminProductsQueryKey,
  useAdminCategories,
  useAdminProducts
} from "@/lib/hooks/use-admin-catalog";
import type { ProductListQuery } from "@/lib/api/products";
import { useConfirm } from "@/components/ui/confirm-provider";
import { useToast } from "@/components/ui/toast-provider";

function pageFromSearchParams(searchParams: URLSearchParams) {
  const page = Number(searchParams.get("page"));
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function productTypeFromSearchParams(value: string | null) {
  return value === "Sunglasses" || value === "Eyeglasses" ? value : undefined;
}

function productSortFromSearchParams(value: string | null) {
  return value === "priceAsc" || value === "priceDesc" || value === "topRated" || value === "newest"
    ? value
    : undefined;
}

function cleanQuery(searchParams: URLSearchParams): ProductListQuery {
  return {
    page: pageFromSearchParams(searchParams),
    limit: 10,
    keyword: searchParams.get("keyword")?.trim() || undefined,
    categoryId: searchParams.get("categoryId") || undefined,
    brand: searchParams.get("brand")?.trim() || undefined,
    type: productTypeFromSearchParams(searchParams.get("type")),
    sort: productSortFromSearchParams(searchParams.get("sort")) ?? "newest"
  };
}

function pageHref(searchParams: URLSearchParams, page: number) {
  const params = new URLSearchParams(searchParams);
  if (page <= 1) {
    params.delete("page");
  } else {
    params.set("page", String(page));
  }

  const query = params.toString();
  return query ? `/admin/products?${query}` : "/admin/products";
}

function ProductStatusBadge({ product }: { product: Product }) {
  return (
    <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
      {product.isActive === false ? "Hidden" : "Active"}
    </span>
  );
}

function ProductsSkeleton() {
  return (
    <div className="grid gap-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="h-28 rounded-lg bg-surface" />
      ))}
    </div>
  );
}

function ProductFilters({
  categories,
  searchParams
}: {
  categories: Category[];
  searchParams: URLSearchParams;
}) {
  return (
    <form className="grid gap-3 rounded-lg border border-line bg-white p-4 md:grid-cols-5" action="/admin/products">
      <input
        name="keyword"
        defaultValue={searchParams.get("keyword") ?? ""}
        className="focus-ring rounded-md border border-line px-3 py-2 text-sm md:col-span-2"
        placeholder="Search products"
      />
      <select
        name="categoryId"
        defaultValue={searchParams.get("categoryId") ?? ""}
        className="focus-ring rounded-md border border-line bg-white px-3 py-2 text-sm"
      >
        <option value="">All categories</option>
        {categories.map((category) => (
          <option key={category._id} value={category._id}>
            {category.name}
          </option>
        ))}
      </select>
      <select
        name="type"
        defaultValue={searchParams.get("type") ?? ""}
        className="focus-ring rounded-md border border-line bg-white px-3 py-2 text-sm"
      >
        <option value="">All types</option>
        <option value="Sunglasses">Sunglasses</option>
        <option value="Eyeglasses">Eyeglasses</option>
      </select>
      <select
        name="sort"
        defaultValue={searchParams.get("sort") ?? "newest"}
        className="focus-ring rounded-md border border-line bg-white px-3 py-2 text-sm"
      >
        <option value="newest">Newest</option>
        <option value="topRated">Top rated</option>
        <option value="priceAsc">Price low to high</option>
        <option value="priceDesc">Price high to low</option>
      </select>
      <input type="hidden" name="page" value="1" />
      <div className="flex gap-2 md:col-span-5">
        <button
          type="submit"
          className="focus-ring rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white"
        >
          Apply
        </button>
        <Link
          href="/admin/products"
          className="focus-ring rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-surface"
        >
          Clear
        </Link>
      </div>
    </form>
  );
}

export function AdminProductsView() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { showToast } = useToast();
  const query = useMemo(() => cleanQuery(searchParams), [searchParams]);
  const productsQuery = useAdminProducts(query);
  const categoriesQuery = useAdminCategories();
  const products = productsQuery.data?.data ?? [];
  const pagination = getPagination(productsQuery.data?.meta);
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const hideMutation = useMutation({
    mutationFn: hideAdminProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminProductsQueryKey });
      queryClient.invalidateQueries({ queryKey: adminInventoryQueryKey });
      setActionError(null);
      setMessage("Product hidden.");
      showToast({ title: "Product hidden", variant: "success" });
    },
    onError: (mutationError) => {
      const message = getLocalAdminCatalogErrorMessage(mutationError);
      setActionError(message);
      showToast({ title: "Could not hide product", description: message, variant: "error" });
    }
  });

  if (productsQuery.isLoading || categoriesQuery.isLoading) {
    return <ProductsSkeleton />;
  }

  if (productsQuery.error || categoriesQuery.error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        {getLocalAdminCatalogErrorMessage(productsQuery.error ?? categoriesQuery.error)}
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      {message ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}
      {actionError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {actionError}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">{pagination.totalProducts || products.length} active products</p>
        <Link
          href="/admin/products/new"
          className="focus-ring rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white"
        >
          New product
        </Link>
      </div>

      <ProductFilters categories={categoriesQuery.data ?? []} searchParams={searchParams} />

      {!products.length ? (
        <div className="rounded-lg border border-line bg-white p-8 text-center">
          <h2 className="text-xl font-semibold text-ink">No products found</h2>
          <p className="mt-2 text-sm text-muted">Create a product or clear the current filters.</p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-lg border border-line bg-white lg:block">
            <table className="min-w-full divide-y divide-line text-sm">
              <thead className="bg-surface text-left text-xs font-semibold uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Variants</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {products.map((product) => (
                  <tr key={product._id}>
                    <td className="px-4 py-4">
                      <div className="grid grid-cols-[56px_1fr] gap-3">
                        <div className="relative aspect-square overflow-hidden rounded-md bg-surface">
                          {getProductImage(product) ? (
                            <Image
                              src={getProductImage(product) as string}
                              alt={product.name}
                              fill
                              sizes="56px"
                              className="object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <Link href={`/admin/products/${product._id}/edit`} className="font-semibold text-ink">
                            {product.name}
                          </Link>
                          <p className="mt-1 text-muted">{product.brand}</p>
                          <p className="mt-1 text-xs text-muted">Updated {formatDate(product.updatedAt)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-muted">{getCategoryName(product.categoryId) || "Unknown"}</td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-ink">{product.type}</p>
                      <ProductStatusBadge product={product} />
                    </td>
                    <td className="px-4 py-4 font-semibold text-ink">
                      {formatCurrency(getProductPrice(product))}
                    </td>
                    <td className="px-4 py-4 text-muted">{product.variants.length}</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/products/${product._id}/edit`}
                          className="focus-ring inline-flex h-9 items-center justify-center rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink hover:bg-surface"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          className="focus-ring rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={hideMutation.isPending}
                          onClick={async () => {
                            const confirmed = await confirm({
                              title: "Hide product?",
                              description: `${product.name} will be soft-hidden from the storefront if no reserved stock blocks it.`,
                              confirmLabel: "Hide product",
                              destructive: true
                            });

                            if (confirmed) {
                              hideMutation.mutate(product._id);
                            }
                          }}
                        >
                          Hide
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 lg:hidden">
            {products.map((product) => (
              <article key={product._id} className="rounded-lg border border-line bg-white p-4">
                <div className="grid grid-cols-[84px_1fr] gap-3">
                  <div className="relative aspect-square overflow-hidden rounded-md bg-surface">
                    {getProductImage(product) ? (
                      <Image
                        src={getProductImage(product) as string}
                        alt={product.name}
                        fill
                        sizes="84px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <Link href={`/admin/products/${product._id}/edit`} className="font-semibold text-ink">
                      {product.name}
                    </Link>
                    <p className="mt-1 text-sm text-muted">{product.brand}</p>
                    <p className="mt-2 font-semibold text-ink">{formatCurrency(getProductPrice(product))}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted">
                  <ProductStatusBadge product={product} />
                  <span>{product.type}</span>
                  <span>{product.variants.length} variants</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/admin/products/${product._id}/edit`}
                    className="focus-ring rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    className="focus-ring rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={hideMutation.isPending}
                    onClick={async () => {
                      const confirmed = await confirm({
                        title: "Hide product?",
                        description: `${product.name} will be soft-hidden from the storefront if no reserved stock blocks it.`,
                        confirmLabel: "Hide product",
                        destructive: true
                      });

                      if (confirmed) {
                        hideMutation.mutate(product._id);
                      }
                    }}
                  >
                    Hide
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {pagination.totalPages > 1 ? (
        <nav className="flex items-center justify-between border-t border-line pt-5">
          <p className="text-sm text-muted">
            Page {pagination.currentPage} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Link
              href={pageHref(searchParams, Math.max(1, pagination.currentPage - 1))}
              className="focus-ring rounded-md border border-line bg-white px-3 py-2 text-sm font-medium text-ink aria-disabled:pointer-events-none aria-disabled:opacity-50"
              aria-disabled={pagination.currentPage <= 1}
            >
              Previous
            </Link>
            <Link
              href={pageHref(searchParams, Math.min(pagination.totalPages, pagination.currentPage + 1))}
              className="focus-ring rounded-md border border-line bg-white px-3 py-2 text-sm font-medium text-ink aria-disabled:pointer-events-none aria-disabled:opacity-50"
              aria-disabled={pagination.currentPage >= pagination.totalPages}
            >
              Next
            </Link>
          </div>
        </nav>
      ) : null}
    </div>
  );
}
