"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LocalOrderError, getLocalOrderErrorMessage } from "@/lib/api/local-orders";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { useOrder } from "@/lib/hooks/use-orders";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CancelOrderButton } from "./cancel-order-button";
import { OrderStatusBadge } from "./order-status-badge";
import { OrderTimeline } from "./order-timeline";

type OrderDetailViewProps = {
  id: string;
};

function OrderDetailSkeleton() {
  return (
    <div className="grid gap-6">
      <div className="h-40 rounded-lg bg-surface" />
      <div className="h-72 rounded-lg bg-surface" />
    </div>
  );
}

export function OrderDetailView({ id }: OrderDetailViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [actionError, setActionError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const { data: user, isLoading: isLoadingUser } = useCurrentUser();
  const { data: order, isLoading, error } = useOrder(id, Boolean(user && id));

  useEffect(() => {
    if (!isLoadingUser && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isLoadingUser, pathname, router, user]);

  useEffect(() => {
    if (error instanceof LocalOrderError && error.status === 401) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [error, pathname, router]);

  if (isLoadingUser || (user && isLoading)) {
    return <OrderDetailSkeleton />;
  }

  if (!user) {
    return null;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        {getLocalOrderErrorMessage(error)}
      </div>
    );
  }

  if (!order) {
    return (
      <div className="rounded-lg border border-line bg-white p-8 text-center">
        <h2 className="text-xl font-semibold text-ink">Order not found</h2>
        <Link href="/orders" className="mt-5 inline-flex text-sm font-medium text-brand-600">
          Back to orders
        </Link>
      </div>
    );
  }

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

      <section className="rounded-lg border border-line bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted">{formatDate(order.createdAt)}</p>
            <h2 className="mt-1 text-2xl font-semibold text-ink">{order.orderNumber}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <OrderStatusBadge status={order.status} />
            <CancelOrderButton
              order={order}
              onError={setActionError}
              onSuccess={() => {
                setActionError(null);
                setMessage("Order cancelled.");
              }}
            />
          </div>
        </div>
        <div className="mt-6">
          <OrderTimeline status={order.status} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-lg border border-line bg-white p-5">
          <h2 className="text-lg font-semibold text-ink">Items</h2>
          <div className="mt-5 grid gap-4">
            {order.items.map((item) => (
              <article key={item.sku} className="grid grid-cols-[72px_1fr] gap-3">
                <div className="relative aspect-square overflow-hidden rounded-md bg-surface">
                  {item.image ? (
                    <Image src={item.image} alt={item.name ?? item.sku} fill sizes="72px" className="object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <h3 className="font-medium text-ink">{item.name ?? item.sku}</h3>
                  <p className="mt-1 text-xs text-muted">SKU: {item.sku}</p>
                  <p className="mt-2 text-sm text-muted">
                    {item.quantity} x {formatCurrency(item.price)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="grid gap-6 self-start">
          <section className="rounded-lg border border-line bg-white p-5">
            <h2 className="text-lg font-semibold text-ink">Shipping</h2>
            <div className="mt-4 grid gap-2 text-sm">
              <p className="font-medium text-ink">{order.shippingAddress.fullName}</p>
              <p className="text-muted">{order.shippingAddress.phone}</p>
              <p className="text-muted">{order.shippingAddress.address}</p>
            </div>
          </section>

          <section className="rounded-lg border border-line bg-white p-5">
            <h2 className="text-lg font-semibold text-ink">Summary</h2>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted">Items</span>
                <span className="font-medium text-ink">{formatCurrency(order.itemsPrice)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted">Shipping</span>
                <span className="font-medium text-ink">{formatCurrency(order.shippingPrice)}</span>
              </div>
              <div className="flex justify-between gap-3 border-t border-line pt-3">
                <span className="font-semibold text-ink">Total</span>
                <span className="font-semibold text-ink">{formatCurrency(order.totalPrice)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted">Payment</span>
                <span className="font-medium text-ink">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted">Paid</span>
                <span className="font-medium text-ink">{order.isPaid ? "Yes" : "No"}</span>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
