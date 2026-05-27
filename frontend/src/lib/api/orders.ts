import { apiEnvelope, apiRequest } from "./http";
import type { PageQuery } from "@/types/api";
import type { Order, PaymentMethod, ShippingAddress } from "@/types/models";

export type CreateOrderPayload = {
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
};

export const ordersApi = {
  create(payload: CreateOrderPayload, token?: string) {
    return apiRequest<Order>("/orders", {
      method: "POST",
      token,
      body: payload
    });
  },
  list(query: PageQuery = {}, token?: string) {
    return apiEnvelope<Order[]>("/orders", {
      method: "GET",
      token,
      query
    });
  },
  getById(id: string, token?: string) {
    return apiRequest<Order>(`/orders/${id}`, {
      method: "GET",
      token
    });
  },
  cancel(id: string, token?: string) {
    return apiRequest<Order>(`/orders/${id}/cancel`, {
      method: "PUT",
      token
    });
  }
};
