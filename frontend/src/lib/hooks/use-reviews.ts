"use client";

import { useQuery } from "@tanstack/react-query";
import {
  listProductReviews,
  type ReviewRatingFilter
} from "@/lib/api/local-reviews";

export const reviewsQueryKey = ["reviews"] as const;

export function productReviewsQueryKey(
  productId: string,
  page: number,
  rating: ReviewRatingFilter
) {
  return [...reviewsQueryKey, "product", productId, page, rating] as const;
}

export function productReviewsRootQueryKey(productId: string) {
  return [...reviewsQueryKey, "product", productId] as const;
}

export function useProductReviews(
  productId: string,
  page: number,
  rating: ReviewRatingFilter,
  enabled = true
) {
  return useQuery({
    queryKey: productReviewsQueryKey(productId, page, rating),
    queryFn: () => listProductReviews(productId, { page, limit: 5, rating }),
    enabled,
    retry: false,
    staleTime: 15_000
  });
}
