import { type NextRequest } from "next/server";
import type { User } from "@/types/models";
import {
  applyAuthProxyCookies,
  authenticatedBackendJson,
  jsonFromBackend
} from "@/lib/auth/route-utils";

type AdminUserRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: AdminUserRouteContext) {
  const { id } = await params;
  const result = await authenticatedBackendJson<User>(
    request,
    `/admin/users/${encodeURIComponent(id)}`,
    {
      method: "GET"
    }
  );
  const response = jsonFromBackend(result);
  applyAuthProxyCookies(response, result);
  return response;
}
