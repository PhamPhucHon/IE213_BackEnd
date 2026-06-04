"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getAdminOrder,
  getAdminOverview,
  getAdminRevenueSeries,
  getAdminTopProducts,
  getAdminUser,
  listAdminReviews,
  listAdminOrders,
  listAdminUsers
} from "@/lib/api/local-admin";
import type { OrderStatus, RevenuePeriod } from "@/types/models";

export const adminOverviewQueryKey = ["admin", "overview"] as const;
export const adminTopProductsQueryKey = ["admin", "top-products"] as const;
export const adminRevenueQueryKey = ["admin", "revenue"] as const;
export const adminUsersQueryKey = ["admin", "users"] as const;
export const adminOrdersQueryKey = ["admin", "orders"] as const;
export const adminReviewsQueryKey = ["admin", "reviews"] as const;

export function adminUserQueryKey(id: string) {
  return [...adminUsersQueryKey, "detail", id] as const;
}

export function adminOrderQueryKey(id: string) {
  return [...adminOrdersQueryKey, "detail", id] as const;
}

export function useAdminOverview() {
  return useQuery({
    queryKey: adminOverviewQueryKey,
    queryFn: getAdminOverview,
    retry: false,
    staleTime: 30_000
  });
}

export function useAdminTopProducts(limit = 8) {
  return useQuery({
    queryKey: [...adminTopProductsQueryKey, limit],
    queryFn: () => getAdminTopProducts(limit),
    retry: false,
    staleTime: 30_000
  });
}

export function useAdminRevenueSeries(period: RevenuePeriod = "quarter") {
  return useQuery({
    queryKey: [...adminRevenueQueryKey, period],
    queryFn: () => getAdminRevenueSeries(period),
    retry: false,
    staleTime: 30_000
  });
}

export function useAdminUsers(page: number, limit: number) {
  return useQuery({
    queryKey: [...adminUsersQueryKey, page, limit],
    queryFn: () => listAdminUsers(page, limit),
    retry: false,
    staleTime: 15_000
  });
}

export function useAdminUser(id: string, enabled = true) {
  return useQuery({
    queryKey: adminUserQueryKey(id),
    queryFn: () => getAdminUser(id),
    enabled,
    retry: false,
    staleTime: 15_000
  });
}

export function useAdminOrders(page: number, limit: number, status?: OrderStatus) {
  return useQuery({
    queryKey: [...adminOrdersQueryKey, page, limit, status ?? "all"],
    queryFn: () => listAdminOrders(page, limit, status),
    retry: false,
    staleTime: 15_000
  });
}

export function useAdminOrder(id: string, enabled = true) {
  return useQuery({
    queryKey: adminOrderQueryKey(id),
    queryFn: () => getAdminOrder(id),
    enabled,
    retry: false,
    staleTime: 15_000
  });
}

export function useAdminReviews(page: number, limit: number, rating?: number) {
  return useQuery({
    queryKey: [...adminReviewsQueryKey, page, limit, rating ?? "all"],
    queryFn: () => listAdminReviews(page, limit, rating),
    retry: false,
    staleTime: 15_000
  });
}
