"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import type { Inventory } from "@/types/models";
import {
  getInventoryPagination,
  getInventoryProduct,
  isLowStock
} from "@/lib/admin/catalog-utils";
import { getLocalAdminCatalogErrorMessage } from "@/lib/api/local-admin-catalog";
import { useAdminInventory } from "@/lib/hooks/use-admin-catalog";
import { cn, formatDate } from "@/lib/utils";
import { AdminInventoryStockButton } from "./admin-inventory-stock-button";

function pageFromSearchParams(searchParams: URLSearchParams) {
  const page = Number(searchParams.get("page"));
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function lowStockFromSearchParams(value: string | null) {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function pageHref(searchParams: URLSearchParams, page: number) {
  const params = new URLSearchParams(searchParams);
  if (page <= 1) {
    params.delete("page");
  } else {
    params.set("page", String(page));
  }

  const query = params.toString();
  return query ? `/admin/inventory?${query}` : "/admin/inventory";
}

function stockBadge(inventory: Inventory) {
  if (isLowStock(inventory)) {
    return "Low stock";
  }

  return "Healthy";
}

function InventorySkeleton() {
  return (
    <div className="grid gap-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="h-24 rounded-lg bg-surface" />
      ))}
    </div>
  );
}

function InventoryFilterForm({ searchParams }: { searchParams: URLSearchParams }) {
  return (
    <form className="grid gap-3 rounded-lg border border-line bg-white p-4 md:grid-cols-[1fr_180px_auto]" action="/admin/inventory">
      <input
        name="productId"
        defaultValue={searchParams.get("productId") ?? ""}
        className="focus-ring rounded-md border border-line px-3 py-2 text-sm"
        placeholder="Filter by product ID"
      />
      <select
        name="lowStock"
        defaultValue={searchParams.get("lowStock") ?? ""}
        className="focus-ring rounded-md border border-line bg-white px-3 py-2 text-sm"
      >
        <option value="">All stock</option>
        <option value="true">Low stock</option>
        <option value="false">Healthy stock</option>
      </select>
      <input type="hidden" name="page" value="1" />
      <div className="flex gap-2">
        <button
          type="submit"
          className="focus-ring rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white"
        >
          Apply
        </button>
        <Link
          href="/admin/inventory"
          className="focus-ring rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-surface"
        >
          Clear
        </Link>
      </div>
    </form>
  );
}

export function AdminInventoryView() {
  const searchParams = useSearchParams();
  const page = pageFromSearchParams(searchParams);
  const lowStock = lowStockFromSearchParams(searchParams.get("lowStock"));
  const productId = searchParams.get("productId")?.trim() || undefined;
  const { data: response, isLoading, error } = useAdminInventory({
    page,
    limit: 20,
    lowStock,
    productId
  });
  const inventory = response?.data ?? [];
  const pagination = getInventoryPagination(response?.meta);
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (isLoading) {
    return <InventorySkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        {getLocalAdminCatalogErrorMessage(error)}
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

      <InventoryFilterForm searchParams={searchParams} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">{pagination.totalInventories || inventory.length} SKU rows</p>
        <p className="text-sm text-muted">Low stock means available quantity below 10.</p>
      </div>

      {!inventory.length ? (
        <div className="rounded-lg border border-line bg-white p-8 text-center">
          <h2 className="text-xl font-semibold text-ink">No inventory rows found</h2>
          <p className="mt-2 text-sm text-muted">Try another filter or create product variants first.</p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-lg border border-line bg-white lg:block">
            <table className="min-w-full divide-y divide-line text-sm">
              <thead className="bg-surface text-left text-xs font-semibold uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3 text-right">Stock</th>
                  <th className="px-4 py-3 text-right">Reserved</th>
                  <th className="px-4 py-3 text-right">Available</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {inventory.map((item) => {
                  const product = getInventoryProduct(item);
                  return (
                    <tr key={item._id} className={cn(isLowStock(item) && "bg-amber-50/50")}>
                      <td className="px-4 py-4">
                        <Link href={`/admin/inventory/${encodeURIComponent(item.sku)}`} className="font-semibold text-ink">
                          {item.sku}
                        </Link>
                        <p className="mt-1 text-xs text-muted">Restocked {formatDate(item.lastRestocked)}</p>
                      </td>
                      <td className="px-4 py-4 text-muted">
                        <Link href={`/admin/products/${product.id}/edit`} className="font-medium text-ink">
                          {product.name}
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-right font-semibold text-ink">{item.stock}</td>
                      <td className="px-4 py-4 text-right text-muted">{item.reserved}</td>
                      <td className="px-4 py-4 text-right font-semibold text-ink">{item.available}</td>
                      <td className="px-4 py-4">
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
                            isLowStock(item)
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : "border-emerald-200 bg-emerald-50 text-emerald-700"
                          )}
                        >
                          {stockBadge(item)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/admin/inventory/${encodeURIComponent(item.sku)}`}
                            className="focus-ring inline-flex h-9 items-center justify-center rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink hover:bg-surface"
                          >
                            Detail
                          </Link>
                          <AdminInventoryStockButton
                            inventory={item}
                            onError={(errorMessage) => {
                              setMessage(null);
                              setActionError(errorMessage);
                            }}
                            onSuccess={(nextItem) => {
                              setActionError(null);
                              setMessage(`${nextItem.sku} stock updated to ${nextItem.stock}.`);
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 lg:hidden">
            {inventory.map((item) => {
              const product = getInventoryProduct(item);
              return (
                <article
                  key={item._id}
                  className={cn(
                    "rounded-lg border bg-white p-4",
                    isLowStock(item) ? "border-amber-200" : "border-line"
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Link href={`/admin/inventory/${encodeURIComponent(item.sku)}`} className="font-semibold text-ink">
                        {item.sku}
                      </Link>
                      <p className="mt-1 text-sm text-muted">{product.name}</p>
                    </div>
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
                        isLowStock(item)
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700"
                      )}
                    >
                      {stockBadge(item)}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-muted">Stock</p>
                      <p className="font-semibold text-ink">{item.stock}</p>
                    </div>
                    <div>
                      <p className="text-muted">Reserved</p>
                      <p className="font-semibold text-ink">{item.reserved}</p>
                    </div>
                    <div>
                      <p className="text-muted">Available</p>
                      <p className="font-semibold text-ink">{item.available}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={`/admin/inventory/${encodeURIComponent(item.sku)}`}
                      className="focus-ring rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white"
                    >
                      Detail
                    </Link>
                    <AdminInventoryStockButton
                      inventory={item}
                      onError={(errorMessage) => {
                        setMessage(null);
                        setActionError(errorMessage);
                      }}
                      onSuccess={(nextItem) => {
                        setActionError(null);
                        setMessage(`${nextItem.sku} stock updated to ${nextItem.stock}.`);
                      }}
                    />
                  </div>
                </article>
              );
            })}
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
