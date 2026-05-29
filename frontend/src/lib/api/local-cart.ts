import type { InventoryCheckResult } from "@/lib/api/inventory";
import type { ApiResponse } from "@/types/api";
import type { Cart } from "@/types/models";
import {
  getLocalErrorMessage,
  jsonRequest,
  LocalApiError,
  localEnvelope
} from "./local-client";

export class LocalCartError<T = unknown> extends LocalApiError<T> {
  constructor(message: string, status: number, payload?: ApiResponse<T> | null) {
    super(message, status, payload, "LocalCartError");
  }
}

function createCartError<T>(
  message: string,
  status: number,
  payload: ApiResponse<T> | null
) {
  return new LocalCartError<T>(message, status, payload);
}

export function getLocalCartErrorMessage(error: unknown) {
  const message = getLocalErrorMessage(error, "Cart request failed. Please try again.");

  if (/sku/i.test(message)) {
    return "This product is not available right now. Please choose another option.";
  }

  return message;
}

export async function getCart() {
  const response = await localEnvelope<Cart>("/api/cart", {}, createCartError);
  return response.data as Cart;
}

export async function addCartItem(sku: string, quantity: number) {
  const response = await jsonRequest<Cart>("/api/cart", { sku, quantity }, "POST", createCartError);
  return response.data as Cart;
}

export async function updateCartItem(sku: string, quantity: number) {
  const response = await jsonRequest<Cart>(
    `/api/cart/${encodeURIComponent(sku)}`,
    { quantity },
    "PUT",
    createCartError
  );
  return response.data as Cart;
}

export async function removeCartItem(sku: string) {
  const response = await localEnvelope<Cart>(
    `/api/cart/${encodeURIComponent(sku)}`,
    {
      method: "DELETE"
    },
    createCartError
  );
  return response.data as Cart;
}

export async function clearCart() {
  const response = await localEnvelope<Cart>(
    "/api/cart",
    {
      method: "DELETE"
    },
    createCartError
  );
  return response.data as Cart;
}

export async function checkInventory(sku: string, quantity: number) {
  const params = new URLSearchParams({
    sku,
    quantity: String(quantity)
  });
  const response = await localEnvelope<InventoryCheckResult>(
    `/api/inventory/check?${params}`,
    {},
    createCartError
  );
  return response.data as InventoryCheckResult;
}
