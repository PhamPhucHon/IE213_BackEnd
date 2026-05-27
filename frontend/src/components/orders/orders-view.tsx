"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { LocalOrderError, getLocalOrderErrorMessage } from "@/lib/api/local-orders";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { useOrders } from "@/lib/hooks/use-orders";
import { getOrderPagination } from "@/lib/orders/order-utils";
import { formatCurrency, formatDate } from "@/lib/utils";
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
        <div key={index} className="h-28 rounded-lg bg-surface" />
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
      <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        {getLocalOrderErrorMessage(error)}
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="rounded-lg border border-line bg-white p-8 text-center">
        <h2 className="text-xl font-semibold text-ink">No orders yet</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Checkout your cart to create the first order.</p>
        <Link
          href="/products"
          className="focus-ring mt-5 inline-flex rounded-md bg-ink px-4 py-2 text-sm font-medium text-white"
        >
          Browse products
        </Link>
      </div>
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
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}
      {actionError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {actionError}
        </p>
      ) : null}

      <div className="grid gap-4">
        {orders.map((order) => (
          <article key={order._id} className="rounded-lg border border-line bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted">{formatDate(order.createdAt)}</p>
                <Link href={`/orders/${order._id}`} className="mt-1 block text-lg font-semibold text-ink">
                  {order.orderNumber}
                </Link>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>
            <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
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
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/orders/${order._id}`}
                className="focus-ring rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white"
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
        <nav className="flex items-center justify-between border-t border-line pt-5">
          <p className="text-sm text-muted">
            Page {pagination.currentPage} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Link
              href={pageHref(Math.max(1, pagination.currentPage - 1))}
              className="focus-ring rounded-md border border-line bg-white px-3 py-2 text-sm font-medium text-ink aria-disabled:pointer-events-none aria-disabled:opacity-50"
              aria-disabled={pagination.currentPage <= 1}
            >
              Previous
            </Link>
            <Link
              href={pageHref(Math.min(pagination.totalPages, pagination.currentPage + 1))}
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
