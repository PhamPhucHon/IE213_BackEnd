"use client";

import type { QueryClient } from "@tanstack/react-query";
import { accountAddressesQueryKey, profileQueryKey } from "@/lib/hooks/use-account";
import { cartQueryKey } from "@/lib/hooks/use-cart";
import { currentUserQueryKey } from "@/lib/hooks/use-current-user";
import { addressesQueryKey, ordersQueryKey } from "@/lib/hooks/use-orders";

const userScopedQueryKeys = [
  currentUserQueryKey,
  cartQueryKey,
  ordersQueryKey,
  addressesQueryKey,
  profileQueryKey,
  accountAddressesQueryKey
] as const;

export async function removeUserScopedQueries(queryClient: QueryClient) {
  await Promise.all(
    userScopedQueryKeys.map((queryKey) =>
      queryClient.cancelQueries({
        queryKey
      })
    )
  );

  userScopedQueryKeys.forEach((queryKey) => {
    queryClient.removeQueries({
      queryKey
    });
  });
}

export async function clearSessionQueries(queryClient: QueryClient) {
  await removeUserScopedQueries(queryClient);
  queryClient.setQueryData(currentUserQueryKey, null);
  queryClient.setQueryData(cartQueryKey, null);
}
