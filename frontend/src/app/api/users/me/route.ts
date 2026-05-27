import { type NextRequest } from "next/server";
import {
  applyAuthProxyCookies,
  authenticatedBackendJson,
  clearAuthCookies,
  jsonFromBackend
} from "@/lib/auth/route-utils";

export async function DELETE(request: NextRequest) {
  const result = await authenticatedBackendJson<null>(request, "/users/me", {
    method: "DELETE"
  });
  const response = jsonFromBackend(result);

  if (result.payload?.success) {
    clearAuthCookies(response);
  } else {
    applyAuthProxyCookies(response, result);
  }

  return response;
}
