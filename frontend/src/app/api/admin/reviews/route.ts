import { type NextRequest } from "next/server";
import type { Review } from "@/types/models";
import {
  applyAuthProxyCookies,
  authenticatedBackendJson,
  jsonFromBackend
} from "@/lib/auth/route-utils";

export async function GET(request: NextRequest) {
  const result = await authenticatedBackendJson<Review[]>(
    request,
    `/admin/reviews${request.nextUrl.search}`,
    {
      method: "GET"
    }
  );
  const response = jsonFromBackend(result);
  applyAuthProxyCookies(response, result);
  return response;
}
