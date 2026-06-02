"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { LocalOrderError, getLocalOrderErrorMessage } from "@/lib/api/local-orders";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { useOrders } from "@/lib/hooks/use-orders";
import { getOrderPagination } from "@/lib/orders/order-utils";
import { formatCurrency, formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusAlert } from "@/components/ui/status-alert";
import { getButtonClassName } from "@/components/ui/style-primitives";
import { CancelOrderButton } from "./cancel-order-button";
import { OrderStatusBadge } from "./order-status-badge";

function pageFromSearchParams(searchParams: URLSearchParams) {
  const page = Number(searchParams.get("page"));
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function OrdersSkeleton() {
  return (
    <div className="grid gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-32" />
      ))}
    </div>
  );
}

export function OrdersView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const { data: user, isLoading: isLoadingUser } = useCurrentUser();
  const page = pageFromSearchParams(searchParams);
  const limit = 10;
  const { data: response, isLoading, error } = useOrders(page, limit, Boolean(user));
  const orders = response?.data ?? [];
  const pagination = getOrderPagination(response?.meta);

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
    return <OrdersSkeleton />;
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

  if (!orders.length) {
    return (
      <EmptyState
        title="No orders yet"
        description="Checkout your cart to create the first order."
        action={
          <Link href="/products" className={getButtonClassName("primary")}>
            Browse products
          </Link>
        }
      />
    );
  }

  function pageHref(nextPage: number) {
    const params = new URLSearchParams(searchParams);
    if (nextPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(nextPage));
    }

    const query = params.toString();
    return query ? `/orders?${query}` : "/orders";
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

      <div className="grid gap-4">
        {orders.map((order) => (
          <article key={order._id} className="rounded-lg border border-line bg-white p-4 shadow-subtle">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-muted">{formatDate(order.createdAt)}</p>
                <Link href={`/orders/${order._id}`} className="mt-1 block break-all text-lg font-semibold text-ink">
                  {order.orderNumber}
                </Link>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {order.items.slice(0, 4).map((item) => (
                <div key={item.sku} className="relative h-12 w-12 overflow-hidden rounded-md border border-line bg-surface">
                  {item.image ? (
                    <Image src={item.image} alt={item.name ?? "Order item"} fill sizes="48px" className="object-contain p-1" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] font-medium text-muted">
                      Item
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <p className="text-muted">Items</p>
                <p className="font-medium text-ink">{order.items.reduce((total, item) => total + item.quantity, 0)}</p>
              </div>
              <div>
                <p className="text-muted">Payment</p>
                <p className="font-medium text-ink">{order.paymentMethod}</p>
              </div>
              <div>
                <p className="text-muted">Total</p>
                <p className="font-semibold text-ink">{formatCurrency(order.totalPrice)}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-2 min-[390px]:flex min-[390px]:flex-wrap">
              <Link
                href={`/orders/${order._id}`}
                className={getButtonClassName("primary", "w-full px-3 min-[390px]:w-auto")}
              >
                View detail
              </Link>
              <CancelOrderButton
                order={order}
                onError={setActionError}
                onSuccess={() => {
                  setActionError(null);
                  setMessage("Order cancelled.");
                }}
              />
            </div>
          </article>
        ))}
      </div>

      {pagination.totalPages > 1 ? (
        <nav className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
          <p className="text-sm text-muted">
            Page {pagination.currentPage} of {pagination.totalPages}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href={pageHref(Math.max(1, pagination.currentPage - 1))}
              className={getButtonClassName("secondary", "h-9 px-3 aria-disabled:pointer-events-none aria-disabled:opacity-50")}
              aria-disabled={pagination.currentPage <= 1}
              tabIndex={pagination.currentPage <= 1 ? -1 : undefined}
            >
              Previous
            </Link>
            <Link
              href={pageHref(Math.min(pagination.totalPages, pagination.currentPage + 1))}
              className={getButtonClassName("secondary", "h-9 px-3 aria-disabled:pointer-events-none aria-disabled:opacity-50")}
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
