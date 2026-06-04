import type { ApiResponse } from "@/types/api";
import type {
  Order,
  OrderStatus,
  RevenuePeriod,
  RevenueSeriesPoint,
  Review,
  StatsOverview,
  TopProduct,
  User
} from "@/types/models";
import {
  getLocalErrorMessage,
  jsonRequest,
  LocalApiError,
  localEnvelope
} from "./local-client";

export class LocalAdminError<T = unknown> extends LocalApiError<T> {
  constructor(message: string, status: number, payload?: ApiResponse<T> | null) {
    super(message, status, payload, "LocalAdminError");
  }
}

function createAdminError<T>(
  message: string,
  status: number,
  payload: ApiResponse<T> | null
) {
  return new LocalAdminError<T>(message, status, payload);
}

export function getLocalAdminErrorMessage(error: unknown) {
  return getLocalErrorMessage(error, "Admin request failed. Please try again.");
}

export async function getAdminOverview() {
  const response = await localEnvelope<StatsOverview>(
    "/api/admin/stats/overview",
    {},
    createAdminError
  );
  return response.data as StatsOverview;
}

export async function getAdminTopProducts(limit = 8) {
  const params = new URLSearchParams({ limit: String(limit) });
  const response = await localEnvelope<TopProduct[]>(
    `/api/admin/stats/top-products?${params}`,
    {},
    createAdminError
  );
  return response.data ?? [];
}

export async function getAdminRevenueSeries(period: RevenuePeriod = "quarter") {
  const params = new URLSearchParams({ period });
  const response = await localEnvelope<RevenueSeriesPoint[]>(
    `/api/admin/stats/revenue?${params}`,
    {},
    createAdminError
  );
  return response.data ?? [];
}

export async function listAdminUsers(page = 1, limit = 10) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit)
  });
  return localEnvelope<User[]>(`/api/admin/users?${params}`, {}, createAdminError);
}

export async function getAdminUser(id: string) {
  const response = await localEnvelope<User>(
    `/api/admin/users/${encodeURIComponent(id)}`,
    {},
    createAdminError
  );
  return response.data as User;
}

export async function toggleAdminUserStatus(id: string) {
  const response = await jsonRequest<User>(
    `/api/admin/users/${encodeURIComponent(id)}/toggle-status`,
    undefined,
    "PUT",
    createAdminError
  );
  return response.data as User;
}

export async function listAdminOrders(page = 1, limit = 10, status?: OrderStatus) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit)
  });

  if (status) {
    params.set("status", status);
  }

  return localEnvelope<Order[]>(`/api/admin/orders?${params}`, {}, createAdminError);
}

export async function getAdminOrder(id: string) {
  const response = await localEnvelope<Order>(
    `/api/admin/orders/${encodeURIComponent(id)}`,
    {},
    createAdminError
  );
  return response.data as Order;
}

export async function updateAdminOrderStatus(id: string, status: OrderStatus) {
  const response = await jsonRequest<Order>(
    `/api/admin/orders/${encodeURIComponent(id)}/status`,
    { status },
    "PUT",
    createAdminError
  );
  return response.data as Order;
}

export async function listAdminReviews(page = 1, limit = 10, rating?: number) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit)
  });

  if (rating) {
    params.set("rating", String(rating));
  }

  return localEnvelope<Review[]>(`/api/admin/reviews?${params}`, {}, createAdminError);
}
