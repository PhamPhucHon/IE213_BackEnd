import { type NextRequest } from "next/server";
import type { User } from "@/types/models";
import {
  applyAuthProxyCookies,
  authenticatedBackendJson,
  jsonFromBackend
} from "@/lib/auth/route-utils";

type AdminUserStatusRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, { params }: AdminUserStatusRouteContext) {
  const { id } = await params;
  const result = await authenticatedBackendJson<User>(
    request,
    `/admin/users/${encodeURIComponent(id)}/toggle-status`,
    {
      method: "PUT"
    }
  );
  const response = jsonFromBackend(result);
  applyAuthProxyCookies(response, result);
  return response;
}
