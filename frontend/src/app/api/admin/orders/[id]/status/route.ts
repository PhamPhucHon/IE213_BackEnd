import { type NextRequest } from "next/server";
import type { Order } from "@/types/models";
import {
  applyAuthProxyCookies,
  authenticatedBackendJson,
  jsonFromBackend,
  readJsonBody
} from "@/lib/auth/route-utils";

type AdminOrderStatusRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, { params }: AdminOrderStatusRouteContext) {
  const { id } = await params;
  const body = await readJsonBody(request);
  const result = await authenticatedBackendJson<Order>(
    request,
    `/admin/orders/${encodeURIComponent(id)}/status`,
    {
      method: "PUT",
      body: JSON.stringify(body)
    }
  );
  const response = jsonFromBackend(result);
  applyAuthProxyCookies(response, result);
  return response;
}
