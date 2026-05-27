"use client";

import { useQuery } from "@tanstack/react-query";
import type { ProductListQuery } from "@/lib/api/products";
import {
  getAdminInventorySku,
  getAdminProduct,
  listAdminCategories,
  listAdminInventory,
  listAdminProducts
} from "@/lib/api/local-admin-catalog";

export const adminCategoriesQueryKey = ["admin", "categories"] as const;
export const adminProductsQueryKey = ["admin", "products"] as const;
export const adminInventoryQueryKey = ["admin", "inventory"] as const;

export function adminProductQueryKey(id: string) {
  return [...adminProductsQueryKey, "detail", id] as const;
}

export function adminInventorySkuQueryKey(sku: string) {
  return [...adminInventoryQueryKey, "sku", sku] as const;
}

export function useAdminCategories() {
  return useQuery({
    queryKey: adminCategoriesQueryKey,
    queryFn: listAdminCategories,
    retry: false,
    staleTime: 30_000
  });
}

export function useAdminProducts(query: ProductListQuery) {
  return useQuery({
    queryKey: [...adminProductsQueryKey, query],
    queryFn: () => listAdminProducts(query),
    retry: false,
    staleTime: 15_000
  });
}

export function useAdminProduct(id: string, enabled = true) {
  return useQuery({
    queryKey: adminProductQueryKey(id),
    queryFn: () => getAdminProduct(id),
    enabled,
    retry: false,
    staleTime: 15_000
  });
}

export function useAdminInventory(query: {
  page?: number;
  limit?: number;
  productId?: string;
  lowStock?: boolean;
}) {
  return useQuery({
    queryKey: [...adminInventoryQueryKey, query],
    queryFn: () => listAdminInventory(query),
    retry: false,
    staleTime: 15_000
  });
}

export function useAdminInventorySku(sku: string, enabled = true) {
  return useQuery({
    queryKey: adminInventorySkuQueryKey(sku),
    queryFn: () => getAdminInventorySku(sku),
    enabled,
    retry: false,
    staleTime: 15_000
  });
}
