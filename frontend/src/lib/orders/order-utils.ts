import type { ApiMeta } from "@/types/api";
import type { Order, OrderStatus } from "@/types/models";

export type OrderPagination = {
  totalOrders: number;
  currentPage: number;
  totalPages: number;
  limit: number;
};

export const orderStatuses: OrderStatus[] = [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled"
];

export function canCancelOrder(order?: Pick<Order, "status"> | null) {
  return order?.status === "Pending" || order?.status === "Processing";
}

export function getOrderPagination(meta?: ApiMeta): OrderPagination {
  return {
    totalOrders: Number(meta?.totalOrders ?? meta?.total ?? 0),
    currentPage: Number(meta?.currentPage ?? meta?.page ?? 1),
    totalPages: Math.max(1, Number(meta?.totalPages ?? 1)),
    limit: Number(meta?.limit ?? 10)
  };
}

export function statusBadgeClassName(status: OrderStatus) {
  const styles: Record<OrderStatus, string> = {
    Pending: "border-amber-200 bg-amber-50 text-amber-700",
    Processing: "border-blue-200 bg-blue-50 text-blue-700",
    Shipped: "border-indigo-200 bg-indigo-50 text-indigo-700",
    Delivered: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Cancelled: "border-red-200 bg-red-50 text-red-700"
  };

  return styles[status];
}
