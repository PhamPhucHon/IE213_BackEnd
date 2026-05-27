"use client";

import { useQuery } from "@tanstack/react-query";
import { getCart } from "@/lib/api/local-cart";

export const cartQueryKey = ["cart"] as const;

export function useCart(enabled = true) {
  return useQuery({
    queryKey: cartQueryKey,
    queryFn: getCart,
    enabled,
    retry: false,
    staleTime: 15_000
  });
}
