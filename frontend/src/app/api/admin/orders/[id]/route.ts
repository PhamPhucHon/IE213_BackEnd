import { type NextRequest } from "next/server";
import type { Order } from "@/types/models";
import {
  applyAuthProxyCookies,
  authenticatedBackendJson,
  jsonFromBackend
} from "@/lib/auth/route-utils";

type AdminOrderRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: AdminOrderRouteContext) {
  const { id } = await params;
  const result = await authenticatedBackendJson<Order>(
    request,
    `/admin/orders/${encodeURIComponent(id)}`,
    {
      method: "GET"
    }
  );
  const response = jsonFromBackend(result);
  applyAuthProxyCookies(response, result);
  return response;
}
