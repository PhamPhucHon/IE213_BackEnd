import type { ApiMeta } from "@/types/api";

export type ReviewPagination = {
  totalReviews: number;
  currentPage: number;
  totalPages: number;
  limit: number;
};

export type ReviewRatingSummary = {
  avg: number;
  count: number;
};

export function getReviewPagination(meta?: ApiMeta): ReviewPagination {
  return {
    totalReviews: Number(meta?.totalReviews ?? meta?.total ?? 0),
    currentPage: Number(meta?.currentPage ?? meta?.page ?? 1),
    totalPages: Math.max(1, Number(meta?.totalPages ?? 1)),
    limit: Number(meta?.limit ?? 5)
  };
}

export function getReviewRatingSummary(
  meta: ApiMeta | undefined,
  fallback: ReviewRatingSummary
): ReviewRatingSummary {
  const summary = meta?.ratingSummary;
  if (!summary || typeof summary !== "object") return fallback;

  const values = summary as Partial<Record<keyof ReviewRatingSummary, unknown>>;
  return {
    avg: Number(values.avg ?? fallback.avg),
    count: Number(values.count ?? fallback.count)
  };
}
