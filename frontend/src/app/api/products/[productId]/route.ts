import { type NextRequest } from "next/server";
import type { Product } from "@/types/models";
import {
  applyAuthProxyCookies,
  authenticatedBackendJson,
  backendJson,
  jsonFromBackend,
  readJsonBody
} from "@/lib/auth/route-utils";

type ProductRouteContext = {
  params: Promise<{ productId: string }>;
};

export async function GET(request: NextRequest, { params }: ProductRouteContext) {
  const { productId } = await params;
  const result = await backendJson<Product>(`/products/${encodeURIComponent(productId)}`, {
    method: "GET"
  });

  return jsonFromBackend(result);
}

export async function PUT(request: NextRequest, { params }: ProductRouteContext) {
  const { productId } = await params;
  const body = await readJsonBody(request);
  const result = await authenticatedBackendJson<Product>(
    request,
    `/products/${encodeURIComponent(productId)}`,
    {
      method: "PUT",
      body: JSON.stringify(body)
    }
  );
  const response = jsonFromBackend(result);
  applyAuthProxyCookies(response, result);
  return response;
}

export async function DELETE(request: NextRequest, { params }: ProductRouteContext) {
  const { productId } = await params;
  const result = await authenticatedBackendJson<null>(
    request,
    `/products/${encodeURIComponent(productId)}`,
    {
      method: "DELETE"
    }
  );
  const response = jsonFromBackend(result);
  applyAuthProxyCookies(response, result);
  return response;
}
