import { apiEnvelope, apiRequest, publicCatalogFetchOptions } from "./http";
import type { ApiResponse, PageQuery } from "@/types/api";
import type { Product } from "@/types/models";

export type ProductListQuery = PageQuery & {
  keyword?: string;
  categoryId?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  type?: "Sunglasses" | "Eyeglasses";
  sort?: "newest" | "priceAsc" | "priceDesc" | "topRated";
};

export type ProductPayload = Partial<Omit<Product, "_id" | "createdAt" | "updatedAt">>;

export const productsApi = {
  list(query: ProductListQuery = {}): Promise<ApiResponse<Product[]>> {
    return apiEnvelope<Product[]>("/products", {
      method: "GET",
      ...publicCatalogFetchOptions,
      query
    });
  },
  listByType(type: "Sunglasses" | "Eyeglasses", query: PageQuery = {}) {
    return apiEnvelope<Product[]>(`/products/type/${type}`, {
      method: "GET",
      ...publicCatalogFetchOptions,
      query
    });
  },
  listByCategory(categoryId: string, query: PageQuery & Pick<ProductListQuery, "sort"> = {}) {
    return apiEnvelope<Product[]>(`/products/category/${categoryId}`, {
      method: "GET",
      ...publicCatalogFetchOptions,
      query
    });
  },
  getBySlug(slug: string) {
    return apiRequest<Product>(`/products/slug/${slug}`, {
      method: "GET",
      ...publicCatalogFetchOptions
    });
  },
  getById(id: string) {
    return apiRequest<Product>(`/products/${id}`, {
      method: "GET",
      ...publicCatalogFetchOptions
    });
  },
  create(payload: ProductPayload, token?: string) {
    return apiRequest<Product>("/products", {
      method: "POST",
      token,
      body: payload
    });
  },
  update(id: string, payload: ProductPayload, token?: string) {
    return apiRequest<Product>(`/products/${id}`, {
      method: "PUT",
      token,
      body: payload
    });
  },
  remove(id: string, token?: string) {
    return apiEnvelope<null>(`/products/${id}`, {
      method: "DELETE",
      token
    });
  }
};
