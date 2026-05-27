import { type NextRequest } from "next/server";
import type { Inventory } from "@/types/models";
import {
  applyAuthProxyCookies,
  authenticatedBackendJson,
  jsonFromBackend,
  readJsonBody
} from "@/lib/auth/route-utils";

type AdminInventoryRouteContext = {
  params: Promise<{ sku: string }>;
};

export async function GET(request: NextRequest, { params }: AdminInventoryRouteContext) {
  const { sku } = await params;
  const result = await authenticatedBackendJson<Inventory>(
    request,
    `/admin/inventory/${encodeURIComponent(sku)}`,
    {
      method: "GET"
    }
  );
  const response = jsonFromBackend(result);
  applyAuthProxyCookies(response, result);
  return response;
}

export async function PUT(request: NextRequest, { params }: AdminInventoryRouteContext) {
  const { sku } = await params;
  const body = await readJsonBody(request);
  const result = await authenticatedBackendJson<Inventory>(
    request,
    `/admin/inventory/${encodeURIComponent(sku)}`,
    {
      method: "PUT",
      body: JSON.stringify(body)
    }
  );
  const response = jsonFromBackend(result);
  applyAuthProxyCookies(response, result);
  return response;
}
