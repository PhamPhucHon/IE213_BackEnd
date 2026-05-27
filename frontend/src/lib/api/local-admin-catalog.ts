import type { ApiResponse, QueryParams } from "@/types/api";
import type {
  Category,
  Inventory,
  Product,
  ProductSpecifications,
  ProductVariant
} from "@/types/models";
import type { ProductListQuery } from "./products";
import {
  getLocalErrorMessage,
  jsonRequest,
  LocalApiError,
  localEnvelope
} from "./local-client";

export type AdminCategoryPayload = {
  name: string;
  description?: string;
  image?: string;
  order?: number;
};

export type AdminProductPayload = {
  name: string;
  description: string;
  brand: string;
  categoryId: string;
  type?: Product["type"];
  sale?: boolean;
  availability?: Product["availability"];
  specifications?: ProductSpecifications;
  images?: string[];
  variants: ProductVariant[];
  isActive?: boolean;
};

export class LocalAdminCatalogError<T = unknown> extends LocalApiError<T> {
  constructor(message: string, status: number, payload?: ApiResponse<T> | null) {
    super(message, status, payload, "LocalAdminCatalogError");
  }
}

function queryString(query: QueryParams = {}) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });

  return params.toString();
}

function createAdminCatalogError<T>(
  message: string,
  status: number,
  payload: ApiResponse<T> | null
) {
  return new LocalAdminCatalogError<T>(message, status, payload);
}

export function getLocalAdminCatalogErrorMessage(error: unknown) {
  return getLocalErrorMessage(error, "Admin catalog request failed. Please try again.");
}

export async function listAdminCategories() {
  const response = await localEnvelope<Category[]>("/api/categories", {}, createAdminCatalogError);
  return response.data ?? [];
}

export async function createAdminCategory(payload: AdminCategoryPayload) {
  const response = await jsonRequest<Category>(
    "/api/categories",
    payload,
    "POST",
    createAdminCatalogError
  );
  return response.data as Category;
}

export async function updateAdminCategory(id: string, payload: Partial<AdminCategoryPayload>) {
  const response = await jsonRequest<Category>(
    `/api/categories/${encodeURIComponent(id)}`,
    payload,
    "PUT",
    createAdminCatalogError
  );
  return response.data as Category;
}

export async function deleteAdminCategory(id: string) {
  return localEnvelope<null>(
    `/api/categories/${encodeURIComponent(id)}`,
    {
      method: "DELETE"
    },
    createAdminCatalogError
  );
}

export function listAdminProducts(query: ProductListQuery = {}) {
  const params = queryString(query);
  return localEnvelope<Product[]>(
    params ? `/api/products?${params}` : "/api/products",
    {},
    createAdminCatalogError
  );
}

export async function getAdminProduct(id: string) {
  const response = await localEnvelope<Product>(
    `/api/products/${encodeURIComponent(id)}`,
    {},
    createAdminCatalogError
  );
  return response.data as Product;
}

export async function uploadAdminProductImage(file: File) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await localEnvelope<{ imageUrl: string }>(
    "/api/products/upload-image",
    {
      method: "POST",
      body: formData
    },
    createAdminCatalogError
  );
  return response.data as { imageUrl: string };
}

export async function createAdminProduct(payload: AdminProductPayload) {
  const response = await jsonRequest<Product>(
    "/api/products",
    payload,
    "POST",
    createAdminCatalogError
  );
  return response.data as Product;
}

export async function updateAdminProduct(id: string, payload: AdminProductPayload) {
  const response = await jsonRequest<Product>(
    `/api/products/${encodeURIComponent(id)}`,
    payload,
    "PUT",
    createAdminCatalogError
  );
  return response.data as Product;
}

export async function hideAdminProduct(id: string) {
  return localEnvelope<null>(
    `/api/products/${encodeURIComponent(id)}`,
    {
      method: "DELETE"
    },
    createAdminCatalogError
  );
}

export function listAdminInventory(query: {
  page?: number;
  limit?: number;
  productId?: string;
  lowStock?: boolean;
} = {}) {
  const params = queryString(query);
  return localEnvelope<Inventory[]>(
    params ? `/api/admin/inventory?${params}` : "/api/admin/inventory",
    {},
    createAdminCatalogError
  );
}

export async function getAdminInventorySku(sku: string) {
  const response = await localEnvelope<Inventory>(
    `/api/admin/inventory/${encodeURIComponent(sku)}`,
    {},
    createAdminCatalogError
  );
  return response.data as Inventory;
}

export async function updateAdminInventoryStock(sku: string, stock: number) {
  const response = await jsonRequest<Inventory>(
    `/api/admin/inventory/${encodeURIComponent(sku)}`,
    { stock },
    "PUT",
    createAdminCatalogError
  );
  return response.data as Inventory;
}
