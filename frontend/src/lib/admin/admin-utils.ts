import type { ApiMeta } from "@/types/api";
import type { Order, OrderStatus, User } from "@/types/models";
import { orderStatuses } from "@/lib/orders/order-utils";

export type AdminPagination = {
  total: number;
  currentPage: number;
  totalPages: number;
  limit: number;
};

export const adminOrderTransitions: Record<OrderStatus, OrderStatus[]> = {
  Pending: ["Processing", "Cancelled"],
  Processing: ["Shipped", "Cancelled"],
  Shipped: ["Delivered", "Cancelled"],
  Delivered: [],
  Cancelled: []
};

export function getAdminUsersPagination(meta?: ApiMeta): AdminPagination {
  return {
    total: Number(meta?.totalUsers ?? meta?.total ?? 0),
    currentPage: Number(meta?.currentPage ?? meta?.page ?? 1),
    totalPages: Math.max(1, Number(meta?.totalPages ?? 1)),
    limit: Number(meta?.limit ?? 10)
  };
}

export function getAdminOrdersPagination(meta?: ApiMeta): AdminPagination {
  return {
    total: Number(meta?.totalOrders ?? meta?.total ?? 0),
    currentPage: Number(meta?.currentPage ?? meta?.page ?? 1),
    totalPages: Math.max(1, Number(meta?.totalPages ?? 1)),
    limit: Number(meta?.limit ?? 10)
  };
}

export function getNextAdminOrderStatuses(status: OrderStatus) {
  return adminOrderTransitions[status];
}

export function parseAdminOrderStatus(value: string | null) {
  return orderStatuses.includes(value as OrderStatus) ? (value as OrderStatus) : undefined;
}

export function getOrderCustomer(order: Order) {
  if (!order.userId || typeof order.userId === "string") {
    return {
      name: "Customer",
      email: typeof order.userId === "string" ? order.userId : "Unknown user",
      phone: ""
    };
  }

  return {
    name: order.userId.name,
    email: order.userId.email,
    phone: order.userId.phone ?? ""
  };
}

export function userStatusLabel(user: Pick<User, "isActive">) {
  return user.isActive === false ? "Inactive" : "Active";
}

export function userRoleLabel(user: Pick<User, "isAdmin">) {
  return user.isAdmin ? "Admin" : "Customer";
}
