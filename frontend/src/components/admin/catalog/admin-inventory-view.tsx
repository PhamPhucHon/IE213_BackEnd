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
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusAlert } from "@/components/ui/status-alert";
import {
  fieldClassName,
  getBadgeClassName,
  getButtonClassName,
  selectClassName
} from "@/components/ui/style-primitives";
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
        <Skeleton key={index} className="h-24 rounded-lg" />
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
        className={fieldClassName}
        placeholder="Filter by product ID"
      />
      <select
        name="lowStock"
        defaultValue={searchParams.get("lowStock") ?? ""}
        className={selectClassName}
      >
        <option value="">All stock</option>
        <option value="true">Low stock</option>
        <option value="false">Healthy stock</option>
      </select>
      <input type="hidden" name="page" value="1" />
      <div className="grid gap-2 min-[390px]:flex">
        <button
          type="submit"
          className={getButtonClassName("primary", "w-full min-[390px]:w-auto")}
        >
          Apply
        </button>
        <Link
          href="/admin/inventory"
          className={getButtonClassName("secondary", "w-full min-[390px]:w-auto")}
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
      <StatusAlert tone="error" className="p-5">
        {getLocalAdminCatalogErrorMessage(error)}
      </StatusAlert>
    );
  }

  return (
    <div className="grid gap-5">
      {message ? (
        <StatusAlert tone="success">
          {message}
        </StatusAlert>
      ) : null}
      {actionError ? (
        <StatusAlert tone="error">
          {actionError}
        </StatusAlert>
      ) : null}

      <InventoryFilterForm searchParams={searchParams} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">{pagination.totalInventories || inventory.length} SKU rows</p>
        <p className="text-sm text-muted">Low stock means available quantity below 10.</p>
      </div>

      {!inventory.length ? (
        <EmptyState
          title="No inventory rows found"
          description="Try another filter or create product variants first."
        />
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-lg border border-line bg-white xl:block">
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
                    <tr key={item._id} className={cn(isLowStock(item) && "bg-warning-50/50")}>
                      <td className="px-4 py-4">
                        <Link href={`/admin/inventory/${encodeURIComponent(item.sku)}`} className="break-all font-semibold text-ink">
                          {item.sku}
                        </Link>
                        <p className="mt-1 text-xs text-muted">Restocked {formatDate(item.lastRestocked)}</p>
                      </td>
                      <td className="px-4 py-4 text-muted">
                        <Link href={`/admin/products/${product.id}/edit`} className="break-words font-medium text-ink">
                          {product.name}
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-right font-semibold text-ink">{item.stock}</td>
                      <td className="px-4 py-4 text-right text-muted">{item.reserved}</td>
                      <td className="px-4 py-4 text-right font-semibold text-ink">{item.available}</td>
                      <td className="px-4 py-4">
                        <span
                          className={getBadgeClassName(isLowStock(item) ? "warning" : "success", "px-2.5 py-1")}
                        >
                          {stockBadge(item)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/admin/inventory/${encodeURIComponent(item.sku)}`}
                            className={getButtonClassName("secondary", "px-3")}
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

          <div className="grid gap-4 xl:hidden">
            {inventory.map((item) => {
              const product = getInventoryProduct(item);
              return (
                <article
                  key={item._id}
                  className={cn(
                    "rounded-lg border bg-white p-4",
                    isLowStock(item) ? "border-warning-200" : "border-line"
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/admin/inventory/${encodeURIComponent(item.sku)}`} className="break-all font-semibold text-ink">
                        {item.sku}
                      </Link>
                      <p className="mt-1 break-words text-sm text-muted">{product.name}</p>
                    </div>
                    <span
                      className={getBadgeClassName(isLowStock(item) ? "warning" : "success", "px-2.5 py-1")}
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
                  <div className="mt-4 grid gap-2 min-[390px]:flex min-[390px]:flex-wrap">
                    <Link
                      href={`/admin/inventory/${encodeURIComponent(item.sku)}`}
                      className={getButtonClassName("primary", "px-3")}
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
        <nav className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
          <p className="text-sm text-muted">
            Page {pagination.currentPage} of {pagination.totalPages}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href={pageHref(searchParams, Math.max(1, pagination.currentPage - 1))}
              className={getButtonClassName("secondary", "px-3 aria-disabled:pointer-events-none aria-disabled:opacity-50")}
              aria-disabled={pagination.currentPage <= 1}
              tabIndex={pagination.currentPage <= 1 ? -1 : undefined}
            >
              Previous
            </Link>
            <Link
              href={pageHref(searchParams, Math.min(pagination.totalPages, pagination.currentPage + 1))}
              className={getButtonClassName("secondary", "px-3 aria-disabled:pointer-events-none aria-disabled:opacity-50")}
              aria-disabled={pagination.currentPage >= pagination.totalPages}
              tabIndex={pagination.currentPage >= pagination.totalPages ? -1 : undefined}
            >
              Next
            </Link>
          </div>
        </nav>
      ) : null}
    </div>
  );
}
