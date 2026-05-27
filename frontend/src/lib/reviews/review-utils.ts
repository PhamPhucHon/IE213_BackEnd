import type { ApiMeta } from "@/types/api";

export type ReviewPagination = {
  totalReviews: number;
  currentPage: number;
  totalPages: number;
  limit: number;
};

export function getReviewPagination(meta?: ApiMeta): ReviewPagination {
  return {
    totalReviews: Number(meta?.totalReviews ?? meta?.total ?? 0),
    currentPage: Number(meta?.currentPage ?? meta?.page ?? 1),
    totalPages: Math.max(1, Number(meta?.totalPages ?? 1)),
    limit: Number(meta?.limit ?? 5)
  };
}
