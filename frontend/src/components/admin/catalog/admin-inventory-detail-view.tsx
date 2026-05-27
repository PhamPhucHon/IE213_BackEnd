"use client";

import Link from "next/link";
import { useState } from "react";
import { getInventoryProduct, isLowStock } from "@/lib/admin/catalog-utils";
import { getLocalAdminCatalogErrorMessage } from "@/lib/api/local-admin-catalog";
import { useAdminInventorySku } from "@/lib/hooks/use-admin-catalog";
import { cn, formatDate } from "@/lib/utils";
import { AdminInventoryStockButton } from "./admin-inventory-stock-button";

type AdminInventoryDetailViewProps = {
  sku: string;
};

function InventoryDetailSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="h-72 rounded-lg bg-surface" />
      <div className="h-56 rounded-lg bg-surface" />
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
      <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        {getLocalAdminCatalogErrorMessage(error)}
      </div>
    );
  }

  if (!inventory) {
    return (
      <div className="rounded-lg border border-line bg-white p-8 text-center">
        <h2 className="text-xl font-semibold text-ink">SKU not found</h2>
        <Link href="/admin/inventory" className="mt-5 inline-flex text-sm font-semibold text-brand-600">
          Back to inventory
        </Link>
      </div>
    );
  }

  const product = getInventoryProduct(inventory);

  return (
    <div className="grid gap-6">
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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-lg border border-line bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">SKU</p>
              <h2 className="mt-2 break-all text-2xl font-semibold text-ink">{inventory.sku}</h2>
              <p className="mt-2 text-sm text-muted">Warehouse: {inventory.warehouse || "Default"}</p>
            </div>
            <span
              className={cn(
                "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
                isLowStock(inventory)
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              )}
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
              onError={setActionError}
              onSuccess={(nextInventory) => {
                setActionError(null);
                setMessage(`${nextInventory.sku} stock updated to ${nextInventory.stock}.`);
              }}
            />
          </div>
        </section>

        <aside className="grid gap-6 self-start">
          <section className="rounded-lg border border-line bg-white p-5">
            <h2 className="text-lg font-semibold text-ink">Product</h2>
            <div className="mt-4 grid gap-2 text-sm">
              <Link href={`/admin/products/${product.id}/edit`} className="font-semibold text-ink">
                {product.name}
              </Link>
              <p className="break-all text-muted">ID: {product.id}</p>
              {product.slug ? <p className="text-muted">Slug: /{product.slug}</p> : null}
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
