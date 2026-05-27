import { apiEnvelope, apiRequest } from "./http";
import type { PageQuery } from "@/types/api";
import type { Order, OrderStatus, StatsOverview, TopProduct, User } from "@/types/models";

export const adminApi = {
  overview(token?: string) {
    return apiRequest<StatsOverview>("/admin/stats/overview", {
      method: "GET",
      token
    });
  },
  topProducts(limit = 10, token?: string) {
    return apiRequest<TopProduct[]>("/admin/stats/top-products", {
      method: "GET",
      token,
      query: { limit }
    });
  },
  users(query: PageQuery = {}, token?: string) {
    return apiEnvelope<User[]>("/admin/users", {
      method: "GET",
      token,
      query
    });
  },
  userById(id: string, token?: string) {
    return apiRequest<User>(`/admin/users/${id}`, {
      method: "GET",
      token
    });
  },
  toggleUserStatus(id: string, token?: string) {
    return apiRequest<User>(`/admin/users/${id}/toggle-status`, {
      method: "PUT",
      token
    });
  },
  orders(query: PageQuery & { status?: OrderStatus } = {}, token?: string) {
    return apiEnvelope<Order[]>("/admin/orders", {
      method: "GET",
      token,
      query
    });
  },
  orderById(id: string, token?: string) {
    return apiRequest<Order>(`/admin/orders/${id}`, {
      method: "GET",
      token
    });
  },
  updateOrderStatus(id: string, status: OrderStatus, token?: string) {
    return apiRequest<Order>(`/admin/orders/${id}/status`, {
      method: "PUT",
      token,
      body: { status }
    });
  }
};
