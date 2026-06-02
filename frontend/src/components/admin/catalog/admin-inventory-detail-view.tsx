"use client";

import Link from "next/link";
import { useState } from "react";
import { getInventoryProduct, isLowStock } from "@/lib/admin/catalog-utils";
import { getLocalAdminCatalogErrorMessage } from "@/lib/api/local-admin-catalog";
import { useAdminInventorySku } from "@/lib/hooks/use-admin-catalog";
import { formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusAlert } from "@/components/ui/status-alert";
import { getBadgeClassName, getButtonClassName } from "@/components/ui/style-primitives";
import { AdminInventoryStockButton } from "./admin-inventory-stock-button";

type AdminInventoryDetailViewProps = {
  sku: string;
};

function InventoryDetailSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Skeleton className="h-72 rounded-lg" />
      <Skeleton className="h-56 rounded-lg" />
    </div>
  );
}

export function AdminInventoryDetailView({ sku }: AdminInventoryDetailViewProps) {
  const { data: inventory, isLoading, error } = useAdminInventorySku(sku, Boolean(sku));
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (isLoading) {
    return <InventoryDetailSkeleton />;
  }

  if (error) {
    return (
      <StatusAlert tone="error" className="p-5">
        {getLocalAdminCatalogErrorMessage(error)}
      </StatusAlert>
    );
  }

  if (!inventory) {
    return (
      <EmptyState
        title="SKU not found"
        description="This inventory row may have been removed or the SKU may be invalid."
        action={
          <Link href="/admin/inventory" className={getButtonClassName("secondary")}>
            Back to inventory
          </Link>
        }
      />
    );
  }

  const product = getInventoryProduct(inventory);

  return (
    <div className="grid gap-6">
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-lg border border-line bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">SKU</p>
              <h2 className="mt-2 break-all text-2xl font-semibold text-ink">{inventory.sku}</h2>
              <p className="mt-2 text-sm text-muted">Warehouse: {inventory.warehouse || "Default"}</p>
            </div>
            <span
              className={getBadgeClassName(isLowStock(inventory) ? "warning" : "success", "px-2.5 py-1")}
            >
              {isLowStock(inventory) ? "Low stock" : "Healthy"}
            </span>
          </div>

          <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
            <div className="rounded-md bg-surface p-4">
              <dt className="text-muted">Stock</dt>
              <dd className="mt-2 text-2xl font-semibold text-ink">{inventory.stock}</dd>
            </div>
            <div className="rounded-md bg-surface p-4">
              <dt className="text-muted">Reserved</dt>
              <dd className="mt-2 text-2xl font-semibold text-ink">{inventory.reserved}</dd>
            </div>
            <div className="rounded-md bg-surface p-4">
              <dt className="text-muted">Available</dt>
              <dd className="mt-2 text-2xl font-semibold text-ink">{inventory.available}</dd>
            </div>
          </dl>

          <div className="mt-6">
            <AdminInventoryStockButton
              inventory={inventory}
              onError={(errorMessage) => {
                setMessage(null);
                setActionError(errorMessage);
              }}
              onSuccess={(nextInventory) => {
                setActionError(null);
                setMessage(`${nextInventory.sku} stock updated to ${nextInventory.stock}.`);
              }}
            />
          </div>
        </section>

        <aside className="grid gap-6 self-start md:grid-cols-2 xl:grid-cols-1">
          <section className="rounded-lg border border-line bg-white p-5">
            <h2 className="text-lg font-semibold text-ink">Product</h2>
            <div className="mt-4 grid gap-2 text-sm">
              <Link href={`/admin/products/${product.id}/edit`} className="break-words font-semibold text-ink">
                {product.name}
              </Link>
              <p className="break-all text-muted">ID: {product.id}</p>
              {product.slug ? <p className="break-all text-muted">Slug: /{product.slug}</p> : null}
            </div>
          </section>

          <section className="rounded-lg border border-line bg-white p-5">
            <h2 className="text-lg font-semibold text-ink">Audit</h2>
            <div className="mt-4 grid gap-2 text-sm text-muted">
              <p>Last restocked: {formatDate(inventory.lastRestocked) || "Not recorded"}</p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
