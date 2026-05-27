import { apiEnvelope, apiRequest } from "./http";
import type { PageQuery } from "@/types/api";
import type { Inventory } from "@/types/models";

export type InventoryCheckResult = {
  available: boolean;
  currentStock: number;
  reserved: number;
  availableStock: number;
  requestedQuantity: number;
  sku: string;
};

export const inventoryApi = {
  check(sku: string, quantity: number, token?: string) {
    return apiRequest<InventoryCheckResult>("/inventory/check", {
      method: "GET",
      token,
      query: { sku, quantity }
    });
  },
  adminList(query: PageQuery & { productId?: string; lowStock?: boolean } = {}, token?: string) {
    return apiEnvelope<Inventory[]>("/admin/inventory", {
      method: "GET",
      token,
      query
    });
  },
  adminGetBySku(sku: string, token?: string) {
    return apiRequest<Inventory>(`/admin/inventory/${sku}`, {
      method: "GET",
      token
    });
  },
  adminUpdateStock(sku: string, stock: number, token?: string) {
    return apiRequest<Inventory>(`/admin/inventory/${sku}`, {
      method: "PUT",
      token,
      body: { stock }
    });
  }
};
