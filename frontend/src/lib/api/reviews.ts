import { apiEnvelope, apiRequest } from "./http";
import type { PageQuery } from "@/types/api";
import type { Review } from "@/types/models";

export type ReviewPayload = {
  rating?: number;
  title?: string;
  comment?: string;
  images?: string[];
};

export const reviewsApi = {
  listByProduct(productId: string, query: PageQuery & { rating?: number | "all" } = {}) {
    return apiEnvelope<Review[]>(`/products/${productId}/reviews`, {
      method: "GET",
      query
    });
  },
  create(productId: string, payload: Required<Pick<ReviewPayload, "rating" | "comment">> & ReviewPayload, token?: string) {
    return apiRequest<Review>(`/products/${productId}/reviews`, {
      method: "POST",
      token,
      body: payload
    });
  },
  like(id: string, token?: string) {
    return apiRequest<{ message: string; likes: number }>(`/reviews/${id}/like`, {
      method: "POST",
      token
    });
  },
  update(id: string, payload: ReviewPayload, token?: string) {
    return apiRequest<Review>(`/reviews/${id}`, {
      method: "PUT",
      token,
      body: payload
    });
  },
  remove(id: string, token?: string) {
    return apiEnvelope<null>(`/reviews/${id}`, {
      method: "DELETE",
      token
    });
  },
  adminRemove(id: string, token?: string) {
    return apiEnvelope<null>(`/admin/reviews/${id}`, {
      method: "DELETE",
      token
    });
  }
};
