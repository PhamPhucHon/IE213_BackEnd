import type { ReviewPayload } from "@/lib/api/reviews";
import type { ApiResponse, PageQuery } from "@/types/api";
import type { Review } from "@/types/models";
import {
  getLocalErrorMessage,
  jsonRequest,
  LocalApiError,
  localEnvelope
} from "./local-client";

export type ReviewRatingFilter = 1 | 2 | 3 | 4 | 5 | "all";

export type ReviewListQuery = PageQuery & {
  rating?: ReviewRatingFilter;
};

export class LocalReviewError<T = unknown> extends LocalApiError<T> {
  constructor(message: string, status: number, payload?: ApiResponse<T> | null) {
    super(message, status, payload, "LocalReviewError");
  }
}

function createReviewError<T>(
  message: string,
  status: number,
  payload: ApiResponse<T> | null
) {
  return new LocalReviewError<T>(message, status, payload);
}

function reviewListPath(productId: string, query: ReviewListQuery = {}) {
  const params = new URLSearchParams();

  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.rating) params.set("rating", String(query.rating));

  const suffix = params.toString();
  return `/api/products/${encodeURIComponent(productId)}/reviews${suffix ? `?${suffix}` : ""}`;
}

export function getLocalReviewErrorMessage(error: unknown) {
  return getLocalErrorMessage(error, "Review request failed. Please try again.");
}

export function listProductReviews(productId: string, query: ReviewListQuery = {}) {
  return localEnvelope<Review[]>(reviewListPath(productId, query), {}, createReviewError);
}

export async function createProductReview(
  productId: string,
  payload: Required<Pick<ReviewPayload, "rating" | "comment">> & ReviewPayload
) {
  const response = await jsonRequest<Review>(
    reviewListPath(productId),
    payload,
    "POST",
    createReviewError
  );
  return response.data as Review;
}

export async function likeReview(id: string) {
  const response = await jsonRequest<{ likes: number }>(
    `/api/reviews/${encodeURIComponent(id)}/like`,
    undefined,
    "POST",
    createReviewError
  );

  return {
    message: response.message,
    likes: response.data?.likes ?? 0
  };
}

export async function updateReview(id: string, payload: ReviewPayload) {
  const response = await jsonRequest<Review>(
    `/api/reviews/${encodeURIComponent(id)}`,
    payload,
    "PUT",
    createReviewError
  );
  return response.data as Review;
}

export function deleteReview(id: string) {
  return localEnvelope<null>(
    `/api/reviews/${encodeURIComponent(id)}`,
    {
      method: "DELETE"
    },
    createReviewError
  );
}

export function adminDeleteReview(id: string) {
  return localEnvelope<null>(
    `/api/admin/reviews/${encodeURIComponent(id)}`,
    {
      method: "DELETE"
    },
    createReviewError
  );
}
