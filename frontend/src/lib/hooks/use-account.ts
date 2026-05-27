"use client";

import { useQuery } from "@tanstack/react-query";
import { getAddresses, getProfile } from "@/lib/api/local-users";

export const profileQueryKey = ["account", "profile"] as const;
export const accountAddressesQueryKey = ["account", "addresses"] as const;

export function useProfile(enabled = true) {
  return useQuery({
    queryKey: profileQueryKey,
    queryFn: getProfile,
    enabled,
    retry: false,
    staleTime: 30_000
  });
}

export function useAccountAddresses(enabled = true) {
  return useQuery({
    queryKey: accountAddressesQueryKey,
    queryFn: getAddresses,
    enabled,
    retry: false,
    staleTime: 30_000
  });
}
