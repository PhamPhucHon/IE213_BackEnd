"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LocalOrderError, getLocalOrderErrorMessage } from "@/lib/api/local-orders";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { useOrder } from "@/lib/hooks/use-orders";
import { formatCurrency, formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusAlert } from "@/components/ui/status-alert";
import { getButtonClassName } from "@/components/ui/style-primitives";
import { CancelOrderButton } from "./cancel-order-button";
import { OrderStatusBadge } from "./order-status-badge";
import { OrderTimeline } from "./order-timeline";

type OrderDetailViewProps = {
  id: string;
  ordersPath?: string;
};

function OrderDetailSkeleton() {
  return (
    <div className="grid gap-6">
      <Skeleton className="h-40" />
      <Skeleton className="h-72" />
    </div>
  );
}

export function OrderDetailView({ id, ordersPath = "/account/orders" }: OrderDetailViewProps) {
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
      <StatusAlert tone="error">
        {getLocalOrderErrorMessage(error)}
      </StatusAlert>
    );
  }

  if (!order) {
    return (
      <EmptyState
        title="Order not found"
        description="The order may have been removed or the link may be invalid."
        action={
          <Link href={ordersPath} className={getButtonClassName("primary")}>
            Back to orders
          </Link>
        }
      />
    );
  }

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

      <section className="rounded-lg border border-line bg-white p-5 shadow-subtle">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-muted">{formatDate(order.createdAt)}</p>
            <h2 className="mt-1 break-all text-2xl font-semibold text-ink">{order.orderNumber}</h2>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
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
        <section className="rounded-lg border border-line bg-white p-5 shadow-subtle">
          <h2 className="text-lg font-semibold text-ink">Items</h2>
          <div className="mt-5 grid gap-4">
            {order.items.map((item) => (
              <article
                key={item.sku}
                className="grid grid-cols-[132px_minmax(0,1fr)] gap-4 rounded-md border border-line bg-surface p-4 sm:grid-cols-[168px_minmax(0,1fr)]"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-white">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name ?? "Order item"}
                      fill
                      sizes="(min-width: 640px) 168px, 132px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs font-medium text-muted">
                      Item
                    </div>
                  )}
                </div>
                <div className="min-w-0 self-center">
                  <h3 className="break-words font-medium text-ink">{item.name ?? "Ordered item"}</h3>
                  <p className="mt-1 break-all text-xs text-muted">SKU {item.sku}</p>
                  <p className="mt-2 text-sm text-muted">
                    {item.quantity} x {formatCurrency(item.price)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="grid gap-6 self-start lg:sticky lg:top-24">
          <section className="rounded-lg border border-line bg-white p-5 shadow-subtle">
            <h2 className="text-lg font-semibold text-ink">Shipping</h2>
            <div className="mt-4 grid gap-2 text-sm">
              <p className="font-medium text-ink">{order.shippingAddress.fullName}</p>
              <p className="break-words text-muted">{order.shippingAddress.phone}</p>
              <p className="break-words text-muted">{order.shippingAddress.address}</p>
            </div>
          </section>

          <section className="rounded-lg border border-line bg-white p-5 shadow-subtle">
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
