import { type NextRequest } from "next/server";
import type { InventoryCheckResult } from "@/lib/api/inventory";
import {
  applyAuthProxyCookies,
  authenticatedBackendJson,
  jsonFromBackend
} from "@/lib/auth/route-utils";

export async function GET(request: NextRequest) {
  const result = await authenticatedBackendJson<InventoryCheckResult>(
    request,
    `/inventory/check${request.nextUrl.search}`,
    {
      method: "GET"
    }
  );
  const response = jsonFromBackend(result);
  applyAuthProxyCookies(response, result);
  return response;
}
