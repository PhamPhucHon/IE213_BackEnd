import type { CreateOrderPayload } from "@/lib/api/orders";
import type { ApiResponse } from "@/types/api";
import type { Address, Order } from "@/types/models";
import {
  getLocalErrorMessage,
  jsonRequest,
  LocalApiError,
  localEnvelope
} from "./local-client";

export class LocalOrderError<T = unknown> extends LocalApiError<T> {
  constructor(message: string, status: number, payload?: ApiResponse<T> | null) {
    super(message, status, payload, "LocalOrderError");
  }
}

function createOrderError<T>(
  message: string,
  status: number,
  payload: ApiResponse<T> | null
) {
  return new LocalOrderError<T>(message, status, payload);
}

export function getLocalOrderErrorMessage(error: unknown) {
  return getLocalErrorMessage(error, "Order request failed. Please try again.");
}

export async function getAddresses() {
  const response = await localEnvelope<Address[]>("/api/users/addresses", {}, createOrderError);
  return response.data ?? [];
}

export async function createOrder(payload: CreateOrderPayload) {
  const response = await jsonRequest<Order>("/api/orders", payload, "POST", createOrderError);
  return response.data as Order;
}

export async function listOrders(page = 1, limit = 10) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit)
  });
  return localEnvelope<Order[]>(`/api/orders?${params}`, {}, createOrderError);
}

export async function getOrderById(id: string) {
  const response = await localEnvelope<Order>(
    `/api/orders/${encodeURIComponent(id)}`,
    {},
    createOrderError
  );
  return response.data as Order;
}

export async function cancelOrder(id: string) {
  const response = await jsonRequest<Order>(
    `/api/orders/${encodeURIComponent(id)}/cancel`,
    undefined,
    "PUT",
    createOrderError
  );
  return response.data as Order;
}
