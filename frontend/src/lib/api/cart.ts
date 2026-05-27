import { apiEnvelope, apiRequest } from "./http";
import type { Cart } from "@/types/models";

export const cartApi = {
  get(token?: string) {
    return apiRequest<Cart>("/cart", {
      method: "GET",
      token
    });
  },
  add(sku: string, quantity: number, token?: string) {
    return apiRequest<Cart>("/cart", {
      method: "POST",
      token,
      body: { sku, quantity }
    });
  },
  update(sku: string, quantity: number, token?: string) {
    return apiRequest<Cart>(`/cart/${sku}`, {
      method: "PUT",
      token,
      body: { quantity }
    });
  },
  remove(sku: string, token?: string) {
    return apiRequest<Cart>(`/cart/${sku}`, {
      method: "DELETE",
      token
    });
  },
  clear(token?: string) {
    return apiEnvelope<Cart>("/cart", {
      method: "DELETE",
      token
    });
  }
};
