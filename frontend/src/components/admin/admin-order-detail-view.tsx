"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { getOrderCustomer } from "@/lib/admin/admin-utils";
import { getLocalAdminErrorMessage } from "@/lib/api/local-admin";
import { useAdminOrder } from "@/lib/hooks/use-admin";
import { formatCurrency, formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusAlert } from "@/components/ui/status-alert";
import { getButtonClassName } from "@/components/ui/style-primitives";
import { AdminOrderStatusActions } from "./admin-order-status-actions";

type AdminOrderDetailViewProps = {
  id: string;
};

function OrderDetailSkeleton() {
  return (
    <div className="grid gap-6">
      <Skeleton className="h-44 rounded-lg" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Skeleton className="h-80 rounded-lg" />
        <Skeleton className="h-80 rounded-lg" />
      </div>
    </div>
  );
}

export function AdminOrderDetailView({ id }: AdminOrderDetailViewProps) {
  const { data: order, isLoading, error } = useAdminOrder(id, Boolean(id));
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (isLoading) {
    return <OrderDetailSkeleton />;
  }

  if (error) {
    return (
      <StatusAlert tone="error" className="p-5">
        {getLocalAdminErrorMessage(error)}
      </StatusAlert>
    );
  }

  if (!order) {
    return (
      <EmptyState
        title="Order not found"
        description="This order may have been removed or the order id may be invalid."
        action={
          <Link href="/admin/orders" className={getButtonClassName("secondary")}>
            Back to orders
          </Link>
        }
      />
    );
  }

  const customer = getOrderCustomer(order);

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

      <section className="rounded-lg border border-line bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-muted">{formatDate(order.createdAt)}</p>
            <h2 className="mt-1 break-all text-2xl font-semibold text-ink">{order.orderNumber}</h2>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            <OrderStatusBadge status={order.status} />
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
        </div>
        <div className="mt-6">
          <OrderTimeline status={order.status} />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-lg border border-line bg-white p-5">
          <h2 className="text-lg font-semibold text-ink">Items</h2>
          <div className="mt-5 grid gap-4">
            {order.items.map((item) => (
              <article key={item._id ?? item.sku} className="grid grid-cols-[72px_1fr] gap-3">
                <div className="relative aspect-square overflow-hidden rounded-md bg-surface">
                  {item.image ? (
                    <Image src={item.image} alt={item.name ?? item.sku} fill sizes="72px" className="object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <h3 className="break-words font-medium text-ink">{item.name ?? item.sku}</h3>
                  <p className="mt-1 break-all text-xs text-muted">SKU: {item.sku}</p>
                  <p className="mt-2 text-sm text-muted">
                    {item.quantity} x {formatCurrency(item.price)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="grid gap-6 self-start md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-1">
          <section className="rounded-lg border border-line bg-white p-5">
            <h2 className="text-lg font-semibold text-ink">Customer</h2>
            <div className="mt-4 grid gap-2 text-sm">
              <p className="break-words font-medium text-ink">{customer.name}</p>
              <p className="break-all text-muted">{customer.email}</p>
              {customer.phone ? <p className="text-muted">{customer.phone}</p> : null}
            </div>
          </section>

          <section className="rounded-lg border border-line bg-white p-5">
            <h2 className="text-lg font-semibold text-ink">Shipping</h2>
            <div className="mt-4 grid gap-2 text-sm">
              <p className="break-words font-medium text-ink">{order.shippingAddress.fullName}</p>
              <p className="text-muted">{order.shippingAddress.phone}</p>
              <p className="break-words text-muted">{order.shippingAddress.address}</p>
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
              {order.paidAt ? (
                <div className="flex justify-between gap-3">
                  <span className="text-muted">Paid at</span>
                  <span className="font-medium text-ink">{formatDate(order.paidAt)}</span>
                </div>
              ) : null}
              {order.deliveredAt ? (
                <div className="flex justify-between gap-3">
                  <span className="text-muted">Delivered at</span>
                  <span className="font-medium text-ink">{formatDate(order.deliveredAt)}</span>
                </div>
              ) : null}
            </div>
          </section>
        </aside>
      </div>

      {order.note ? (
        <section className="rounded-lg border border-line bg-white p-5">
          <h2 className="text-lg font-semibold text-ink">Order note</h2>
          <p className="mt-3 text-sm leading-6 text-muted">{order.note}</p>
        </section>
      ) : null}
    </div>
  );
}
