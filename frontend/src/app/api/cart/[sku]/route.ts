import { type NextRequest } from "next/server";
import type { Cart } from "@/types/models";
import {
  applyAuthProxyCookies,
  authenticatedBackendJson,
  jsonFromBackend,
  readJsonBody
} from "@/lib/auth/route-utils";

type CartItemRouteContext = {
  params: Promise<{ sku: string }>;
};

export async function PUT(request: NextRequest, { params }: CartItemRouteContext) {
  const { sku } = await params;
  const body = await readJsonBody(request);
  const result = await authenticatedBackendJson<Cart>(
    request,
    `/cart/${encodeURIComponent(sku)}`,
    {
      method: "PUT",
      body: JSON.stringify(body)
    }
  );
  const response = jsonFromBackend(result);
  applyAuthProxyCookies(response, result);
  return response;
}

export async function DELETE(request: NextRequest, { params }: CartItemRouteContext) {
  const { sku } = await params;
  const result = await authenticatedBackendJson<Cart>(
    request,
    `/cart/${encodeURIComponent(sku)}`,
    {
      method: "DELETE"
    }
  );
  const response = jsonFromBackend(result);
  applyAuthProxyCookies(response, result);
  return response;
}
