"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import type { OrderStatus } from "@/types/models";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import {
  getAdminOrdersPagination,
  getOrderCustomer,
  parseAdminOrderStatus
} from "@/lib/admin/admin-utils";
import { getLocalAdminErrorMessage } from "@/lib/api/local-admin";
import { useAdminOrders } from "@/lib/hooks/use-admin";
import { orderStatuses } from "@/lib/orders/order-utils";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { AdminOrderStatusActions } from "./admin-order-status-actions";

function pageFromSearchParams(searchParams: URLSearchParams) {
  const page = Number(searchParams.get("page"));
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function OrdersSkeleton() {
  return (
    <div className="grid gap-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="h-28 rounded-lg bg-surface" />
      ))}
    </div>
  );
}

export function AdminOrdersView() {
  const searchParams = useSearchParams();
  const page = pageFromSearchParams(searchParams);
  const status = parseAdminOrderStatus(searchParams.get("status"));
  const limit = 10;
  const { data: response, isLoading, error } = useAdminOrders(page, limit, status);
  const orders = response?.data ?? [];
  const pagination = getAdminOrdersPagination(response?.meta);
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function filterHref(nextStatus?: OrderStatus) {
    const params = new URLSearchParams(searchParams);
    params.delete("page");

    if (nextStatus) {
      params.set("status", nextStatus);
    } else {
      params.delete("status");
    }

    const query = params.toString();
    return query ? `/admin/orders?${query}` : "/admin/orders";
  }

  function pageHref(nextPage: number) {
    const params = new URLSearchParams(searchParams);
    if (nextPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(nextPage));
    }

    const query = params.toString();
    return query ? `/admin/orders?${query}` : "/admin/orders";
  }

  if (isLoading) {
    return <OrdersSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        {getLocalAdminErrorMessage(error)}
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

      <div className="flex gap-2 overflow-x-auto pb-1">
        <Link
          href={filterHref()}
          className={cn(
            "focus-ring inline-flex min-h-11 shrink-0 items-center rounded-md border px-3 text-sm font-semibold",
            !status
              ? "border-ink bg-ink text-white"
              : "border-line bg-white text-ink hover:bg-surface"
          )}
          aria-current={!status ? "page" : undefined}
        >
          All
        </Link>
        {orderStatuses.map((item) => (
          <Link
            key={item}
            href={filterHref(item)}
            className={cn(
              "focus-ring inline-flex min-h-11 shrink-0 items-center rounded-md border px-3 text-sm font-semibold",
              status === item
                ? "border-ink bg-ink text-white"
                : "border-line bg-white text-ink hover:bg-surface"
            )}
            aria-current={status === item ? "page" : undefined}
          >
            {item}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {pagination.total} orders{status ? ` in ${status}` : ""}
        </p>
        <p className="text-sm text-muted">Page {pagination.currentPage} of {pagination.totalPages}</p>
      </div>

      {!orders.length ? (
        <div className="rounded-lg border border-line bg-white p-8 text-center">
          <h2 className="text-xl font-semibold text-ink">No orders found</h2>
          <p className="mt-2 text-sm text-muted">Try another status filter or wait for new checkouts.</p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-lg border border-line bg-white xl:block">
            <table className="min-w-full divide-y divide-line text-sm">
              <thead className="bg-surface text-left text-xs font-semibold uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {orders.map((order) => {
                  const customer = getOrderCustomer(order);
                  return (
                    <tr key={order._id}>
                      <td className="px-4 py-4">
                        <Link href={`/admin/orders/${order._id}`} className="break-all font-semibold text-ink">
                          {order.orderNumber}
                        </Link>
                        <p className="mt-1 text-muted">{formatDate(order.createdAt)}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="break-words font-medium text-ink">{customer.name}</p>
                        <p className="mt-1 break-all text-muted">{customer.email}</p>
                      </td>
                      <td className="px-4 py-4">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-ink">{order.paymentMethod}</p>
                        <p className="mt-1 text-muted">{order.isPaid ? "Paid" : "Unpaid"}</p>
                      </td>
                      <td className="px-4 py-4 text-right font-semibold text-ink">
                        {formatCurrency(order.totalPrice)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="grid gap-2">
                          <Link
                            href={`/admin/orders/${order._id}`}
                            className="focus-ring inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink hover:bg-surface"
                          >
                            Detail
                          </Link>
                          <AdminOrderStatusActions
                            order={order}
                            showEmpty
                            onError={(errorMessage) => {
                              setMessage(null);
                              setActionError(errorMessage);
                            }}
                            onSuccess={(nextOrder) => {
                              setActionError(null);
                              setMessage(`${nextOrder.orderNumber} moved to ${nextOrder.status}.`);
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
            {orders.map((order) => {
              const customer = getOrderCustomer(order);
              return (
                <article key={order._id} className="rounded-lg border border-line bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-muted">{formatDate(order.createdAt)}</p>
                      <Link href={`/admin/orders/${order._id}`} className="mt-1 block break-all text-lg font-semibold text-ink">
                        {order.orderNumber}
                      </Link>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
                    <div>
                      <p className="text-muted">Customer</p>
                      <p className="break-words font-medium text-ink">{customer.name}</p>
                    </div>
                    <div>
                      <p className="text-muted">Payment</p>
                      <p className="font-medium text-ink">
                        {order.paymentMethod} - {order.isPaid ? "Paid" : "Unpaid"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted">Total</p>
                      <p className="font-semibold text-ink">{formatCurrency(order.totalPrice)}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2 min-[390px]:flex min-[390px]:flex-wrap">
                    <Link
                      href={`/admin/orders/${order._id}`}
                      className="focus-ring inline-flex min-h-11 items-center justify-center rounded-md bg-ink px-3 text-sm font-semibold text-white"
                    >
                      Detail
                    </Link>
                    <AdminOrderStatusActions
                      order={order}
                      onError={(errorMessage) => {
                        setMessage(null);
                        setActionError(errorMessage);
                      }}
                      onSuccess={(nextOrder) => {
                        setActionError(null);
                        setMessage(`${nextOrder.orderNumber} moved to ${nextOrder.status}.`);
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
              href={pageHref(Math.max(1, pagination.currentPage - 1))}
              className="focus-ring inline-flex min-h-11 items-center rounded-md border border-line bg-white px-3 text-sm font-medium text-ink aria-disabled:pointer-events-none aria-disabled:opacity-50"
              aria-disabled={pagination.currentPage <= 1}
              tabIndex={pagination.currentPage <= 1 ? -1 : undefined}
            >
              Previous
            </Link>
            <Link
              href={pageHref(Math.min(pagination.totalPages, pagination.currentPage + 1))}
              className="focus-ring inline-flex min-h-11 items-center rounded-md border border-line bg-white px-3 text-sm font-medium text-ink aria-disabled:pointer-events-none aria-disabled:opacity-50"
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
