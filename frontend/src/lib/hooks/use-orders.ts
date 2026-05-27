"use client";

import { useQuery } from "@tanstack/react-query";
import { getAddresses, getOrderById, listOrders } from "@/lib/api/local-orders";

export const addressesQueryKey = ["addresses"] as const;
export const ordersQueryKey = ["orders"] as const;

export function useAddresses(enabled = true) {
  return useQuery({
    queryKey: addressesQueryKey,
    queryFn: getAddresses,
    enabled,
    retry: false,
    staleTime: 30_000
  });
}

export function useOrders(page: number, limit: number, enabled = true) {
  return useQuery({
    queryKey: [...ordersQueryKey, page, limit],
    queryFn: () => listOrders(page, limit),
    enabled,
    retry: false,
    staleTime: 15_000
  });
}

export function useOrder(id: string, enabled = true) {
  return useQuery({
    queryKey: [...ordersQueryKey, id],
    queryFn: () => getOrderById(id),
    enabled,
    retry: false,
    staleTime: 15_000
  });
}
