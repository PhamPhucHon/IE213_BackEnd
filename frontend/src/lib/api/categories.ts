import { apiEnvelope, apiRequest, publicCatalogFetchOptions } from "./http";
import type { Category } from "@/types/models";

export type CategoryPayload = {
  name: string;
  description?: string;
  image?: string;
  order?: number;
};

export const categoriesApi = {
  list() {
    return apiRequest<Category[]>("/categories", {
      method: "GET",
      ...publicCatalogFetchOptions
    });
  },
  getBySlug(slug: string) {
    return apiRequest<Category>(`/categories/slug/${slug}`, {
      method: "GET",
      ...publicCatalogFetchOptions
    });
  },
  getById(id: string) {
    return apiRequest<Category>(`/categories/${id}`, {
      method: "GET",
      ...publicCatalogFetchOptions
    });
  },
  create(payload: CategoryPayload, token?: string) {
    return apiRequest<Category>("/categories", {
      method: "POST",
      token,
      body: payload
    });
  },
  update(id: string, payload: Partial<CategoryPayload>, token?: string) {
    return apiRequest<Category>(`/categories/${id}`, {
      method: "PUT",
      token,
      body: payload
    });
  },
  remove(id: string, token?: string) {
    return apiEnvelope<null>(`/categories/${id}`, {
      method: "DELETE",
      token
    });
  }
};
