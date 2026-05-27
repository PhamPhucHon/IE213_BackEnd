import { type NextRequest } from "next/server";
import type { Order } from "@/types/models";
import {
  applyAuthProxyCookies,
  authenticatedBackendJson,
  jsonFromBackend
} from "@/lib/auth/route-utils";

type OrderCancelRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, { params }: OrderCancelRouteContext) {
  const { id } = await params;
  const result = await authenticatedBackendJson<Order>(
    request,
    `/orders/${encodeURIComponent(id)}/cancel`,
    {
      method: "PUT"
    }
  );
  const response = jsonFromBackend(result);
  applyAuthProxyCookies(response, result);
  return response;
}
